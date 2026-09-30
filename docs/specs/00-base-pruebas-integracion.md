# SDD-00 Base de pruebas de integración

Estado: implementado. Corresponde a la primera feature del orden de ejecución acordado: infraestructura de pruebas HTTP con base aislada. No reemplaza SDD-01 (baja lógica de socios).

## Investigación

El proyecto tenía Vitest 3.2.4 y siete pruebas unitarias de habilitación/permisos. No existía infraestructura HTTP ni base de pruebas. La aplicación Express se exporta desde `src/app.ts` y puede probarse sin arrancar `src/server.ts`. El registro de gimnasio usa una transacción de MongoDB, de modo que las pruebas requieren un replica set.

Se eligieron Supertest para atravesar rutas, validaciones, middleware y servicios reales, y MongoMemoryReplSet para ejecutar un proceso MongoDB temporal. No se simulan repositorios ni autenticación.

## Especificación

- Separar proyectos Vitest `unit` e `integration`.
- Crear un replica set temporal de un nodo, MongoDB 8.2.6, con base aleatoria `forgefit_test_*` por archivo de integración.
- Sobrescribir configuración sensible antes de importar la aplicación y no cargar el `.env` de desarrollo.
- Crear índices antes de los casos; limpiar documentos antes de cada caso conservando índices. Verificar nombre de base y host local antes de limpiar.
- Cerrar la conexión y el proceso MongoDB al terminar, incluso ante fallos de pruebas.
- Proveer fábricas para gimnasio, OWNER, ADMIN, RECEPTIONIST, socio, pago, asistencia, credencial QR y JWT de prueba.
- Comprobar por HTTP autenticación, validación y aislamiento entre dos gimnasios.

## Diseño implementado

| Archivo | Responsabilidad |
| --- | --- |
| `vitest.config.ts` | Proyectos unit/integration; archivos serializados para limitar procesos MongoDB simultáneos. |
| `tests/support/setup.ts` | Configuración aislada, replica set, conexión, índices, limpieza y cierre. |
| `tests/support/fixtures.ts` | Fábricas reutilizables con ids y emails independientes. |
| `tests/integration/auth.test.ts` | Registro real con transacción, login de tres roles, perfil y rechazos de autenticación. |
| `tests/integration/tenants.test.ts` | Consultas y escrituras HTTP con dos gimnasios; validación y restricción de rol existente. |
| `tests/integration/database.test.ts` | Base aislada, limpieza, índice único real y rollback de transacciones. |
| `tsconfig.tests.json` | Comprobación TypeScript de pruebas y configuración sin emitir archivos. |

## Criterios de aceptación verificados

- [x] La suite no necesita una instancia MongoDB de desarrollo ni Docker.
- [x] Los requests atraviesan Express y los modelos/repositorios reales.
- [x] El registro HTTP persiste gimnasio y propietario y entrega un JWT utilizable.
- [x] Las lecturas de socios, pagos, asistencias y usuarios no mezclan gimnasios.
- [x] Los detalles e historiales de recursos ajenos se rechazan.
- [x] Las escrituras probadas no permiten modificar un socio ajeno ni crearle un pago desde otro gimnasio.
- [x] El body no permite elegir el gimnasio de un nuevo socio.
- [x] Las sesiones inválidas, inactivas u obsoletas se rechazan en los escenarios probados.
- [x] La limpieza preserva índices y la base admite rollback real.
- [x] TypeScript valida también las pruebas.

## Ejecución

```powershell
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:typecheck
pnpm build
```

La primera instalación/ejecución necesita descargar el binario MongoDB; las siguientes reutilizan la caché de mongodb-memory-server. No se requieren credenciales reales. No usar `test.concurrent` dentro de las suites que comparten base: la limpieza es por caso. Una interrupción forzada del proceso puede impedir ejecutar el cierre normal.

## Alcance de la verificación

Hay 26 casos de integración y 7 unitarios existentes. Esto confirma la infraestructura y los escenarios listados; no significa que la matriz funcional completa esté cubierta. Idempotencia de check-in, reglas de cuotas, cifrado QR, protección del último OWNER, autorización completa, correcciones de pagos y filtros de reportes siguen en sus respectivas features. No se marcaron esos pendientes como implementados.

## Referencias técnicas

- [MongoMemoryReplSet](https://typegoose.github.io/mongodb-memory-server/versions/10.x/docs/api/classes/mongo-memory-replset/): creación, URI y cierre del replica set; la integración se verificó además con la versión instalada 11.3.0.
- [Configuración de Vitest 3](https://v3.vitest.dev/config/): configuración y ejecución de archivos.
