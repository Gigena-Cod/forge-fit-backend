# ForgeFit — Endpoints implementados y pendientes

Revisión: 27 de septiembre de 2026. Código de referencia: `febbf82`.

Este documento compara el backend actual con **Sistema Web de Gestión para Gimnasios ForgeFit - Borrador.docx**, especialmente las secciones 11.2–11.4, 12 y 15. Sirve como inventario de API y lista de trabajo para completar la primera versión.

**Hay 32 endpoints implementados en el código.** Se completaron las rutas propuestas de QR, habilitación, check-in, usuarios, roles y reportes. Las reglas operativas y los permisos están cubiertos por pruebas HTTP con MongoDB temporal.

La revisión es estática de rutas, controladores, servicios, repositorios y modelos. “Implementado” significa que existe código conectado a una ruta; no implica que se haya probado contra una base de datos ni validado en producción. No se auditaron las imágenes de los diagramas ni un frontend.

## 1. Convenciones actuales

- Prefijo: `/api`.
- Autenticación: `Authorization: Bearer <token>` en las rutas protegidas.
- El `gymId` se obtiene del JWT para las operaciones del gimnasio.
- Respuestas habituales: `{ "data": ... }`.
- Excepciones: salud devuelve `{ "status": "ok" }`; los DELETE exitosos devuelven `204` sin cuerpo.
- Errores: `{ "error": { "code": "...", "message": "..." } }`.
- Los PUT de socios y pagos exigen todos los campos obligatorios de creación; no son actualizaciones parciales.
- Las listas actuales no implementan filtros por query, paginación ni búsqueda.
- Tener JWT permite acceder a las rutas protegidas: no hay autorización diferenciada por rol.

## 2. Inventario de endpoints existentes

Cada combinación de método y ruta cuenta como un endpoint. Las rutas anidadas se agrupan por su función.

| # | Método | Ruta | Acceso actual | Función y observaciones |
| --- | --- | --- | --- | --- |
| 1 | GET | `/api/health` | Público | Salud básica de la aplicación; no comprueba MongoDB. |
| 2 | POST | `/api/auth/register` | Público | Crea un gimnasio y su propietario `OWNER`; no crea empleados dentro del gimnasio existente. |
| 3 | POST | `/api/auth/login` | Público | Valida email/contraseña y devuelve JWT, usuario y gimnasio. |
| 4 | GET | `/api/auth/me` | JWT | Consulta el usuario autenticado y su gimnasio. |
| 5 | GET | `/api/members` | JWT | Lista socios del gimnasio. |
| 6 | GET | `/api/members/:id` | JWT | Consulta un socio y su estado administrativo. |
| 7 | POST | `/api/members` | JWT | Registra un socio. |
| 8 | PUT | `/api/members/:id` | JWT | Modifica datos; permite cambiar `membershipStatus`. |
| 9 | DELETE | `/api/members/:id` | JWT | Elimina físicamente al socio; no cumple la baja con conservación de datos de RF04. |
| 10 | GET | `/api/payments` | JWT | Lista pagos/cuotas del gimnasio. |
| 11 | GET | `/api/payments/:id` | JWT | Consulta un registro de pago/cuota. |
| 12 | POST | `/api/payments` | JWT | Crea un pago/cuota; verifica que el socio pertenezca al gimnasio. |
| 13 | PUT | `/api/payments/:id` | JWT | Modifica un pago/cuota; no revalida la pertenencia del nuevo `memberId`. |
| 14 | DELETE | `/api/payments/:id` | JWT | Elimina físicamente el registro, comprometiendo la conservación del historial. |
| 15 | GET | `/api/members/:memberId/payments` | JWT | Consulta el historial registrado para un socio. |
| 16 | GET | `/api/attendance` | JWT | Lista asistencias, con nombre del socio y orden por ingreso descendente. |
| 17 | GET | `/api/members/:memberId/attendance` | JWT | Consulta asistencias del socio, ordenadas por ingreso descendente. |
| 18 | GET | `/api/settings` | JWT | Consulta datos del gimnasio y del usuario autenticado. |
| 19 | PUT | `/api/settings` | JWT | Actualiza datos del gimnasio y del usuario autenticado; no administra otros usuarios. |

### Datos que reciben las escrituras actuales

