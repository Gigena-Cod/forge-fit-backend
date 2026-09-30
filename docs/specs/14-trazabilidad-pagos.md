# SDD-14 Trazabilidad, corrección y anulación de pagos

## Investigación

Existe historial por socio, pero `DELETE /api/payments/:id` usa `findOneAndDelete` y `PUT` sobrescribe datos. Esto incumple RF08 y RNF10, porque se puede perder o alterar el historial.

## Especificación

Los pagos registrados no se borran físicamente. Agregar al modelo `recordStatus: ACTIVE | VOID`, `voidedAt`, `voidedByUserId` y `voidReason`. Sustituir DELETE por una anulación lógica que mantenga respuesta 204 por compatibilidad, o por `POST /api/payments/:id/void` si se acepta una ruta explícita. La anulación exige motivo no vacío y permiso administrativo.

Una corrección no debe sobreescribir una cuota pagada: debe anular el registro original y crear uno nuevo, relacionado mediante `replacesPaymentId`. El historial debe mostrar ambos. Cuotas anuladas no habilitan acceso ni suman en reportes.

## Diseño y tareas

- Extender modelo e índices, y adaptar listas por defecto para excluir anulados o marcarlos claramente.
- Ejecutar anulación y creación de corrección en transacción.
- Añadir metadatos de actor y tiempo de anulación; no registrar datos sensibles innecesarios.
- Probar que no desaparecen pagos, que solo el activo habilita y que reportes no suman anulados.

## Decisión pendiente

Definir si se permite editar un pago pendiente antes de cobrarlo o si toda modificación debe generar corrección. La propuesta permite edición limitada antes de `PAID`, pero exige trazabilidad desde el cobro.
