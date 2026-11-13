
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

    const startDate = query.from ? parseISO(query.from) : undefined;
    const endDate = query.to ? parseISO(query.to) : undefined;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('"from" no puede ser mayor que "to"');
    }

    const applyFilters = (queryBuilder: Knex.QueryBuilder) => {
      if (status) queryBuilder.where('loan.status', status);
      if (search) queryBuilder.where('client.full_name', 'like', `%${search}%`);
      if (startDate)
        queryBuilder.where('loan.created_at', '>=', format(startDate, 'yyyy-MM-dd'));
      // Sumamos un día para que "to" incluya todo ese día
      if (endDate)
        queryBuilder.where('loan.created_at', '<', format(addDays(endDate, 1), 'yyyy-MM-dd'));
    };

    const dataQuery = this.knex('loan_application as loan')
      .join('client as client', 'client.id', 'loan.client_id')
      .select(
        'loan.id',
        'loan.client_id',
        'client.full_name as client_name',
        'loan.requested_amount',
        'loan.term_months',
        'loan.annual_interest_rate as interest_rate',
        'loan.status',
        'loan.created_at',
      )
      .modify(applyFilters)
      .orderBy([
        { column: 'loan.created_at', order: 'desc' },
        { column: 'loan.id', order: 'desc' },
      ])
      .limit(limit)
      .offset((page - 1) * limit);

    const countQuery = this.knex('loan_application as loan')
      .join('client as client', 'client.id', 'loan.client_id')
      .modify(applyFilters)
      .count({ total: '*' })
      .first();

    const [data, countResult] = await Promise.all([dataQuery, countQuery]);
    const total = Number(countResult?.total ?? 0);

    return {
      data: data as LoanApplicationListItem[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Trae una solicitud por id con sus cuotas
  async findByIdOrFail(
    id: number,
  ): Promise<LoanApplicationWithInstallments> {
    const loanApplication = await this.knex('loan_application as loan')
      .join('client as client', 'client.id', 'loan.client_id')
      .select(
        'loan.id',
        'loan.client_id',
        'client.full_name as client_name',
        'loan.requested_amount',
        'loan.term_months',
        'loan.annual_interest_rate as interest_rate',
        'loan.status',
        'loan.created_at',
      )
      .where('loan.id', id)
      .first();

    if (!loanApplication) {
      throw new NotFoundException('Solicitud de préstamo no encontrada');
    }

    const installments = await this.knex<Installment>('installment')
      .where({ loan_application_id: id })
      .orderBy('due_date');

    return { ...loanApplication, installments };
  }

  // crea solicitud; si viene aprobada genera las cuotas de una vez
  async create(
    dto: CreateLoanApplicationDto,
  ): Promise<LoanApplicationWithInstallments> {
    const applicationStatus = dto.status ?? 'pending';
    const interestRate = dto.interest_rate ?? DEFAULT_INTEREST_RATE;

    // Validar la existencia del cliente
    await this.clientsService.findByIdOrFail(dto.client_id);

    return this.knex.transaction(async (transaction) => {
      const [loanId] = await transaction('loan_application').insert({
        client_id: dto.client_id,
        requested_amount: dto.requested_amount,
        term_months: dto.term_months,
        annual_interest_rate: interestRate,
        status: applicationStatus,
      });

      if (applicationStatus === 'approved') {
        await this.insertFees(
          transaction,
          loanId,
          dto.requested_amount,
          dto.term_months,
          interestRate,
        );
      }

      return this.payFees(transaction, loanId);
    });
  }

  // pasa de pendiente a aprobada y arma el plan de mensualidades
  async approve(id: number): Promise<LoanApplicationWithInstallments> {
    return this.knex.transaction(async (transaction) => {
      const loanApplication = await transaction<LoanApplication>('loan_application')
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

      if (!loanApplication) {
        throw new NotFoundException('Solicitud de préstamo no encontrada');
      }

      if (loanApplication.status !== 'pending') {
        throw new BadRequestException(
          'Solo se pueden aprobar solicitudes pendientes',
        );
      }

      const existingInstallment = await transaction<Installment>('installment')
        .where({ loan_application_id: id })
        .first();

      if (existingInstallment) {
        throw new ConflictException(
          'Las cuotas de esta solicitud ya fueron generadas',
        );
      }

      await transaction('loan_application').where({ id }).update({ status: 'approved' });

      await this.insertFees(
        transaction,
        id,
        Number(loanApplication.requested_amount),
        loanApplication.term_months,
        Number(loanApplication.interest_rate),
      );

      return this.payFees(transaction, id);
    });
  }

  private async insertFees(
    transaction: Knex.Transaction,
    loanId: number,
    amount: number,
    termMonths: number,
    interestPercent: number,
  ) {
    const installmentPlan = buildInstallmentPlan(
      amount,
      termMonths,
      interestPercent / 100,
    );

    await transaction('installment').insert(
      installmentPlan.map((installment) => ({
        ...installment,
        loan_application_id: loanId,
      })),
    );
  }

  private async payFees(
    transaction: Knex.Transaction,
    id: number,
  ): Promise<LoanApplicationWithInstallments> {
    const loanApplication = await transaction<LoanApplication>('loan_application as loan')
      .join('client as client', 'client.id', 'loan.client_id')
      .select(
        'loan.id',
        'loan.client_id',
        'client.full_name as client_name',
        'loan.requested_amount',
        'loan.term_months',
        'loan.annual_interest_rate as interest_rate',
        'loan.status',
        'loan.created_at',
      )
      .where('loan.id', id)
      .first();

    const installments = await transaction<Installment>('installment')
      .where({ loan_application_id: id })
      .orderBy('due_date');

    return {
      ...(loanApplication as LoanApplication),
      installments,
    };
  }
}