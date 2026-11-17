Revisión independiente · port retry #70 hacia friendly-123

Base exacta jfcarpiopuntocom/friendly-123@94a4e047cdb0b2b14cbab004de599d7e43fef79b, SHA256 de sync-outbox.js 928457788fa4200067beccf0aff15e2e6588e09cf92a839292024f57c7d84166. Fuente candidata local y fixtures sintéticos. Sin usuarios ni red.

## BLOQUEANTE: regresión por copia oculta
[Prueba comparativa ejecutable](../evidence/p0-retry-reveals-stale-idb.test.cjs). En la misma sesión: IDB contiene A anterior; primera apertura falla; guardar B confirma localStorage; IDB vuelve; leer seguido de guardar(leído+C). Master exacto devuelve B y conserva B+C en localStorage; candidata retry devuelve A, guarda A+C en IDB y elimina respaldo B. La corrección de la promesa habilita recuperación de IDB, pero en este camino también permite que una copia vieja gane sobre un fallback ya confirmado. Es un defecto de módulo reproducido con datos sintéticos; no se ha probado que una venta real siga este orden. Salida test: master PASS; candidata FAIL A != B, 1/2 PASS. No portar mientras falle el test de integridad.

## Otra observación: onblocked seguido por onsuccess
[Prueba de conexión huérfana](../evidence/p0-outbox-blocked-late-open.test.cjs) RED en código workshop #70: 0/1, el request bloqueado y rechazado emite success tardío y deja conexión abierta. Dos llamadas iniciales comparten el open y el siguiente intento hace otro. Una copia candidata separada con marca bloqueada y cierre en success tardío pasó local 1/1 y mantuvo abierta la conexión del retry; esa mejora no resuelve la pérdida de B anterior.

## Opciones y límites
Un marcador transitorio de fallback podría cubrir el camino reproducido dentro de la misma pestaña, pero no demuestra solución de reinicio o escrituras entre pestañas. El estado legacy con IDB A y local B es compatible con historias opuestas, como demuestra [el test de ambigüedad](../evidence/p0-outbox-ambiguous-history.test.cjs); elegir un almacén por defecto no restituye orden. Se requiere preservar ambas copias y considerar un protocolo de orden durable con cuotas, errores de escritura, caída en mitad de migración y concurrencia, además de los ACK y reenvío. No hacer unión ciega que reactive operaciones ya enviadas. La opción mínima segura inmediata es mantener aislado el port y no liberar runtime con regresión demostrada.
