import type { Client, LoanList, LoanDetail } from './interface';

const API_URL = import.meta.env.VITE_API_BACKEND_URL;

if (!API_URL) {
  throw new Error('Falta configurar VITE_API_BACKEND_URL en el archivo .env');
}

// Revisamos la respuesta del servidor y mostramos el mensaje si ocurre algún error
async function handleResponse(respuesta: Response) {
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensajeError = Array.isArray(datos?.message)
      ? datos.message.join('. ')
      : datos?.message;

    throw new Error(mensajeError || 'Ocurrió un error al procesar la solicitud');
  }

  return datos;
}

// Trae la lista de clientes
export async function getClients(): Promise<Client[]> {
  const respuesta = await fetch(`${API_URL}/clients`);
  return handleResponse(respuesta);
}

// Trae la lista de solicitudes de préstamo
export async function getLoans(
  pagina: number,
  estado: string,
  search = '',
): Promise<LoanList> {
  const parametros = new URLSearchParams({
    page: String(pagina),
    limit: '10',
  });

  if (estado) {
    parametros.set('status', estado);
  }
  if (search.trim()) {
    parametros.set('search', search.trim());
  }

  const respuesta = await fetch(
    `${API_URL}/loan-applications?${parametros}`
  );

  return handleResponse(respuesta);
}

// Trae una solicitud por id con sus cuotas
export async function getLoan(id: number): Promise<LoanDetail> {
  const respuesta = await fetch(`${API_URL}/loan-applications/${id}`);
  return handleResponse(respuesta);
}

// Crea una nueva solicitud de préstamo
export async function createLoan(prestamo: {
  client_id: number;
  requested_amount: number;
  term_months: number;
  interest_rate?: number;
}) {
  const respuesta = await fetch(`${API_URL}/loan-applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prestamo),
  });

  return handleResponse(respuesta);
}

// Aprueba una solicitud de préstamo
export async function approveLoan(id: number): Promise<LoanDetail> {
  const respuesta = await fetch(`${API_URL}/loan-applications/${id}/approve`, {
    method: 'PATCH',
  });

  return handleResponse(respuesta);
}
