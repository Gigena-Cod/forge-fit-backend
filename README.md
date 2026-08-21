# ForgeFit Backend

API modular (Route → Controller → Service → Repository → Mongoose/MongoDB) para ForgeFit. Cada request autenticado toma el `gymId` desde el JWT; nunca desde el body del frontend.

## Puesta en marcha

1. Copiá `.env.example` como `.env` y completá `MONGO_URI`, `MONGO_DB_NAME=forgefit` y `JWT_SECRET`.
2. Ejecutá `pnpm install`.
3. Cargá Apex con `pnpm db:seed`.
4. Ejecutá `pnpm dev`.

El seed crea `admin@apex.test` con contraseña `password123` solo para desarrollo.

## API

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- CRUD `/api/members`
- CRUD `/api/payments` y `GET /api/members/:memberId/payments`
- `GET /api/attendance` y `GET /api/members/:memberId/attendance`
- `GET` / `PUT /api/settings`

Las respuestas usan `{ "data": ... }`; los errores usan `{ "error": { "code", "message" } }`.
