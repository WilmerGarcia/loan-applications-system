import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { LOAN_STATUSES } from './query-loan-applications.dto';
import type { LoanStatus } from './query-loan-applications.dto';

export class CreateLoanApplicationDto {
  @IsInt({ message: 'client_id debe ser un entero' })
  @IsPositive({ message: 'client_id debe ser positivo' })
  client_id: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'requested_amount debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'requested_amount debe ser mayor a 0' })
  requested_amount: number;

  @IsInt({ message: 'term_months debe ser un entero' })
  @Min(1, { message: 'term_months debe ser al menos 1' })
  @Max(60, { message: 'term_months no puede ser mayor a 60' })
  term_months: number;

  @IsOptional()
  @IsIn(LOAN_STATUSES, {
    message: `status debe ser uno de: ${LOAN_STATUSES.join(', ')}`,
  })
  status?: LoanStatus;
}