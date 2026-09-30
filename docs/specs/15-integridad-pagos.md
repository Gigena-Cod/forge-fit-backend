# SDD-15 Integridad al actualizar pagos

## Investigación

`paymentService.create` comprueba que el `memberId` exista dentro del gimnasio. `paymentService.update` no lo hace: el repositorio convierte y guarda el memberId recibido. Además, la actualización no declara `runValidators`.

## Especificación

Antes de actualizar un pago, verificar que el pago pertenece al gimnasio y que el socio de destino existe dentro del mismo gimnasio. Un socio inexistente o de otro gimnasio debe devolver 404 `MEMBER_NOT_FOUND`; un pago inexistente o de otro gimnasio, 404 `PAYMENT_NOT_FOUND`. La actualización debe ejecutar validadores de esquema y mantener toda la operación en el mismo gimnasio.

Validar que `period` tenga mes 01-12, que el importe sea entero positivo y que `PAID` tenga `paymentDate` y `paymentMethod`; los detalles de pagos pendientes deben acordarse con la regla de negocio.

## Diseño y tareas

- Revisar el servicio antes de llamar al repositorio y usar `runValidators: true`.
- Agregar índice único de negocio propuesto `(gymId, memberId, period)` sobre registros activos para evitar cuotas duplicadas; coordinar con SDD-14 para correcciones/anulaciones.
- Mapear errores de índice a 409 `PAYMENT_ALREADY_EXISTS`.
- Probar cambios de socio entre gimnasios, mes inválido, duplicados, validadores y pago inexistente.

Este SDD corrige una ruta existente; no agrega endpoint.
