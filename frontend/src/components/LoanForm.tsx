import { useEffect, useState } from 'react';
import { createLoan, getClients } from '../api/api';
import type { Client } from '../api/interface';
import type { LoanStatus } from '../api/types';

interface Props {
  onCreated: () => void;
}

export default function LoanForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [loadingClient, SetLoadingClient] = useState(false);
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('12');
  const [interes, setInteres] = useState('15');
  const [status, setStatus] = useState<LoanStatus>('pending');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    SetLoadingClient(true);
    setError('');

    getClients()
      .then((lista) => {
        if (cancelado) return;
        setClientes(lista);
        if (lista.length > 0) {
          setClientId(String(lista[0].id));
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(
            err instanceof Error ? err.message : 'No se pudieron cargar los clientes',
          );
        }
      })
      .finally(() => {
        if (!cancelado) SetLoadingClient(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open]);

  function cerrar() {
    setOpen(false);
    setError('');
    setAmount('');
    setTerm('12');
    setInteres('15');
    setStatus('pending');
    setClientId('');
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!clientId || Number(amount) <= 0) {
      setError('Escoge un cliente y un monto mayor a 0');
      return;
    }

    if (Number(interes) < 0 || Number(interes) > 100) {
      setError('El interés tiene que estar entre 0 y 100');
      return;
    }

    setSending(true);
    try {
      await createLoan({
        client_id: Number(clientId),
        requested_amount: Number(amount),
        term_months: Number(term),
        interest_rate: Number(interes),
        status,
      });
      cerrar();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Nueva solicitud
      </button>

      {open && (
        <div className="modal-fondo" onClick={cerrar}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="titulo-nueva-solicitud"
          >
            <div className="modal-cabecera">
              <h2 id="titulo-nueva-solicitud">Nueva solicitud</h2>
              <button type="button" className="btn-cerrar" onClick={cerrar}>
                ×
              </button>
            </div>

            <form onSubmit={enviar} className="formulario">
              <label>
                Cliente
                {loadingClient ? (
                  <p className="hint">Cargando clientes...</p>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    {clientes.length === 0 && (
                      <option value="">No hay clientes</option>
                    )}
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} — {c.dni}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label>
                Monto (L)
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>

              <label>
                Plazo (meses)
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  required
                />
              </label>

              <label>
                Interés anual (%)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={interes}
                  onChange={(e) => setInteres(e.target.value)}
                  required
                />
              </label>

              <label>
                Estado
                <select
                  value={status}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === 'pending' ||
                      value === 'approved' ||
                      value === 'rejected'
                    ) {
                      setStatus(value);
                    }
                  }}
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobada</option>
                  <option value="rejected">Rechazada</option>
                </select>
              </label>

              {error && <p className="error">{error}</p>}

              <div className="modal-acciones">
                <button type="button" className="btn-secundario" onClick={cerrar}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending || loadingClient || !clientId}
                >
                  {sending ? 'Guardando...' : 'Crear solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
