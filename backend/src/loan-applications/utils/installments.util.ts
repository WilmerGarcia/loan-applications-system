import { addMonths, format } from 'date-fns';

export interface InstallmentPlanItem {
  due_date: string;
  amount: number;
}

export function buildInstallmentPlan(
  amount: number,
  termMonths: number,
  annualRate: number,
  startDate: Date = new Date(),
): InstallmentPlanItem[] {
  const monthlyRate = annualRate / 12;

  // Cuota nivelada. Si la tasa es 0 la fórmula divide entre cero, así que ese caso se calcula aparte.
  const payment =
    monthlyRate === 0
      ? amount / termMonths
      : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

  // Redondeo a centavos: todas las cuotas es misma cantidad
  const paymentAmount = Math.round(payment * 100) / 100;

  const installments: InstallmentPlanItem[] = [];

  for (let month = 1; month <= termMonths; month++) {
    installments.push({
      due_date: format(addMonths(startDate, month), 'yyyy-MM-dd'),
      amount: paymentAmount,
    });
  }

  return installments;
}