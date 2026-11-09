# SDD-18 Listado paginado de pagos

- `GET /api/payments?page=1&limit=20&q=` devuelve `{ data: { items, page, limit, total } }`. `page` comienza en 1 y `limit` admite 1 a 100. Parámetros inválidos devuelven 400. Sin parámetros conservar `{ data: Payment[] }` para clientes previos.
- Orden descendente por fecha de pago. Para registros sin fecha usar su fecha de creación. Desempatar por ID descendente. Aplicar el mismo orden a la lista anterior.
- Buscar en todo el gimnasio antes de paginar. `q` opcional busca por nombre del socio, período o estado mostrado (pagado, pendiente o vencido), sin distinguir mayúsculas. Tratar la búsqueda como texto literal. Mantener la forma de cada ítem con el socio poblado.
- Excluir pagos anulados y usar el gimnasio de la sesión. Una página fuera de rango devuelve una lista vacía con el total. El listado por socio conserva su contrato.
- Verificar orden, desempate, paginación, búsqueda, aislamiento, validación y compatibilidad mediante integración con MongoDB.
