# SDD-02 Consulta de estado de cuotas y habilitación

## Investigación

El socio solo tiene `membershipStatus`. Los pagos almacenan `period` y `status` (`PAID`, `PENDING`, `OVERDUE`), pero no hay un servicio que determine la habilitación ni una regla de vencimiento. El estado llega desde el cliente.

## Especificación

Agregar `GET /api/members/:id/access-status`. Devuelve 200:

```json
{"data":{"memberId":"...","membershipStatus":"ACTIVE","period":"2026-09","paymentStatus":"PAID","allowed":true,"reason":"VALID_PAYMENT","evaluatedAt":"2026-09-27T15:00:00.000Z"}}
```

`paymentStatus` de respuesta puede ser `PAID`, `PENDING`, `OVERDUE`, `MISSING` o `CONFLICT`. No escribe datos ni registra asistencia. Permisos: OWNER, ADMIN y RECEPTIONIST.

## Regla propuesta

Para la primera versión, exigir que el socio esté `ACTIVE` y tenga exactamente una cuota no anulada `PAID` del mes calendario actual en `America/Argentina/Cordoba`. Si no existe, devolver `PAYMENT_MISSING`; si está pendiente/vencida, el motivo respectivo; si hay duplicados, `PAYMENT_CONFLICT` y no habilitar.

## Diseño y tareas

- Crear un servicio de dominio reutilizable por SDD-05, con reloj y zona horaria explícitos.
- Consultar socio y pagos siempre por `gymId`.
- Incorporar la exclusión de pagos anulados de SDD-14.
- Probar activo/inactivo, períodos pasados, cambio de mes, faltantes, duplicados y que GET no escriba.

## Decisiones pendientes

El borrador no define vencimiento, tolerancia, pagos parciales, deudas de meses previos ni duplicados. Confirmar la regla antes de implementación.
