import { useEffect, useState } from 'react';
import { getLoans, type LoanList } from './api/api';
import LoanForm from './components/LoanForm';
import LoanTable from './components/LoanTable';
import { useDebounce } from './hooks/useDebounce';

export default function App() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loans, setLoans] = useState<LoanList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  const debouncedStatus = useDebounce(status, 400);

  useEffect(() => {
    // Si el filtro cambia mientras carga, ignoramos la respuesta vieja
    let ignore = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');

    getLoans(page, debouncedStatus)
      .then((data) => {
        if (!ignore) setLoans(data);
      })
      .catch((err) => {
        if (ignore) return;
        setError(
          err instanceof TypeError
            ? 'No se pudo conectar con el servidor'
            : err.message,
        );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, debouncedStatus, reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleCreated = () => {
    setPage(1);
    reload();
  };

  const totalPages = loans?.meta.totalPages ?? 1;
  const isEmpty = !loading && !error && loans?.data.length === 0;
  const hasData = !loading && !error && loans && loans.data.length > 0;

  return (
    <main>
      <h1>Solicitudes de crédito</h1>

      <LoanForm onCreated={handleCreated} />

      <div className="filters">
        <label htmlFor="status">Estado</label>
        <select
          id="status"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
        </select>
      </div>

      {loading && <p>Cargando...</p>}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={reload}>Reintentar</button>
        </div>
      )}

      {isEmpty && <p>No hay solicitudes con ese filtro.</p>}

      {hasData && <LoanTable loans={loans.data} />}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Siguiente
        </button>
      </div>
    </main>
  );
}