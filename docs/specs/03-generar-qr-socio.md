# SDD-03 Emisión y renovación de QR del socio

## Investigación

El modelo `Member` no tiene campos QR y no existe búsqueda o emisión de credenciales. El borrador exige un QR personal, pero no especifica su contenido ni vigencia.

## Especificación

Agregar `POST /api/members/:id/qr`. Body opcional: `{ "rotate": false }`. Si no existe QR, responde 201; si existe y no rota, responde 200 con el mismo; si `rotate` es `true`, responde 200 con una credencial nueva.

```json
{"data":{"memberId":"...","qrPayload":"ffq_v1_...","issuedAt":"2026-09-27T15:00:00.000Z"}}
```

No devuelve una imagen: la interfaz convierte `qrPayload` a QR. Solo OWNER y ADMIN pueden emitir o rotar.

## Diseño

Generar un secreto aleatorio de 32 bytes con prefijo de versión. No incluir DNI, email, datos del socio ni JWT. Persistir un digest para búsquedas y una copia cifrada recuperable, con IV, etiqueta, versión de clave y fecha de emisión. La clave de cifrado debe ser distinta al secreto JWT. Ocultar todos estos campos en las lecturas normales de socios.

La rotación invalida la credencial anterior de forma atómica. La implementación no debe registrar el token en logs.

## Tareas de implementación

- Definir variables de entorno y estrategia de rotación de claves.
- Extender el modelo con índice único parcial sobre el digest.
- Crear emisión/rotación atómica y pruebas de concurrencia.
- Integrar búsqueda segura en SDD-05 y recuperación en SDD-04.

## Decisión pendiente

Confirmar que el QR será estático hasta una renovación explícita. Si se requiere un QR temporal, el contrato y el modelo cambian.
