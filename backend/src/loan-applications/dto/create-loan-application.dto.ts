import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { LOAN_STATUSES } from './query-loan-applications.dto';
import type { LoanStatus } from './query-loan-applications.dto';
import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_INTEREST_RATE } from '../loan.constants';

export class CreateLoanApplicationDto {
  
  @ApiProperty({ description: 'ID del cliente' })
  @IsInt({ message: 'client_id debe ser un entero' })
  @IsPositive({ message: 'client_id debe ser positivo' })
  client_id: number;

  @ApiProperty({ description: 'Monto solicitado' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'requested_amount debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'requested_amount debe ser mayor a 0' })
  requested_amount: number;

  @ApiProperty({ description: 'Plazo en meses' })
  @IsInt({ message: 'term_months debe ser un entero' })
  @Min(1, { message: 'term_months debe ser al menos 1' })
  @Max(60, { message: 'term_months no puede ser mayor a 60' })
  term_months: number;

  @ApiProperty({
    description: 'Porcentaje de interés anual (ej. 15 = 15%)',
    required: false,
    default: DEFAULT_INTEREST_RATE,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'interest_rate debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'interest_rate no puede ser negativo' })
  @Max(100, { message: 'interest_rate no puede ser mayor a 100' })
  interest_rate?: number;

  @ApiProperty({ description: 'Estado de la solicitud (opcional)' })
  @IsOptional()
  @IsIn(LOAN_STATUSES, {
    message: `status debe ser uno de: ${LOAN_STATUSES.join(', ')}`,
  })
  status?: LoanStatus;
}