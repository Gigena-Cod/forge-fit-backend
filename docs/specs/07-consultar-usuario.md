# SDD-07 Consulta de usuario del gimnasio

## Investigación

`GET /api/auth/me` consulta únicamente al usuario del JWT. `authRepository.findById` no filtra por gimnasio y carga la entidad completa, incluido el hash de contraseña.

## Especificación

Agregar `GET /api/users/:id`, para OWNER y ADMIN. Devuelve una representación segura del usuario solamente si pertenece al gimnasio autenticado. Si no existe o pertenece a otro gimnasio, responder 404 `USER_NOT_FOUND`.

## Diseño y tareas

- Implementar `findByIdAndGymId` con proyección explícita y sin `passwordHash`.
- Reutilizar el serializador seguro en los SDD-06, 08 y 09.
- Probar ids inválidos, usuario de otro gimnasio y que el hash nunca llegue a la respuesta.

Depende de SDD-16. No debe reutilizar `auth/me`, cuya finalidad es distinta.
