
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export const LOAN_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type LoanStatus = (typeof LOAN_STATUSES)[number];

export class QueryLoanApplicationsDto {
  @ApiProperty({ description: 'Número de página (predeterminado: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor que 0' })
  page: number = 1;

  @ApiProperty({ description: 'Número máximo de resultados por página (predeterminado: 10, máximo: 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit: number = 10;

  @ApiProperty({ description: `Filtrar por estado de la solicitud (${LOAN_STATUSES.join(', ')})` })
  @IsOptional()
  @IsIn(LOAN_STATUSES, {
    message: `El estado debe ser: ${LOAN_STATUSES.join(', ')}`,
  })
  status?: LoanStatus;

  @ApiProperty({ description: 'Buscar por nombre del cliente', required: false })
  @IsOptional()
  @IsString({ message: 'search debe ser texto' })
  @MaxLength(100, { message: 'search no puede superar 100 caracteres' })
  search?: string;
  
  @ApiProperty({ description: 'Fecha inicial para filtrar las solicitudes' })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha inicial debe tener formato YYYY-MM-DD' },
  )
  from?: string;

  @ApiProperty({ description: 'Fecha final para filtrar las solicitudes' })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha final debe tener formato YYYY-MM-DD' },
  )
  to?: string;
}
