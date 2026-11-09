# SDD-19 Renovación de sesión — Backend

Estado aprobado e implementado en backend.

Antes de este cambio, login y registro emitían únicamente un JWT. El middleware comprueba gimnasio, cuenta activa y `authVersion`. La renovación debe mantener esas garantías y quedar acotada a la sesión del navegador que inició sesión.

## Contrato

| Ruta | Resultado |
| --- | --- |
| `POST /api/auth/login` y `POST /api/auth/register` | Conservan su estado HTTP y devuelven `data: { user, gym }`. Crean una sesión y entregan access y refresh exclusivamente por cookies HttpOnly. |
| `POST /api/auth/refresh` | Usa solo la cookie, incluso con el access vencido. Responde `204` y rota ambas cookies. |
| `POST /api/auth/logout` | Revoca la sesión identificada por una credencial de refresh reconocida, borra ambas cookies y devuelve `204`. Es idempotente. |
| `GET /api/auth/me` | Usa la cookie access; durante la transición también acepta Bearer legado. Devuelve `data.sessionId` para detectar cambio de cuenta. |

Refresh ausente, inválido, vencido, reutilizado o revocado devuelve `401` con código `SESSION_EXPIRED` y limpia ambas cookies. Origen rechazado devuelve `403`. Los fallos transitorios de infraestructura se informan como 5xx sin borrar las cookies. Usar `Cache-Control: no-store` en las respuestas de autenticación.

Las cookies `ff_access` y `ff_refresh` son host-only, `HttpOnly`, cifradas autenticadamente con AES-256-GCM, `Secure` en producción y `SameSite=Lax`. Access usa `Path=/api`; refresh usa `Path=/api/auth`. Nunca se entrega un token en JSON. Se borran con el mismo nombre y alcance. CORS permite credenciales sólo para `FRONTEND_URL`; las mutaciones por cookie y login, registro, refresh y logout validan `Origin` contra ese origen o el origen propio. En producción se rechaza un Origin ausente para estos flujos.

## Rotación y revocación

- Vigencia configurable de 15 minutos para access y 7 días absolutos para la sesión. Acotar el vencimiento del JWT al de la sesión.
- Guardar en MongoDB una sesión por inicio de sesión con identificador, usuario, gimnasio, versión de autenticación, hash del refresh vigente, hashes consumidos y fecha de expiración. Generar refresh opaco con entropía criptográfica. Aplicar índice TTL para limpieza y comprobar el vencimiento en cada uso.
- Validar la sesión y volver a leer la cuenta antes de emitir un access con el rol actual. Rotar con una actualización condicional atómica sobre el hash vigente y el estado de la sesión. Registrar el hash consumido en esa misma actualización. Ante una carrera, volver a consultar para distinguir un refresh consumido de un fallo transitorio. Excluir credenciales de logs. El historial se conserva durante toda la sesión. Después de 4096 rotaciones, el siguiente intento revoca la sesión y requiere volver a iniciar sesión.
- La renovación invalida inmediatamente el refresh anterior. El access anterior conserva su vigencia corta mientras la sesión siga activa. Esto permite completar solicitudes concurrentes y evita revocar todas las sesiones del usuario en cada refresh.
- Si reaparece un refresh consumido reconocido, revocar la sesión completa. Un valor desconocido no debe permitir revocar una sesión ajena. Logout también revoca la sesión completa. El middleware verifica el identificador de sesión del JWT además de la cuenta y su versión, de modo que ambos tokens dejan de servir en futuras solicitudes tras la revocación. Cambios que incrementan `authVersion` invalidan las dos credenciales en todas las sesiones afectadas.
- Durante el despliegue, aceptar JWT anteriores sin identificador de sesión hasta su expiración firmada. Los usuarios con esos JWT necesitarán autenticarse una vez para obtener una sesión renovable.

La rotación con detección de reutilización toma como referencia [RFC 9700 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2).

## Despliegue

Configurar una clave aleatoria dedicada en `SESSION_ENCRYPTION_KEY` y el origen del frontend en `FRONTEND_URL`. Usar HTTPS con frontend y API bajo el mismo sitio, o enrutar la API mediante el mismo origen.

## Pruebas de aceptación

- Login y registro crean sesiones renovables. Refresh funciona con access expirado o ausente, conserva usuario y gimnasio y entrega un par nuevo.
- Dos refresh simultáneos con el mismo valor producen como máximo una rotación. La reutilización detectada invalida también el access recién emitido y deja operativas otras sesiones del usuario.
- Verificar expiración, cookies, origen, logout idempotente, cuenta desactivada, cambio de versión y transición de JWT anteriores.
- Verificar que un error de base de datos entregue 5xx y que los endpoints protegidos devuelvan 401 antes de ejecutar la operación cuando el token es inválido. Esta garantía habilita el reintento del frontend.
