import { useState } from 'react';
import { createLoan, type LoanStatus } from '../api/api';

interface Props {
  onCreated: () => void;
}

export default function LoanForm({ onCreated }: Props) {
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('12');
  const [status, setStatus] = useState<LoanStatus>('pending');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!clientId || Number(amount) <= 0) {
      setError('Escribe el cliente y un monto mayor a 0');
      return;
    }

    setSending(true);
    try {
      await createLoan({
        client_id: Number(clientId),
        requested_amount: Number(amount),
        term_months: Number(term),
        status,
      });
      setClientId('');
      setAmount('');
      setTerm('12');
      setStatus('pending');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={enviar} className="formulario">
      <h2>Nueva solicitud</h2>

      <label>
        ID del cliente
        <input type="number" value={clientId} onChange={(e) => setClientId(e.target.value)} />
      </label>

      <label>
        Monto (L)
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>

      <label>
        Plazo (meses)
        <input type="number" value={term} onChange={(e) => setTerm(e.target.value)} />
      </label>

      <label>
        Estado
        <select value={status} onChange={(e) => setStatus(e.target.value as LoanStatus)}>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
        </select>
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={sending}>
        {sending ? 'Guardando...' : 'Crear solicitud'}
      </button>
    </form>
  );
}