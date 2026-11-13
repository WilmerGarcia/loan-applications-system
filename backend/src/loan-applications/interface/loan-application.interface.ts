import type { LoanStatus } from '../dto/query-loan-applications.dto';

export interface LoanApplication {
  id: number;
  client_id: number;
  requested_amount: string;
  term_months: number;
  status: LoanStatus;
  created_at: Date;
}

export interface LoanApplicationListItem extends LoanApplication {
  client_name: string;
}

export interface Installment {
  id: number;
  loan_application_id: number;
  due_date: Date;
  amount: string;
  paid: boolean;
}

export interface LoanApplicationWithInstallments extends LoanApplication {
  installments: Installment[];
}