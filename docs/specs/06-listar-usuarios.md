# SDD-06 Listado de usuarios del gimnasio

## Investigación

El modelo User contiene `gymId`, datos personales, hash de contraseña y los roles `OWNER`/`ADMIN`. Los únicos repositorios de usuario son `findByEmail`, `findById` y la creación del propietario. No hay módulo ni rutas de usuarios.

## Especificación

Agregar `GET /api/users`, solo para OWNER y ADMIN. Devuelve los usuarios del gimnasio del JWT, sin `passwordHash`, ordenados por nombre:

```json
{"data":[{"id":"...","fullName":"Ana Pérez","dni":"...","phone":"...","email":"ana@apex.test","role":"RECEPTIONIST","accountStatus":"ACTIVE","createdAt":"..."}]}
```

No acepta `gymId` en query ni body. En esta versión no requiere filtros ni paginación; agregarlos exige contrato nuevo.

## Diseño y tareas

- Extraer User de `auth` a un módulo users o crear una capa de consulta sin duplicar el modelo.
- Introducir el rol y estado definidos en SDD-08/09.
- Crear proyección segura que excluya siempre `passwordHash` y material de recuperación.
- Filtrar invariablemente por `req.auth.gymId`; probar aislamiento entre gimnasios y ausencia de hashes.

Depende de SDD-08, SDD-09 y SDD-16.
