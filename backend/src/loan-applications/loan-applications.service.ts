import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Knex } from 'knex';
import { addDays, format, parseISO } from 'date-fns';
import { KNEX_CONNECTION } from '../database/database.constants';
import type { PaginatedResponse } from '../common/interface/paginated-response.interface';
import { ClientsService } from '../clients/clients.service';
import { QueryLoanApplicationsDto } from './dto/query-loan-applications.dto';
import type {
  Installment,
  LoanApplication,
  LoanApplicationListItem,
  LoanApplicationWithInstallments,
} from './interface/loan-application.interface';
import { buildInstallmentPlan } from './utils/installments.util';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { ANNUAL_INTEREST_RATE } from './loan.constants';

@Injectable()
export class LoanApplicationsService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly clientsService: ClientsService,
  ) {}


  // Trae la lista de solicitudes de préstamo con paginación y filtros opcionales
  async findAll(
    query: QueryLoanApplicationsDto,
  ): Promise<PaginatedResponse<LoanApplicationListItem>> {
    const { page, limit, status } = query;

    const from = query.from ? parseISO(query.from) : undefined;
    const to = query.to ? parseISO(query.to) : undefined;

    if (from && to && from > to) {
      throw new BadRequestException('"from" no puede ser mayor que "to"');
    }

    const filtrar = (qb: Knex.QueryBuilder) => {
      if (status) qb.where('la.status', status);
      if (from) qb.where('la.created_at', '>=', format(from, 'yyyy-MM-dd'));
      // Sumamos un día para que "to" incluya todo ese día
      if (to)
        qb.where('la.created_at', '<', format(addDays(to, 1), 'yyyy-MM-dd'));
    };

    const datos = this.knex('loan_application as la')
      .join('client as c', 'c.id', 'la.client_id')
      .select(
        'la.id',
        'la.client_id',
        'c.full_name as client_name',
        'la.requested_amount',
        'la.term_months',
        'la.status',
        'la.created_at',
      )
      .modify(filtrar)
      .orderBy([
        { column: 'la.created_at', order: 'desc' },
        { column: 'la.id', order: 'desc' },
      ])
      .limit(limit)
      .offset((page - 1) * limit);

    const conteo = this.knex('loan_application as la')
      .modify(filtrar)
      .count({ total: '*' })
      .first();

    const [data, fila] = await Promise.all([datos, conteo]);
    const total = Number(fila?.total ?? 0);

    return {
      data: data as LoanApplicationListItem[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  //crea solicitud de préstamos y genera las cuotas si la solicitud es aprobada
  async create(
    dto: CreateLoanApplicationDto,
  ): Promise<LoanApplicationWithInstallments> {
    const status = dto.status ?? 'pending';

    // Validar la exietncia del cliente
    await this.clientsService.findByIdOrFail(dto.client_id);

    // Inserta la solicitud y las cuotas en una transacción
    return this.knex.transaction(async (trx) => {
      const [id] = await trx('loan_application').insert({
        client_id: dto.client_id,
        requested_amount: dto.requested_amount,
        term_months: dto.term_months,
        status,
      });


     // Si la solicitud es aprobada, entonces se generan las cuotas
      if (status === 'approved') {
        const plan = buildInstallmentPlan(
          dto.requested_amount,
          dto.term_months,
          ANNUAL_INTEREST_RATE
        );
        await trx('installment').insert(
          plan.map((cuota) => ({ ...cuota, loan_application_id: id })),
        );
      }

      // Retorna la solicitud con sus cuotas
      const solicitud = await trx<LoanApplication>('loan_application')
        .where({ id })
        .first();
      const cuotas = await trx<Installment>('installment')
        .where({ loan_application_id: id })
        .orderBy('due_date');

      return { ...(solicitud as LoanApplication), installments: cuotas };
    });
  }
}
