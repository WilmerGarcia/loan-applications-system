# Sistema de solicitudes de préstamo

Aplicación para registrar y consultar solicitudes de préstamo. Permite buscar y filtrar solicitudes por cliente, estado y rango de fechas, aprobar solicitudes y consultar sus cuotas. 

## Tecnologías usadas

- **Frontend:** React, TypeScript y Vite.
- **Backend:** NestJS, TypeScript y Knex.
- **Base de datos:** MySQL.

## Requisitos

- Node.js y npm.
- Una instancia de MySQL.

## Configuración y ejecución

1. Crea la base de datos `loan_applications` en MySQL.
2. En `backend`, copia `.env.example` a `.env` y configura la conexión a la base de datos.
3. En una terminal, instala y prepara el backend:

   ```bash
   cd backend
   npm install
   npm run migrate:latest
   npm run seed:run
   npm run start:dev
   ```

4. En otra terminal, copia `frontend/.env.example` a `frontend/.env`. Ajusta `VITE_API_BACKEND_URL` si el backend no está en `http://localhost:3000`.
5. Instala y ejecuta el frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:5173`. 
La documentación de la API está en `http://localhost:3000/api/doc`.

## Endpoints principales

- `GET /loan-applications`: lista solicitudes con paginación y filtros opcionales (`status`, `search`, `from`, `to`).
- `POST /loan-applications`: crea una solicitud; el estado predeterminado es `pending`. Si se envía `status: "approved"`, también genera las cuotas.
- `PATCH /loan-applications/:id/approve`: aprueba una solicitud pendiente y genera sus cuotas.
