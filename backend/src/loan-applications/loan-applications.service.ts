import {
  BadRequestException,
  ConflictException,
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
import { DEFAULT_INTEREST_RATE } from './loan.constants';

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
    const search = query.search?.trim();

    const from = query.from ? parseISO(query.from) : undefined;
    const to = query.to ? parseISO(query.to) : undefined;

    if (from && to && from > to) {
      throw new BadRequestException('"from" no puede ser mayor que "to"');
    }

    const filtrar = (qb: Knex.QueryBuilder) => {
      if (status) qb.where('la.status', status);
      if (search) qb.where('c.full_name', 'like', `%${search}%`);
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
        'la.annual_interest_rate as interest_rate',
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
      .join('client as c', 'c.id', 'la.client_id')
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

  // Trae una solicitud por id con sus cuotas
  async findByIdOrFail(
    id: number,
  ): Promise<LoanApplicationWithInstallments> {
    const solicitud = await this.knex('loan_application as la')
      .join('client as c', 'c.id', 'la.client_id')
      .select(
        'la.id',
        'la.client_id',
        'c.full_name as client_name',
        'la.requested_amount',
        'la.term_months',
        'la.annual_interest_rate as interest_rate',
        'la.status',
        'la.created_at',
      )
      .where('la.id', id)
      .first();

    if (!solicitud) {
      throw new NotFoundException('Solicitud de préstamo no encontrada');
    }

    const installments = await this.knex<Installment>('installment')
      .where({ loan_application_id: id })
      .orderBy('due_date');

    return { ...solicitud, installments };
  }

  // crea solicitud; si viene aprobada genera las cuotas de una vez
  async create(
    dto: CreateLoanApplicationDto,
  ): Promise<LoanApplicationWithInstallments> {
    const status = dto.status ?? 'pending';
    const interestRate = dto.interest_rate ?? DEFAULT_INTEREST_RATE;

    // Validar la existencia del cliente
    await this.clientsService.findByIdOrFail(dto.client_id);

    return this.knex.transaction(async (trx) => {
      const [id] = await trx('loan_application').insert({
        client_id: dto.client_id,
        requested_amount: dto.requested_amount,
        term_months: dto.term_months,
        annual_interest_rate: interestRate,
        status,
      });

      if (status === 'approved') {
        await this.insertarCuotas(
          trx,
          id,
          dto.requested_amount,
          dto.term_months,
          interestRate,
        );
      }

      return this.cargarConCuotas(trx, id);
    });
  }

  // pasa de pendiente a aprobada y arma el plan de mensualidades
  async approve(id: number): Promise<LoanApplicationWithInstallments> {
    return this.knex.transaction(async (trx) => {
      const solicitud = await trx<LoanApplication>('loan_application')
        .select(
          'id',
          'client_id',
          'requested_amount',
          'term_months',
          'annual_interest_rate as interest_rate',
          'status',
          'created_at',
        )
        .where({ id })
        .forUpdate()
        .first();

      if (!solicitud) {
        throw new NotFoundException('Solicitud de préstamo no encontrada');
      }

      if (solicitud.status !== 'pending') {
        throw new BadRequestException(
          'Solo se pueden aprobar solicitudes pendientes',
        );
      }

      const yaTieneCuotas = await trx<Installment>('installment')
        .where({ loan_application_id: id })
        .first();

      if (yaTieneCuotas) {
        throw new ConflictException(
          'Las cuotas de esta solicitud ya fueron generadas',
        );
      }

      await trx('loan_application').where({ id }).update({ status: 'approved' });

      await this.insertarCuotas(
        trx,
        id,
        Number(solicitud.requested_amount),
        solicitud.term_months,
        Number(solicitud.interest_rate),
      );

      return this.cargarConCuotas(trx, id);
    });
  }

  private async insertarCuotas(
    trx: Knex.Transaction,
    loanId: number,
    amount: number,
    termMonths: number,
    interestPercent: number,
  ) {
    const plan = buildInstallmentPlan(
      amount,
      termMonths,
      interestPercent / 100,
    );

    await trx('installment').insert(
      plan.map((cuota) => ({ ...cuota, loan_application_id: loanId })),
    );
  }

  private async cargarConCuotas(
    trx: Knex.Transaction,
    id: number,
  ): Promise<LoanApplicationWithInstallments> {
    const solicitud = await trx<LoanApplication>('loan_application as la')
      .join('client as c', 'c.id', 'la.client_id')
      .select(
        'la.id',
        'la.client_id',
        'c.full_name as client_name',
        'la.requested_amount',
        'la.term_months',
        'la.annual_interest_rate as interest_rate',
        'la.status',
        'la.created_at',
      )
      .where('la.id', id)
      .first();
    const cuotas = await trx<Installment>('installment')
      .where({ loan_application_id: id })
      .orderBy('due_date');

    return { ...(solicitud as LoanApplication), installments: cuotas };
  }
}
