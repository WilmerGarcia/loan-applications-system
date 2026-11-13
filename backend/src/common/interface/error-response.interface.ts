export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[]; // errores de validación
  path: string;
  timestamp: string;
}