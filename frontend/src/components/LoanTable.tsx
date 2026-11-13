import { memo, useState } from 'react';
import { approveLoan} from '../api/api';
import InstallmentsModal from './InstallmentsModal';
import type { Loan } from '../api/interface';

interface Props {
  loans: Loan[];
  onChanged: () => void;
}

const etiquetas = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
} as const;

function LoanTable({ loans, onChanged }: Props) {
  const [aproveeId, setAproveeId] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState('');
  const [fees, setFees] = useState<Loan | null>(null);

  const dinero = new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
  });

  async function aprovee(loan: Loan) {
    const ok = window.confirm(
      `¿Aprobar la solicitud de ${loan.client_name}? Se van a calcular las mensualidades.`,
    );
    if (!ok) return;

    setErrorAccion('');
    setAproveeId(loan.id);
    try {
      await approveLoan(loan.id);
      onChanged();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo aprobar');
    } finally {
      setAproveeId(null);
    }
  }

  return (
    <>
      {errorAccion && <p className="error">{errorAccion}</p>}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Plazo</th>
            <th>Interés</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id}>
              <td>{loan.id}</td>
              <td>{loan.client_name}</td>
              <td>{dinero.format(Number(loan.requested_amount))}</td>
              <td>{loan.term_months} meses</td>
              <td>{Number(loan.interest_rate)}%</td>
              <td>
                <span className={`badge ${loan.status}`}>
                  {etiquetas[loan.status]}
                </span>
              </td>
              <td>{new Date(loan.created_at).toLocaleDateString('es-HN')}</td>
              <td>
                {loan.status === 'pending' && (
                  <button
                    type="button"
                    className="btn-aprobar"
                    disabled={aproveeId === loan.id}
                    onClick={() => aprovee(loan)}
                  >
                    {aproveeId === loan.id ? 'Aprobando...' : 'Aprobar'}
                  </button>
                )}

                {loan.status === 'approved' && (
                  <button
                    type="button"
                    className="btn-secundario"
                    onClick={() => setFees(loan)}
                  >
                    Ver mensualidades
                  </button>
                )}

                {loan.status === 'rejected' && (
                  <span className="hint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {fees && (
        <InstallmentsModal loan={fees} onClose={() => setFees(null)} />
      )}
    </>
  );
}

export default memo(LoanTable);