| Operación | Campos del body |
| --- | --- |
| Registro | `gym: { name, address, phone, contactEmail }`, `administrator: { fullName, dni, phone, email, password }`. Contraseña de al menos 8 caracteres. |
| Login | `email`, `password`. |
| Crear/modificar socio | `name`, `dni`, `phone`, `email`, `registrationDate`, `membershipStatus`; `birthDate` opcional o nulo. Fechas `YYYY-MM-DD`; estado `ACTIVE` o `INACTIVE`. |
| Crear/modificar pago | `memberId`, `period`, `amount`, `status`; `paymentDate` y `paymentMethod` opcionales o nulos. Período con formato `YYYY-MM`, importe entero positivo, estado `PAID`, `PENDING` u `OVERDUE`; medio `CASH`, `TRANSFER` o `CARD`. |
| Modificar configuración | `gym: { name, address, phone, contactEmail }`, `administrator: { fullName, dni, phone, email }`. |

El estado del pago se recibe del cliente: no se calcula automáticamente el vencimiento ni la habilitación. La validación de `period` comprueba el formato, no que el mes esté entre 01 y 12. La unidad monetaria de `amount` debe definirse explícitamente antes de integrar cobros.

## 3. Cobertura de los requerimientos del borrador

**Implementado:** operación respaldada por el código. **Parcial:** hay una base, pero falta una regla o parte del flujo. **Pendiente:** no existe implementación del comportamiento requerido.

| RF | Requerimiento | Estado | Evidencia o trabajo faltante |
| --- | --- | --- | --- |
| RF01 | Registrar socio | Implementado | `POST /api/members`. |
| RF02 | Modificar socio | Implementado | `PUT /api/members/:id`. |
| RF03 | Consultar socio | Implementado | GET de socios y detalle. |
| RF04 | Dar de baja sin borrar historial | Implementado | `PATCH /api/members/:id/status` y DELETE aplican baja lógica con `INACTIVE`. |
| RF05 | Consultar estado y habilitación | Implementado | `GET /api/members/:id/access-status` evalúa estado y cuota actual. |
| RF06 | Registrar pago | Implementado | `POST /api/payments`; la regla de habilitación se trata en RF09. |
| RF07 | Consultar estado de cuotas | Implementado | La consulta de habilitación informa cuota PAID, PENDING, OVERDUE, MISSING o CONFLICT. |
| RF08 | Mantener historial de pagos | Implementado | DELETE anula el pago con `VOID`, motivo, actor y fecha; no elimina el documento. |
| RF09 | Validar habilitación de ingreso | Implementado | Servicio compartido por consulta de habilitación y check-in. |
| RF10 | Generar o asociar QR | Implementado | POST/GET de QR por socio, con emisión y rotación. |
| RF11 | Leer QR | Implementado en backend | Check-in recibe el payload leído; la cámara/lector pertenece al frontend. |
| RF12 | Identificar socio por QR | Implementado | Check-in busca el digest del QR dentro del gimnasio autenticado. |
| RF13 | Registrar asistencia | Implementado | Check-in crea asistencia ALLOWED solo cuando autoriza el ingreso. |
| RF14 | Registrar fecha y hora | Implementado | Check-in asigna `entryAt` con la hora del servidor. |
| RF15 | Confirmar acceso | Implementado | Check-in responde `ACCESS_GRANTED` y la asistencia creada. |
| RF16 | Rechazar acceso | Implementado | Check-in devuelve QR_INVALID, MEMBER_INACTIVE o motivo de pago sin crear asistencia. |
| RF17 | Gestionar usuarios | Implementado | GET/POST/PATCH de `/api/users` dentro del gimnasio. |
| RF18 | Gestionar roles | Implementado | Catálogo `/api/roles` y roles OWNER, ADMIN y RECEPTIONIST. |
| RF19 | Controlar permisos por rol | Implementado | Middleware `requirePermission` aplica permisos por acción. |
| RF20 | Autenticar usuario | Implementado | Login, hash de contraseña y verificación de JWT. |
| RF21 | Consultar asistencias | Implementado | GET general y por socio con permiso `attendance:read`. |
| RF22 | Consultar reportes administrativos | Implementado | Reportes de socios, pagos y asistencias en `/api/reports/*`. |

Estos estados no representan un porcentaje de avance: los requerimientos tienen tamaños distintos y varios se resuelven mediante un mismo flujo.

## 4. Endpoints incorporados para completar la primera versión

Las siguientes **13 combinaciones de método y ruta fueron incorporadas**. El borrador define funcionalidades, no rutas HTTP; este contrato es la implementación adoptada.

