import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { QueryLoanApplicationsDto } from './dto/query-loan-applications.dto';
import { LoanApplicationsService } from './loan-applications.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Loan Applications')
@Controller('loan-applications')
export class LoanApplicationsController {
  constructor(private readonly service: LoanApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener solicitudes de préstamos' })
  findAll(@Query() query: QueryLoanApplicationsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una solicitud con sus mensualidades' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByIdOrFail(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva solicitud de préstamo' })
  create(@Body() dto: CreateLoanApplicationDto) {
    return this.service.create(dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprobar una solicitud pendiente' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.service.approve(id);
  }
}
