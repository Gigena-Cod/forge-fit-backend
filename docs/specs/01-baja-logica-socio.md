# SDD-01 Baja lógica y reactivación de socios

## Investigación

`memberSchema` ya define `membershipStatus` como `ACTIVE` o `INACTIVE`. Sin embargo, `memberRepository.delete` usa `findOneAndDelete`, por lo que `DELETE /api/members/:id` borra al socio y contradice RF04: conservar la información histórica. El PUT actual requiere todos los datos del socio y no es apropiado para un cambio aislado de estado.

## Especificación

Agregar `PATCH /api/members/:id/status`, protegido por JWT. Recibe exactamente `{ "membershipStatus": "INACTIVE" }` o `ACTIVE` y devuelve 200 con el socio actualizado. Un id inexistente o de otro gimnasio devuelve `MEMBER_NOT_FOUND` (404). No se modifican pagos, asistencias ni datos personales.

`DELETE /api/members/:id` debe pasar a realizar la misma baja lógica y seguir respondiendo 204 para no romper clientes existentes. Repetir una baja o una reactivación es idempotente y exitoso.

## Diseño

Agregar validación Zod específica, `setStatus` en servicio y repositorio, filtrando por `_id` y `gymId`. El PUT existente debe aplicar la misma política de permiso si permite cambiar `membershipStatus`. La reactivación no significa habilitación de ingreso: esa decisión se obtiene con SDD-02.

## Tareas de implementación

- Crear controlador, servicio y repositorio para la actualización acotada.
- Sustituir el borrado físico por actualización de estado.
- Aplicar autorización de SDD-16.
- Probar conservación de pagos/asistencias, reintentos y aislamiento entre gimnasios.

## Decisión pendiente

Definir si recepción puede dar de baja y reactivar socios. Esta especificación propone reservarlo para OWNER y ADMIN.
