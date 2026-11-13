import { useEffect, useState } from 'react';
import { getLoan, type Installment, type Loan } from '../api/api';

interface Props {
  loan: Loan;
  onClose: () => void;
}

export default function InstallmentsModal({ loan, onClose }: Props) {
  const [cuotas, setCuotas] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dinero = new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
  });

  useEffect(() => {
    let cancelado = false;

    getLoan(loan.id)
      .then((detalle) => {
        if (!cancelado) setCuotas(detalle.installments);
      })
      .catch((err) => {
        if (!cancelado) {
          setError(
            err instanceof Error ? err.message : 'No se pudieron cargar las cuotas',
          );
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [loan.id]);

  return (
    <div className="modal-fondo" onClick={onClose}>
      <div
        className="modal modal-ancho"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="titulo-mensualidades"
      >
        <div className="modal-cabecera">
          <h2 id="titulo-mensualidades">Mensualidades</h2>
          <button type="button" className="btn-cerrar" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="hint">
          {loan.client_name} · {dinero.format(Number(loan.requested_amount))} ·{' '}
          {loan.term_months} meses · {Number(loan.interest_rate)}%
        </p>

        <div className="modal-contenido-scroll">
          {loading && <p>Cargando cuotas...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && cuotas.length === 0 && (
            <p>Esta solicitud no tiene mensualidades registradas.</p>
          )}

          {!loading && cuotas.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vence</th>
                  <th>Monto</th>
                  <th>Pagada</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((cuota, i) => (
                  <tr key={cuota.id}>
                    <td>{i + 1}</td>
                    <td>
                      {new Date(cuota.due_date).toLocaleDateString('es-HN')}
                    </td>
                    <td>{dinero.format(Number(cuota.amount))}</td>
                    <td>{cuota.paid ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-acciones">
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
