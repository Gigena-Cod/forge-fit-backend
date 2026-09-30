# Especificaciones SDD pendientes

Cada archivo es una especificación de Spec-Driven Development: primero describe el comportamiento y las decisiones necesarias; después propone el diseño y las tareas. Ninguna especificación cambia ni ejecuta el backend.

| SDD | Endpoint o alcance | Requerimientos |
| --- | --- | --- |
| [00 — Implementado](00-base-pruebas-integracion.md) | Base HTTP con MongoDB temporal y fábricas | Infraestructura de pruebas |
| [01](01-baja-logica-socio.md) | `PATCH /api/members/:id/status` | RF04 |
| [02](02-consultar-habilitacion.md) | `GET /api/members/:id/access-status` | RF05, RF07, RF09 |
| [03](03-generar-qr-socio.md) | `POST /api/members/:id/qr` | RF10 |
| [04](04-consultar-qr-socio.md) | `GET /api/members/:id/qr` | RF10 |
| [05](05-check-in-qr.md) | `POST /api/attendance/check-in` | RF09, RF11-RF16 |
| [06](06-listar-usuarios.md) | `GET /api/users` | RF17 |
| [07](07-consultar-usuario.md) | `GET /api/users/:id` | RF17 |
| [08](08-crear-usuario.md) | `POST /api/users` | RF17, RF18 |
| [09](09-actualizar-usuario.md) | `PATCH /api/users/:id` | RF17-RF19 |
| [10](10-catalogo-roles.md) | `GET /api/roles` | RF18 |
| [11](11-reporte-socios.md) | `GET /api/reports/members` | RF22 |
| [12](12-reporte-pagos.md) | `GET /api/reports/payments` | RF22 |
| [13](13-reporte-asistencias.md) | `GET /api/reports/attendance` | RF22 |
| [14](14-trazabilidad-pagos.md) | Regla transversal de pagos | RF08, RNF10 |
| [15](15-integridad-pagos.md) | Corrección de `PUT /api/payments/:id` | RNF06 |
| [16](16-autorizacion-por-rol.md) | Regla transversal de permisos | RF19 |

Las rutas son propuestas del inventario de endpoints; el documento de origen define funcionalidades, no rutas HTTP. Antes de implementar, resolver las decisiones marcadas como **pendientes**.

La tarea integradora con orden de implementación y matriz de pruebas está en [implementacion-integridad-y-pruebas.md](../tasks/implementacion-integridad-y-pruebas.md).
