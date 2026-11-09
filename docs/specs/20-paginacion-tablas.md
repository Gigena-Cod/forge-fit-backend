# SDD-20 Paginación de listados

Extender el contrato de Pagos a GET /api/members, /api/users, /api/attendance, /api/members/:memberId/payments y /api/members/:memberId/attendance.

Con page o limit explícito, responder data: { items, page, limit, total }. Mantener la forma anterior sin parámetros de paginación para compatibilidad durante el despliegue. Validar enteros positivos, usar page=1 y limit=20 por defecto en modo paginado y compartir el máximo de Pagos. Una página fuera de rango devuelve items vacío con el total real.

Filtrar y contar antes de paginar, bajo el mismo alcance de gimnasio, socio y permisos. Conservar el orden de cada listado con desempate por ID. Admitir q en los listados con buscador actual y mantener sus campos de búsqueda. En pagos por socio admitir period exacto incluso sin paginación, para que registrar un pago detecte todos los registros del período. Mantener el contrato de Reportes, cuya tabla diaria se pagina en la interfaz.

Probar filtros, total, segunda página, orden estable, parámetros inválidos, permisos, separación por gimnasio y compatibilidad sin paginación. Publicar backend antes que frontend.
