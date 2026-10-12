# ForgeFit Backend

API modular (Route → Controller → Service → Repository → Mongoose/MongoDB) para ForgeFit. Cada request autenticado toma el `gymId` desde el JWT; nunca desde el body del frontend.

## Puesta en marcha

1. Copiá `.env.example` como `.env` y completá `MONGO_URI`, `MONGO_DB_NAME=forgefit` y `JWT_SECRET`.
2. Ejecutá `pnpm install`.
3. Cargá Apex con `pnpm db:seed`.
4. Ejecutá `pnpm dev`.

El seed crea `admin@apex.test` con contraseña `password123` solo para desarrollo.

## Deploy en Vercel

1. Importá este repositorio en Vercel con la raíz del proyecto en `.` y el preset **Express**. El build está definido en `vercel.json`; dejá el Output Directory sin configurar.
2. Agregá estas variables de entorno para Production y, si corresponde, Preview:
   - `MONGO_URI`: URI de MongoDB Atlas, con credenciales y acceso de red habilitado desde Vercel.
   - `MONGO_DB_NAME`: nombre de la base (por ejemplo, `forgefit`). Usá una base separada para Preview.
   - `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres.
   - `JWT_EXPIRES_IN`: por ejemplo, `1d`.
   - `FRONTEND_URL`: origen exacto del frontend publicado, sin barra final (para CORS).
3. Desplegá y verificá `https://<tu-proyecto>.vercel.app/api/health`; debe devolver `{"status":"ok"}`. Luego probá login para verificar también la conexión a MongoDB: health solo comprueba que la API responde.

Vercel usa el export default de `src/app.ts`. La conexión a MongoDB se inicia al recibir solicitudes de la API y se comparte entre solicitudes concurrentes de la misma instancia. `PORT` solo es necesario para ejecución local. El seed no se ejecuta durante el deploy.

También podés desplegar desde la raíz con `pnpm dlx vercel` (preview) o `pnpm dlx vercel --prod` (producción), después de configurar las variables en el proyecto de Vercel.

Referencia: [Express en Vercel](https://vercel.com/docs/frameworks/backend/express).

## API

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- CRUD `/api/members`
- CRUD `/api/payments` y `GET /api/members/:memberId/payments`
- `GET /api/attendance` y `GET /api/members/:memberId/attendance`
- `GET` / `PUT /api/settings`

Las respuestas usan `{ "data": ... }`; los errores usan `{ "error": { "code", "message" } }`.

## Pruebas

```powershell
pnpm test                  # Unitarias e integración
pnpm test:unit             # Solo unitarias, sin MongoDB
pnpm test:integration      # HTTP real con MongoDB temporal
pnpm test:typecheck        # Tipos de las pruebas y configuración
pnpm build
```

Las pruebas de integración arrancan un replica set local temporal con base aleatoria, independiente del `.env` y de la base de desarrollo. Supertest llama a la aplicación Express sin iniciar el servidor de desarrollo. Cada caso limpia sus documentos y conserva los índices; al terminar se detiene MongoDB.

La primera ejecución requiere descargar MongoDB 8.2.6 (o durante la instalación); después se reutiliza la caché. No hace falta Docker ni ejecutar el seed. Las fábricas de `tests/support/fixtures.ts` generan gimnasios, usuarios de los tres roles, socios, pagos, asistencias y JWT exclusivos de prueba.

Ver alcance y guía de extensión en [SDD-00 Base de pruebas de integración](docs/specs/00-base-pruebas-integracion.md).
