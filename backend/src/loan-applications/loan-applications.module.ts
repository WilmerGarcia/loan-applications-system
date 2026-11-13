import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { LoanApplicationsController } from './loan-applications.controller';
import { LoanApplicationsService } from './loan-applications.service';

@Module({
  imports: [ClientsModule],
  controllers: [LoanApplicationsController],
  providers: [LoanApplicationsService]
})
export class LoanApplicationsModule {}
