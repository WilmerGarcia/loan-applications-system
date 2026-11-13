
const API_URL = import.meta.env.VITE_API_BACKEND_URL;

if (!API_URL) {
  throw new Error('Falta configurar VITE_API_BACKEND_URL en el archivo .env');
}

export type LoanStatus = 'pending' | 'approved' | 'rejected';

export interface Loan {
  id: number;
  client_name: string;
  requested_amount: string;
  term_months: number;
  status: LoanStatus;
  created_at: string;
}

export interface LoanList {
  data: Loan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Revisamos la respuesta del servidor y mostramos el mensaje si ocurre algún error
async function manejarRespuesta(respuesta: Response) {
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensajeError = Array.isArray(datos?.message)
      ? datos.message.join('. ')
      : datos?.message;

    throw new Error(mensajeError || 'Ocurrió un error al procesar la solicitud');
  }

  return datos;
}

// Obtener las solicitudes de préstamos
export async function getLoans(
  pagina: number,
  estado: string
): Promise<LoanList> {
  const parametros = new URLSearchParams({
    page: String(pagina),
    limit: '10',
  });

  if (estado) {
    parametros.set('status', estado);
  }

  const respuesta = await fetch(
    `${API_URL}/loan-applications?${parametros}`
  );

  return manejarRespuesta(respuesta);
}

// Crear una nueva solicitud de préstamo
export async function createLoan(prestamo: {
  client_id: number;
  requested_amount: number;
  term_months: number;
  status: LoanStatus;
}) {
  const respuesta = await fetch(`${API_URL}/loan-applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prestamo),
  });

  return manejarRespuesta(respuesta);
}
