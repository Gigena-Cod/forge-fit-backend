# SDD-17 Contrato QR para la ficha del socio

## Alcance

Los endpoints de SDD-03 y SDD-04 ya existen. Esta tarea los prepara para su consumo desde la ficha del socio. Para esta integración prevalecen los permisos y códigos HTTP de este contrato.

## Contrato

- `GET /api/members/:id/qr` devuelve 200 con la credencial, 404 `QR_NOT_ASSIGNED` para un socio propio sin credencial y 404 `MEMBER_NOT_FOUND` para un socio inexistente o de otro gimnasio.
- `POST /api/members/:id/qr` conserva 201 por compatibilidad. Body `{}` o `{ "rotate": false }` devuelve la credencial vigente o la emite si falta. `{ "rotate": true }` reemplaza la vigente.
- Respuesta exitosa `{ data: { memberId, qrPayload, issuedAt } }`, con fecha ISO 8601 y payload opaco `ffq_v1_…`. Agregar `Cache-Control: no-store` en ambas rutas.
- Reutilizar `members:qr` para OWNER y ADMIN y el gimnasio del JWT. Rechazar a RECEPTIONIST con 403 y a solicitudes sin sesión con 401.

## Persistencia y concurrencia

Aplicar la primera emisión con una actualización condicional por socio y gimnasio. Si otra solicitud ganó, recuperar la credencial persistida. Actualizar payload, digest y fecha en una sola operación al rotar. Manejar un socio que desaparece entre lectura y escritura con 404. Mantener compatibilidad con credenciales emitidas y con el check-in actual. Mantener el payload fuera de lecturas generales y logs. La gestión de claves y el cifrado en reposo de SDD-03 quedan fuera de esta tarea.

## Aceptación

- Verificar con MongoDB que dos emisiones iniciales concurrentes devuelven la misma credencial persistida y que GET conserva su fecha.
- Verificar 401, 403, ambos casos de 404 y `no-store`.
- Verificar que la renovación invalida el QR previo y que el nuevo autoriza el ingreso de un socio habilitado.
- Ejecutar `pnpm test` y `pnpm build`.