| Prioridad | Método | Ruta | Objetivo | Requerimientos |
| --- | --- | --- | --- | --- |
| Alta | PATCH | `/api/members/:id/status` | Activar/inactivar al socio conservando todos sus datos. También puede resolverse con el PUT existente. | RF04 |
| Alta | GET | `/api/members/:id/access-status` | Informar habilitación y motivo según estado y cuotas. No registra asistencia. | RF05, RF07, RF09 |
| Alta | POST | `/api/members/:id/qr` | Generar/asociar la credencial QR del socio. Definir si posteriores llamadas la rotan o reutilizan. | RF10 |
| Alta | GET | `/api/members/:id/qr` | Obtener la credencial o representación QR para entregarla al socio. | RF10 |
| Alta | POST | `/api/attendance/check-in` | Recibir QR, identificar socio, validar habilitación y registrar ingreso autorizado con hora del servidor. | RF09, RF11–RF16 |
| Alta | GET | `/api/users` | Listar usuarios del gimnasio para administración. | RF17 |
| Alta | GET | `/api/users/:id` | Consultar un usuario del gimnasio. | RF17 |
| Alta | POST | `/api/users` | Crear usuarios en el gimnasio autenticado, con rol permitido. | RF17, RF18 |
| Alta | PATCH | `/api/users/:id` | Modificar datos, rol o estado del usuario con autorización administrativa. | RF17–RF19 |
| Media | GET | `/api/roles` | Consultar roles asignables y sus permisos; puede resolverse con un catálogo fijo sin endpoint. | RF18 |
| Media | GET | `/api/reports/members` | Consolidar socios, por ejemplo activos/inactivos. | RF22 |
| Media | GET | `/api/reports/payments` | Consolidar importes y cuotas por período/estado. | RF22 |
| Media | GET | `/api/reports/attendance` | Consolidar ingresos por fecha y socio. | RF22 |

La autorización por rol es una mejora transversal de las rutas, **no otro endpoint**. El borrador no exige un CRUD de roles personalizables. Los indicadores, filtros y respuestas de reportes deben definirse antes de implementarlos.

### Flujo esperado del check-in

1. La interfaz captura el QR con cámara o lector y envía su contenido a `POST /api/attendance/check-in` desde una sesión autorizada de recepción.
2. El backend identifica al socio dentro del gimnasio autenticado.
3. Verifica que esté activo y cumpla la regla de pago vigente.
4. Si corresponde el acceso, guarda una asistencia con socio, gimnasio y fecha/hora asignadas por el servidor.
5. Devuelve confirmación, o rechaza con motivo sin crear una asistencia, conforme a CU-RA-01.

No se necesitan endpoints independientes para cada paso interno de validación. La generación de la imagen QR puede hacerse en la interfaz; la asociación y validación de su contenido corresponden al backend. Los contratos de entrada, respuesta y códigos de error del check-in todavía están por definir.

## 5. Cambios necesarios en endpoints existentes

- [ ] **Baja de socios:** sustituir el borrado físico por baja lógica o retirar la operación destructiva del flujo normal. Conservar la identidad vinculada a pagos y asistencias (RF04).
- [ ] **Historial de pagos:** definir corrección/anulación con trazabilidad en lugar de borrado definitivo; revisar también las modificaciones que sobrescriben datos históricos (RF08, RNF10).
- [ ] **Actualización de pagos:** comprobar que el `memberId` enviado en PUT existe y pertenece al mismo gimnasio, igual que en POST (RNF06).
- [ ] **Permisos:** agregar controles por operación para administrador y recepcionista, y limitar el acceso del socio según su participación definida (RF19).
- [ ] **Usuarios:** incorporar los roles acordados y un estado de cuenta; si se permite desactivar usuarios o cambiar permisos, hacer que la autorización contemple los cambios y no dependa únicamente de un JWT antiguo.
- [ ] **Cuotas y habilitación:** centralizar la regla que usarán tanto la consulta de habilitación como el check-in. Tener `ACTIVE` o un pago histórico `PAID` no basta para decidir el ingreso.
- [ ] **Asistencias:** implementar escritura validada y conservar la consulta existente. El modelo admite `REJECTED`, pero CU-RA-01 indica que un rechazo no genera asistencia. Si se necesitan intentos rechazados, definirlos como auditoría separada.

## 6. Decisiones pendientes y diferencias con el borrador

| Tema | Documento / código | Decisión necesaria |
| --- | --- | --- |
| Roles | El pedido inicial menciona entrenador; las secciones 11.3 y 12 definen administrador, recepcionista y socio. El código usa `OWNER` y `ADMIN`. | Tomar el alcance detallado como referencia y acordar equivalencias; definir si el socio necesita cuenta o solo credencial QR. |
| Baja de socio | RF04 exige conservar datos; DELETE borra el documento. | Establecer una única operación de baja lógica. |
| Pago habilitante | Se exige verificar pagos, sin detallar vencimiento, tolerancia ni deudas anteriores. | Definir cuota exigible, fecha límite, zona horaria y tratamiento de períodos sin registro. |
| Reingresos | No se establece qué hacer ante lecturas repetidas. | Definir si son válidas varias asistencias diarias y cómo evitar duplicados accidentales. |
| QR | Se exige un QR personal; no se define su contenido o vigencia. | Acordar identificación, entrega, renovación y validación de la credencial. |
| Reportes | Se pide información consolidada de socios, pagos y asistencias. | Acordar indicadores, períodos y filtros; exportación no está exigida explícitamente. |
| Persistencia | El relevamiento propone base relacional; el código usa MongoDB/Mongoose. | Alinear la documentación técnica o evaluar la decisión de almacenamiento. No implica un endpoint faltante. |
| Gimnasios | El alcance excluye administrar otras sucursales/gimnasios; el backend separa por `gymId` y permite registrar gimnasios. | Documentar que es una capacidad adicional del código, no una necesidad pendiente de esta versión. |

