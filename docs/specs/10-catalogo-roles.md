# SDD-10 Catálogo de roles y permisos

## Investigación

Los roles existentes están hardcodeados como `OWNER` y `ADMIN`; no hay catálogo, permisos declarados ni middleware que los aplique. El borrador usa administrador, recepcionista y socio; el pedido inicial menciona entrenador, pero ese perfil no está en el alcance detallado.

## Especificación

Agregar `GET /api/roles`, para OWNER y ADMIN. Devuelve un catálogo fijo, no un CRUD de roles:

```json
{"data":[{"code":"OWNER","permissions":["users:manage","reports:read"]},{"code":"ADMIN","permissions":["members:manage","payments:manage"]},{"code":"RECEPTIONIST","permissions":["members:read","payments:manage","attendance:check-in"]}]}
```

## Diseño y tareas

- Declarar roles y permisos en un único módulo TypeScript, usado por validación, middleware y respuesta.
- Mantener al socio fuera del catálogo hasta diseñar autenticación para Member.
- Definir matriz final junto con SDD-16 y probar que el catálogo no expone permisos no aplicados.

## Decisión pendiente

Resolver si “entrenador” forma parte de la primera versión. Actualmente rutinas y seguimiento físico están fuera de alcance, por lo que no se propone ese rol.
