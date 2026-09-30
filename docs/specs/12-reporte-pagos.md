# SDD-12 Reporte administrativo de pagos

## Investigación

Pagos tiene `period`, `amount`, `status` y `paymentDate`; solo se lista sin consolidar. El importe no tiene moneda definida y los períodos no validan que el mes esté entre 01 y 12.

## Especificación

Agregar `GET /api/reports/payments?periodFrom=YYYY-MM&periodTo=YYYY-MM`, solo OWNER y ADMIN. Ambos parámetros son opcionales, pero se deben informar juntos. Respuesta:

```json
{"data":{"range":{"periodFrom":"2026-09","periodTo":"2026-09"},"currency":"ARS","totalAmount":0,"paidCount":0,"pendingCount":0,"overdueCount":0,"annulledCount":0}}
```

El reporte suma únicamente pagos `PAID` no anulados; los demás son conteos. `currency` requiere decisión global del producto.

## Diseño y tareas

- Validar mes real y rango ascendente.
- Agregar agregación por gymId, período, estado y anulación de SDD-14.
- Evitar usar `paymentDate` para decidir período de cuota: el filtro es `period`.
- Probar pagos fuera del período, anulados, vacío e importes enteros.

## Decisión pendiente

Confirmar moneda y si se reportan importes pendientes/vencidos además del importe efectivamente cobrado.
