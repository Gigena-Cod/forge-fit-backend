# SDD-13 Reporte administrativo de asistencias

## Investigación

Attendance ya tiene `entryAt`, índice y estado, pero no crea registros actualmente. Las listas no filtran por fecha y el modelo contempla `REJECTED`, aunque el caso de uso indica no persistir rechazos.

## Especificación

Agregar `GET /api/reports/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD`, solo OWNER y ADMIN. Rango opcional; si se informa, exige ambas fechas. Respuesta:

```json
{"data":{"range":{"from":"2026-09-01","to":"2026-09-30","timezone":"America/Argentina/Cordoba"},"totalEntries":0,"uniqueMembers":0,"entriesByDay":[{"date":"2026-09-27","entries":0}]}}
```

Cuenta solamente registros `ALLOWED`. La agrupación por día usa `America/Argentina/Cordoba` y el rango debe incluir el día final completo en esa zona.

## Diseño y tareas

- Usar `$match` por gymId/rango/estado y `$dateTrunc` o equivalente con zona horaria explícita.
- Crear índices acordes a consulta por gymId, entryAt y estado.
- Probar límites de fechas, cambio UTC/local, socio repetido y conjunto vacío.

Depende de SDD-05 para tener datos de asistencia reales.