## 7. Orden sugerido de trabajo

1. Acordar roles, baja lógica y regla de pago habilitante.
2. Corregir conservación del historial y validación de pertenencia en pagos.
3. Implementar gestión de usuarios y autorización por rol.
4. Implementar asociación QR y consulta de habilitación.
5. Completar check-in de extremo a extremo y probar CU-RA-01: QR desconocido, socio inactivo, pago irregular e ingreso válido con fecha/hora automática.
6. Verificar CU-RA-02: listado general y por socio, lista vacía y acceso según permisos.
7. Incorporar reportes de socios, pagos y asistencias.

La lectura con cámara/lector, la confirmación visual y la compatibilidad de dispositivos requieren trabajo de interfaz además del backend. Los RNF de concurrencia, disponibilidad y facilidad de uso necesitan pruebas o revisión de despliegue/interfaz; no se consideran cumplidos por contar rutas.

## 8. Fuera del alcance de la primera versión

Según la sección 11.2 y el diagnóstico, no se contabilizan como endpoints faltantes: rutinas y planes de entrenamiento, seguimiento físico como módulo futuro, proveedores, equipamiento, sueldos, contabilidad e impuestos, servicios externos, venta/stock de productos, otras sucursales y aplicación móvil independiente.

## 9. Referencias para mantener este listado

- Documento de origen: `C:/Users/Nahuel Gigena/Desktop/Sistema Web de Gestión para Gimnasios ForgeFit - Borrador.docx`.
- [Montaje de rutas y salud](../src/app.ts).
- [Autenticación](../src/modules/auth/auth.routes.ts) y [modelo de usuarios](../src/modules/auth/user.model.ts).
- [Rutas de socios y consultas por socio](../src/modules/members/member.routes.ts), [modelo](../src/modules/members/member.model.ts) y [persistencia de socios](../src/modules/members/member.repository.ts).
- [Rutas de pagos](../src/modules/payments/payment.routes.ts), [validación de entrada](../src/modules/payments/payment.controller.ts) y [servicio](../src/modules/payments/payment.service.ts).
- [Rutas de asistencias](../src/modules/attendance/attendance.routes.ts), [servicio](../src/modules/attendance/attendance.service.ts) y [modelo](../src/modules/attendance/attendance.model.ts).
- [Configuración](../src/modules/settings/settings.routes.ts).
- [Middleware de autenticación](../src/shared/middleware/auth.middleware.ts).

Al implementar una función, actualizar su fila RF, mover las rutas de propuestas a existentes y marcar los pendientes correspondientes. Mantener separadas la existencia de una ruta y la cobertura completa de su regla de negocio.

## 10. Especificaciones SDD

Los contratos, reglas, diseño y tareas de cada endpoint pendiente están en [docs/specs](specs/README.md). Son documentos de planificación: no ejecutan ni implementan endpoints.

## 11. Implementación de endpoints antes pendientes

| Método | Ruta | Estado | Cobertura principal |
| --- | --- | --- | --- |
| PATCH | `/api/members/:id/status` | Implementado | Baja/reactivación lógica con historial preservado. |
| GET | `/api/members/:id/access-status` | Implementado | Estado del socio y cuota del período actual en Argentina. |
| POST / GET | `/api/members/:id/qr` | Implementado | Emisión, rotación y lectura de QR opaco. |
| POST | `/api/attendance/check-in` | Implementado | Validación QR/socio/pago, hora de servidor e idempotencia por `requestId`. |
| GET / GET / POST / PATCH | `/api/users`, `/api/users/:id` | Implementado | Gestión de usuarios y baja lógica de cuenta. |
| GET | `/api/roles` | Implementado | Catálogo fijo de roles y permisos. |
| GET | `/api/reports/members`, `/payments`, `/attendance` | Implementado | Resúmenes administrativos con filtros de fechas o períodos. |

La baja de socios y pagos dejó de eliminar documentos: socios usan `membershipStatus` y pagos pasan a `recordStatus: VOID`, con actor, fecha y motivo de anulación. Los pagos anulados no habilitan ingresos ni se incluyen en reportes.
