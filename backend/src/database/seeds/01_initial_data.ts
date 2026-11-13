import type { Knex } from 'knex';
import { format, isBefore, parseISO, subDays } from 'date-fns';
import { buildInstallmentPlan } from '../../loan-applications/utils/installments.util';
import { ANNUAL_INTEREST_RATE } from '../../loan-applications/loan.constants';

// Clientes de prueba
const clients = [
  { full_name: 'Carlos Mendoza', dni: '0801199012345', monthly_income: 25000 },
  { full_name: 'María López', dni: '0801199212346', monthly_income: 32000 },
  { full_name: 'José Martínez', dni: '0801198812347', monthly_income: 18000 },
  { full_name: 'Ana García', dni: '0801199512348', monthly_income: 45000 },
  { full_name: 'Luis Hernández', dni: '0801198712349', monthly_income: 55000 },
  { full_name: 'Sofía Flores', dni: '0801199312350', monthly_income: 28000 },
  { full_name: 'Miguel Reyes', dni: '0801198912351', monthly_income: 38000 },
  { full_name: 'Daniela Castro', dni: '0801199612352', monthly_income: 60000 },
  { full_name: 'Pedro Sánchez', dni: '0801198512353', monthly_income: 22000 },
  { full_name: 'Valeria Cruz', dni: '0801199412354', monthly_income: 42000 },
  { full_name: 'Andrés Rivera', dni: '0801199112355', monthly_income: 35000 },
  { full_name: 'Camila Ortiz', dni: '0801199712356', monthly_income: 50000 },
  { full_name: 'Fernando Díaz', dni: '0801198612357', monthly_income: 30000 },
  { full_name: 'Isabella Romero', dni: '0801199812358', monthly_income: 65000 },
  { full_name: 'Ricardo Aguilar', dni: '0801198412359', monthly_income: 20000 },
];

const loanAmounts = [
  60000, 85000, 120000, 150000,
  200000, 250000, 350000, 450000,
];

// Plazos de préstamo en meses
const loanTerms = [6, 12, 18, 24, 36, 48];

// Total de préstamos a generar
const totalLoans = 50;

type LoanStatus = 'pending' | 'approved' | 'rejected';

// Esta regla es únicamente para generar diferentes escenarios de prueba.
function getLoanStatus(
  amount: number,
  term: number,
  monthlyIncome: number,
  daysSinceRequest: number,
): LoanStatus {
  if (daysSinceRequest <= 7) {
    return 'pending';
  }

  // La cuota incluye interés
  const [firstInstallment] = buildInstallmentPlan(
    amount,
    term,
    ANNUAL_INTEREST_RATE,
  );

  if (firstInstallment.amount > monthlyIncome * 0.45) {
    return 'rejected';
  }

  return Math.random() < 0.85 ? 'approved' : 'pending';
}

// Cuotas de un préstamo aprobado
function createInstallments(
  loanId: number,
  amount: number,
  term: number,
  requestDate: Date,
) {
  const today = new Date();

  return buildInstallmentPlan(
    amount,
    term,
    ANNUAL_INTEREST_RATE,
    requestDate,
  ).map((item) => ({
    loan_application_id: loanId,
    due_date: item.due_date,
    amount: item.amount,
    paid: isBefore(parseISO(item.due_date), today) && Math.random() < 0.85,
  }));
}

export async function seed(knex: Knex): Promise<void> {
  // Primero limpiamos las tablas que tienen relaciones. Así evitamos conflictos con las llaves foráneas.
  await knex.transaction(async (trx) => {
    await trx('installment').del();
    await trx('loan_application').del();
    await trx('client').del();

    // Registramos los clientes.
    await trx('client').insert(
      clients.map((client) => ({
        ...client,
        created_at: subDays(new Date(), 500),
      })),
    );

    const savedClients = await trx('client')
      .select('id', 'monthly_income')
      .orderBy('id');

    const installments = [];

    // Crear las solicitudes de préstamo.
    for (let i = 0; i < totalLoans; i++) {
      const client = savedClients[
        Math.floor(Math.random() * savedClients.length)
      ];

      const amount =
        loanAmounts[Math.floor(Math.random() * loanAmounts.length)];

      const term =
        loanTerms[Math.floor(Math.random() * loanTerms.length)];

      const daysSinceRequest = Math.floor(Math.random() * 420);
      const requestDate = subDays(new Date(), daysSinceRequest);

      const status = getLoanStatus(
        amount,
        term,
        Number(client.monthly_income),
        daysSinceRequest,
      );

      const [loanId] = await trx('loan_application').insert({
        client_id: client.id,
        requested_amount: amount,
        term_months: term,
        status,
        created_at: requestDate,
      });

      // Solo los préstamos aprobados tienen cuotas.
      if (status === 'approved') {
        installments.push(
          ...createInstallments(Number(loanId), amount, term, requestDate),
        );
      }
    }

    // Insertar todas las cuotas generadas en grupos de 100.
    if (installments.length > 0) {
      await trx.batchInsert('installment', installments, 100);
    }
  });
}