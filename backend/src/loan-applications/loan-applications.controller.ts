import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { QueryLoanApplicationsDto } from './dto/query-loan-applications.dto';
import { LoanApplicationsService } from './loan-applications.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';

@Controller('loan-applications')
export class LoanApplicationsController {
  constructor(private readonly service: LoanApplicationsService) {}

  @Get()
  findAll(@Query() query: QueryLoanApplicationsDto) {
    return this.service.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateLoanApplicationDto) {
    return this.service.create(dto);
  }
}