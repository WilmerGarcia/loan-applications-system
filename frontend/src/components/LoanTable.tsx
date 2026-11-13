import { memo, useState } from 'react';
import { approveLoan, type Loan } from '../api/api';
import InstallmentsModal from './InstallmentsModal';

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
  const [aprobandoId, setAprobandoId] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState('');
  const [verCuotas, setVerCuotas] = useState<Loan | null>(null);

  const dinero = new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
  });

  async function aprobar(loan: Loan) {
    const ok = window.confirm(
      `¿Aprobar la solicitud de ${loan.client_name}? Se van a calcular las mensualidades.`,
    );
    if (!ok) return;

    setErrorAccion('');
    setAprobandoId(loan.id);
    try {
      await approveLoan(loan.id);
      onChanged();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo aprobar');
    } finally {
      setAprobandoId(null);
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
                    disabled={aprobandoId === loan.id}
                    onClick={() => aprobar(loan)}
                  >
                    {aprobandoId === loan.id ? 'Aprobando...' : 'Aprobar'}
                  </button>
                )}

                {loan.status === 'approved' && (
                  <button
                    type="button"
                    className="btn-secundario"
                    onClick={() => setVerCuotas(loan)}
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

      {verCuotas && (
        <InstallmentsModal loan={verCuotas} onClose={() => setVerCuotas(null)} />
      )}
    </>
  );
}

export default memo(LoanTable);
