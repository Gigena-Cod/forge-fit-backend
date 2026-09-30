# SDD-16 Autorización por rol en cada operación

## Investigación

`authMiddleware` valida firma y campos del JWT y copia `role` a `req.auth`. Todas las rutas protegidas usan ese middleware, pero ninguna verifica roles. En consecuencia, cualquier JWT válido accede a socios, pagos, asistencias y configuración. RF19 exige restringir funciones por rol.

## Especificación

Implementar un middleware `requirePermission(...permissions)` que compruebe en cada ruta protegida la matriz declarada en SDD-10. Responder 401 si no hay autenticación válida y 403 `FORBIDDEN` si el usuario autenticado no posee permiso. La política comienza denegando todo permiso no declarado.

Matriz inicial propuesta:

| Acción | OWNER | ADMIN | RECEPTIONIST |
| --- | --- | --- | --- |
| Gestionar usuarios/roles y ver reportes | Sí | Listar/consultar, según política | No |
| Socios y pagos | Sí | Sí | Sí, sin baja ni anulación |
| Consultar asistencias y check-in | Sí | Sí | Sí |
| Configuración del gimnasio | Sí | Sí | No |

## Diseño

No confiar solamente en el rol incorporado en un JWT viejo cuando se desactiva una cuenta o cambia un rol. En rutas sensibles, cargar el usuario activo o usar `authVersion`/lista de revocación y rechazar tokens obsoletos. Todo acceso a recursos sigue filtrado por `gymId`; un permiso no sustituye ese filtro.

## Tareas de implementación

- Declarar roles/permisos centralmente con tipos TypeScript.
- Agregar estado de cuenta y estrategia de invalidación de sesión de SDD-09.
- Montar permisos explícitos en todas las rutas existentes y nuevas.
- Probar matriz positiva y negativa por ruta, usuario inactivo, cambio de rol y acceso cruzado entre gimnasios.

## Fuentes de investigación

La recomendación de denegar por defecto y validar permisos en cada solicitud está respaldada por la [guía de autorización de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). La necesidad de activar validación explícita en `findOneAndUpdate` está documentada por [Mongoose](https://mongoosejs.com/docs/8.x/docs/api/model.html). Para los reportes diarios, MongoDB documenta el uso de zona horaria con [`$dateTrunc`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/datetrunc/). La emisión QR propuesta usa las primitivas de [Node Crypto](https://nodejs.org/api/crypto.html).
