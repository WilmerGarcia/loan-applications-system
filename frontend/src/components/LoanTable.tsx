import { memo } from 'react';
import type { Loan } from '../api/api';

interface Props {
  loans: Loan[];
}

function LoanTable({ loans }: Props) {
  const dinero = new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' });

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Monto</th>
          <th>Plazo</th>
          <th>Estado</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        {loans.map((loan) => (
          <tr key={loan.id}>
            <td>{loan.id}</td>
            <td>{loan.client_name}</td>
            <td>{dinero.format(Number(loan.requested_amount))}</td>
            <td>{loan.term_months} meses</td>
            <td>
              <span className={`estado ${loan.status}`}>{loan.status}</span>
            </td>
            <td>{new Date(loan.created_at).toLocaleDateString('es-HN')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default memo(LoanTable);