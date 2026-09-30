# SDD-08 Creación de usuarios y asignación de roles

## Investigación

El registro público crea un gimnasio y un usuario `OWNER` en transacción. No existe creación de empleados dentro de un gimnasio. El email es único globalmente y la contraseña se guarda con bcrypt.

## Especificación

Agregar `POST /api/users`, solo OWNER. Body:

```json
{"fullName":"Lucía Gómez","dni":"12345678","phone":"...","email":"lucia@apex.test","password":"mínimo 8 caracteres","role":"RECEPTIONIST"}
```

Devuelve 201 con el usuario seguro. El `gymId` viene del JWT. No devuelve contraseña ni hash. Si el email existe, 409 `EMAIL_ALREADY_EXISTS`.

## Diseño

Adoptar roles de negocio `OWNER`, `ADMIN` y `RECEPTIONIST`; el borrador también nombra Socio, pero el socio actual es una entidad Member y no un usuario autenticable. No crear un rol MEMBER hasta definir sus pantallas, credenciales y vínculo. Agregar `accountStatus: ACTIVE | INACTIVE` en User para permitir desactivación futura.

## Tareas

- Validar body y roles permitidos; normalizar email.
- Hash de contraseña con la misma política de auth.
- Crear repositorio filtrado por gimnasio y respuesta segura.
- Probar duplicados, rol inválido, usuario creado en gimnasio correcto y que ADMIN no pueda crear OWNER.

## Decisión pendiente

Confirmar quién puede crear ADMIN y si se requiere una invitación en vez de contraseña inicial.
