# SDD-05 Registro de ingreso mediante QR

## Investigación

Attendance tiene `entryAt` y estados `ALLOWED`/`REJECTED`, pero solo hay endpoints GET y repositorio de lectura. El CU-RA-01 indica que un acceso rechazado no genera una asistencia. No hay QR, identificación ni validación de pagos.

## Especificación

Agregar `POST /api/attendance/check-in`. Body:

```json
{"qrPayload":"ffq_v1_...","requestId":"UUID"}
```

El body nunca acepta socio, gimnasio, fecha ni estado. Con acceso válido crea una asistencia `ALLOWED` usando hora del servidor y responde 201. Con un rechazo de negocio responde 200 con `allowed: false`, motivo y `attendance: null`; no escribe Attendance.

```json
{"data":{"allowed":true,"reason":"ACCESS_GRANTED","attendance":{"id":"...","memberId":"...","entryAt":"2026-09-27T15:00:00.000Z","status":"ALLOWED"}}}
```

## Reglas

- Acceso de operador: OWNER, ADMIN o RECEPTIONIST.
- Buscar QR por digest dentro del `gymId`; QR desconocido o rotado produce `QR_INVALID` sin escritura.
- Reutilizar exactamente SDD-02 para habilitación.
- Usar `requestId` como clave de idempotencia: reintento idéntico devuelve el resultado previo; la misma clave con otro QR devuelve 409 `IDEMPOTENCY_CONFLICT`.
- No confirmar acceso si falla la persistencia.

## Diseño y tareas

- Incorporar creación al repositorio Attendance e índice único por `gymId/requestId`.
- Ejecutar resolución, validación y creación con sesión de Mongo cuando el despliegue admita transacciones.
- No usar el estado `REJECTED` como sustituto de auditoría sin redefinir el caso de uso.
- Probar QR inválido, socio inactivo, cuotas inválidas, reintentos, concurrencia y fallo de almacenamiento.

## Decisiones pendientes

Definir si se permiten varios ingresos reales por día y cuánto tiempo se retienen claves de idempotencia.
