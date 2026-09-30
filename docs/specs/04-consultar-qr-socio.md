# SDD-04 Consulta del QR asociado al socio

## Investigación

`GET /api/members/:id` devuelve el socio, pero no existe una credencial QR ni una proyección específica para protegerla.

## Especificación

Agregar `GET /api/members/:id/qr`. Sin body. Devuelve el payload vigente y su fecha de emisión. Si el socio no tiene QR, devuelve 404 `QR_NOT_ASSIGNED`; no crea uno implícitamente. Configurar `Cache-Control: no-store`.

Permisos propuestos: OWNER, ADMIN y RECEPTIONIST del mismo gimnasio. Un socio no tiene cuenta en el código actual, por lo que no se le concede acceso hasta definir ese modelo.

## Diseño y tareas

- Reutilizar la búsqueda por socio/gimnasio con una proyección dedicada.
- Descifrar solamente en esta operación y no exponer material criptográfico.
- Generar la imagen QR en frontend, no en este backend.
- Probar que otro gimnasio no puede verlo, que dos GET no lo rotan y que luego de rotar solo se devuelve el nuevo payload.

Depende de SDD-03 y de los permisos de SDD-16.
