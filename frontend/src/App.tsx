import { useEffect, useState } from 'react';
import { getLoans } from './api/api';
import type { LoanList } from './api/interface';
import LoanForm from './components/LoanForm';
import LoanTable from './components/LoanTable';
import { useDebounce } from './hooks/useDebounce';

export default function App() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loans, setLoans] = useState<LoanList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  const debouncedStatus = useDebounce(status, 400);
  const debouncedSearch = useDebounce(search, 400);
  const debouncedFrom = useDebounce(from, 400);
  const debouncedTo = useDebounce(to, 400);

  useEffect(() => {
    // Si el filtro cambia mientras carga, ignoramos la respuesta vieja
    let ignore = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');

    getLoans(
      page,
      debouncedStatus,
      debouncedSearch,
      debouncedFrom,
      debouncedTo,
    )
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
  }, [
    page,
    debouncedStatus,
    debouncedSearch,
    debouncedFrom,
    debouncedTo,
    reloadCount,
  ]);

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
      <header className="cabecera">
        <h1>Solicitudes de crédito</h1>
        <LoanForm onCreated={handleCreated} />
      </header>

      <div className="filters">
        <label htmlFor="search">Buscar</label>
        <input
          id="search"
          type="search"
          value={search}
          placeholder="Nombre del cliente"
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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
        <label htmlFor="from">Desde</label>
        <input
          id="from"
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
        <label htmlFor="to">Hasta</label>
        <input
          id="to"
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && <p>Cargando...</p>}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={reload}>Reintentar</button>
        </div>
      )}

      {isEmpty && <p>No hay solicitudes con ese filtro.</p>}

      {hasData && <LoanTable loans={loans.data} onChanged={reload} />}

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
