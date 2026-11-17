# Confirmación de borrado del respaldo y manifiesto reparado

Runtime analizado: workshop main 21901e023a57c19430a4afb7f80cc1185d715ff7. Datos y fallos sintéticos; no se ha probado pérdida de una venta de cliente.

## Dos pruebas RED con módulo real
Archivo [evidence/p0-outbox-stale-idb-after-fallback.test.cjs](../evidence/p0-outbox-stale-idb-after-fallback.test.cjs), commit 5999cc5c. Ejecutar `node --test projects/assembled-v783/evidence/p0-outbox-stale-idb-after-fallback.test.cjs`: 0/2 pass, 2 fallos esperados.
1. IDB A confirmado → B guardado en localStorage tras aborto → reinicio y recuperación IDB → lectura devuelve A en vez de B.
2. En esa misma secuencia, la escritura posterior derivada de A sí confirma IDB y elimina B de localStorage sin haberlo leído. Se demuestra pérdida de ese respaldo sintético; no implica que todas las ventas de la app usen esta cola ni demuestra incidente real.

La función `push()` de avanzado-extra.js recorta la cola tras respuesta HTTP exitosa antes de persistir. La unión indiscriminada de ambas colas puede resucitar operaciones ya enviadas; no proponer como corrección sin estudiar idempotencia y ACK. El módulo cifra snapshots completos, no un registro append-only. Las escrituras superpuestas, multipestaña, caída entre stores y fallos de borrado exigen una estrategia de recuperación explícita y pruebas antes de fijar prioridad.

## Manifiesto generado
Plan previo [aquí](../plans/2026-11-16-manifest-outbox-reconciliation.md), commit 07102e20. En copia temporal el generador oficial solo cambió hash de sync-outbox, sin modificar SW. Ejecutado en app: 131 archivos, únicamente una línea de version-manifest.json cambia. Test `node --test test/p0-v637-manifest.test.cjs` 1/1 pass; `bash check-sw.sh` exit 0, hash y compilación JS verificados; `git diff --check` exit 0. Archivo generado publicado en workshop commit 27fa207f5d18fd1f3d2b26b33600d6e948e671bc. No se ha ejecutado nueva auditoría completa para afirmar caída de los otros fallos. No se modificó código de la cola, SW, shell de producción ni clientes. Versionado de shell y release siguen pendientes antes de despliegue.

## Reanudación
No considerar arreglado el P0. Diseñar y testear preservación durable de ambos snapshots en transición y clasificación de orden sin depender solo del reloj; incluir misma pestaña, multipestaña, fallos de escritura/borrado, reinicio, operaciones enviadas y repetición idempotente. Revisar si este legacy sync está realmente activo en la candidata y su interacción con Yjs/Sync3; no equiparar su retorno HTTP con business-committed. Guardar plan antes de implementación, test rojo y verde, ejecutar regresiones e integración; generar de nuevo manifiesto tras cualquier cambio. No release comercial sin gates de seguridad y verificación en aparatos.
