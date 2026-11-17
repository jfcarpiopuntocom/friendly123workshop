# P0: snapshots de cola manual por pestaña se sobrescriben aun con escrituras secuenciales

## Evidencia reproducible

Base fuente `friendly-123@94a4e047cdb0b2b14cbab004de599d7e43fef79b`; plan previo [7581dff](../plans/2026-11-16-outbox-multitab-snapshot-loss.md). [Test](../evidence/p0-legacy-multitab-full-snapshot.test.cjs) usa los módulos reales de ese commit (`git show`), cierre de `avanzado-extra.js` y `sync-outbox.js`. Dos VM representan dos pestañas activadas antes de operar; comparten un IndexedDB sintético y localStorage sintético, con cifrador de identidad y fetch ficticio. Tab A emite `/api/sale-a` y espera su guardado; luego tab B emite `/api/sale-b` y espera el suyo. Ambas respuestas son exitosas y el último blob almacenado contiene **solo B**, no A. Resultado RED 0/1: array esperado A+B, recibido B. Ejecutar con `FRIENDLY_REPO=/ruta/al/checkout/friendly-123 node --test projects/assembled-v783/evidence/p0-legacy-multitab-full-snapshot.test.cjs` desde el workshop. No hay cliente ni red reales; la cola ejercida es el respaldo manual heredado, no Sync3. No demuestra pérdida de venta en cliente: prueba sobreescritura de su cola en las condiciones descritas.

## Consecuencias técnicas

`avanzado-extra.js` tiene `let cola=[]` por instancia, restaura una vez al activar, y después cifra/escribe el snapshot entero sin reconciliar otra pestaña. Ya que el test completa A antes de iniciar B, serializar la escritura con Web Locks no arregla por sí solo esta pérdida: es necesaria una regla para incorporar las operaciones de otras pestañas. Tampoco basta hacer unión de snapshots sin conocer retiros: `push()` recorta la cola al recibir HTTP exitoso, y una copia antigua podría reintroducir operaciones retiradas. No interpretar HTTP 2xx como ACK de aplicación remota o exactly-once.

Web Locks permite exclusión cooperativa entre contextos del mismo origen; no coordina versiones antiguas que no lo adquieran, ni aparatos distintos o PWAs de almacenamiento aislado, ni conserva el lock tras crash. Referencia oficial: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API . IndexedDB ofrece transacciones sobre almacenes de esa base, no una transacción única sobre IDB y localStorage: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology .

## Diseño para estudiar, NO implementado ni aprobado como solución

- Conservar ambos snapshots legacy ante conflicto sin elegir por reloj; registrar qué dato proviene de cuál. Dos historias de orden opuesto con bytes idénticos ya están demostradas en [test de ambigüedad](../evidence/p0-outbox-ambiguous-history.test.cjs).
- Considerar journal cifrado de operaciones con ID estable y registros de retiro/ACK por ID. En cada store, una transacción/clave por hecho evita que el snapshot completo de otra pestaña sobrescriba hechos distintos; requiere trazabilidad correcta de qué autoridad acredita la aplicación y conciliación, no borrar por un 2xx o un timestamp.
- Durante migración, construir lectura que preserve lo legacy y lo nuevo y controle en qué momento se puede retirar cualquier copia. Probar explícitamente cierre/corte entre escrituras, cuota en cualquier paso, duplicado/reintento, rotación de PIN/llaves, almacenamiento ilegible, dos pestañas antiguas y nuevas, y almacenamiento aislado entre PWAs. Cuota agotada debe informar fallos de persistencia reales sin cancelar ventas ya registradas.
- No se propone desplegar este esquema ni alterar proveedor, datos reales, permisos o API ahora. Las pruebas sintéticas adicionales, revisión de seguridad y una aceptación de sync físico faltan. Un lock no puede convertir por sí mismo una cadena de operaciones de dos stores independientes en una transacción.

El port #70 de una línea continúa bloqueado por [regresión multipestaña](../evidence/p0-retry-multitab-fallback-loss.test.cjs). La unión fría Yjs/Firebase sigue con diagnóstico separado y relación con esta cola aún no demostrada.
