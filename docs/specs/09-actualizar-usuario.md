# SDD-09 Actualización de usuario, rol y estado de cuenta

## Investigación

Settings permite que el usuario autenticado actualice sus propios datos. No hay operación para editar otro usuario, rol ni estado. El JWT actual contiene el rol, por lo que cambios posteriores pueden dejar tokens antiguos con permisos no actualizados.

## Especificación

Agregar `PATCH /api/users/:id`, solo OWNER. Body parcial con `fullName`, `dni`, `phone`, `email`, `role`, `accountStatus` y `password`; validar cada campo y rechazar claves desconocidas. Devuelve 200 con el usuario seguro.

No permitir que el último OWNER activo se inactive ni pierda el rol OWNER. Cambiar contraseña requiere reautenticación del operador o una regla explícita de administración; hasta resolverla, no incluirla en la primera implementación.

## Diseño y tareas

- Ejecutar validadores de Mongoose en la actualización y manejar email duplicado.
- Agregar estrategia de revocación/versión de sesión para que un usuario inactivo o cuyo rol cambió no siga autorizado por un JWT emitido antes.
- Mantener actualizaciones propias de configuración separadas de esta ruta administrativa.
- Probar límites de OWNER, desactivación, cambio de rol, actualización entre gimnasios y tokens viejos.

Depende de SDD-16. La política exacta para que ADMIN actualice perfiles debe definirse antes de codificar.
