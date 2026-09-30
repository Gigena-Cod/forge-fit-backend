# SDD-11 Reporte administrativo de socios

## Investigación

El repositorio de socios solo lista documentos. Tiene `membershipStatus` y `registrationDate`, suficientes para un resumen básico, pero no hay agregaciones ni filtros de fechas.

## Especificación

Agregar `GET /api/reports/members?from=YYYY-MM-DD&to=YYYY-MM-DD`, solo OWNER y ADMIN. Las fechas son opcionales y, si se informan, ambas son obligatorias y `from <= to`. Respuesta propuesta:

```json
{"data":{"range":{"from":"2026-09-01","to":"2026-09-30","timezone":"America/Argentina/Cordoba"},"total":100,"active":82,"inactive":18,"registrations":7}}
```

`total`, `active` e `inactive` describen el estado actual al momento de consulta; `registrations` aplica el rango sobre `registrationDate`.

## Diseño y tareas

- Agregar agregación por `gymId` y estado; usar rango de fechas con zona definida.
- Definir el rango predeterminado como mes actual para registrations; documentarlo en la respuesta.
- Probar vacío, límites inclusivos, aislamiento de gimnasio y zonas horarias.

No incluye exportación ni lista detallada: no están exigidas por RF22.
