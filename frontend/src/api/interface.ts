import type { LoanStatus } from "./types";

export interface Client {
  id: number;
  full_name: string;
  dni: string;
  monthly_income: string;
}

export interface Installment {
  id: number;
  loan_application_id: number;
  due_date: string;
  amount: string;
  paid: boolean;
}

export interface Loan {
  id: number;
  client_id: number;
  client_name: string;
  requested_amount: string;
  term_months: number;
  interest_rate: string;
  status: LoanStatus;
  created_at: string;
}

export interface LoanDetail extends Loan {
  installments: Installment[];
}

export interface LoanList {
  data: Loan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
