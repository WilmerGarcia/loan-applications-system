# Sistema de solicitudes de préstamo

Aplicación para registrar y consultar solicitudes de préstamo. Permite buscar y filtrar solicitudes por cliente, estado y rango de fechas, aprobar solicitudes y consultar sus cuotas. 

## Tecnologías usadas

- **Frontend:** React, TypeScript y Vite.
- **Backend:** NestJS, TypeScript y Knex.
- **Base de datos:** MySQL.

## Requisitos

- Node.js `v22.15.0` y npm `11.8.0` (versiones utilizadas para este proyecto).
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


Preguntas de la prueba técnica:

1. ¿Cuándo usarías una transacción con Knex en este ejercicio, y en qué parte 
del flujo la aplicarías? 
R// Cuando se tiene que escribir en la db y para eso hay varias inserciones, se deben de cumplir todas o no se cumple ninguna.
Para esta prueba técnica se utiliza transacciones en create y approve para asegurar que las operaciones relacionadas se completen de manera exitosa y evitar que queden datos inconsistentes si ocurre un error.
En approve, también utilizo forUpdate() para bloquear temporalmente la solicitud y evitar que dos usuarios la aprueben al mismo tiempo.


1. ¿Qué diferencia práctica hay entre un Guard y un Interceptor en NestJS? 
La diferencia es que un ward nos ayuda a decidir cuando una petición puede continuar o no y un interceptor nos ayuda a poder hacer algo con la petición o la respuesta antes de que termine el proceso por ejemplo medir tiempos de respuestao tener un control de los errores. 


1. ¿Qué harías para evitar que la tabla de solicitudes en React se re-renderice 
innecesariamente al escribir en el buscador? 
Usar debounce en la búsqueda, para que la petición solo se actualice cuando el usuario termina de escribir y no en cada tecla. En este proyecto ya se utiliza debounce con un timpo de 300-500 ms.