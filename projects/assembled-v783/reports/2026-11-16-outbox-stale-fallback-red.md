# P0 outbox cifrado: respaldo reciente oculto — RED y relevo

Revisión sobre runtime workshop main 21901e023a57c19430a4afb7f80cc1185d715ff7 (código de #69 y #70). No producción, sin datos reales.

## Reproducción
El test conservado en [evidence/p0-outbox-stale-idb-after-fallback.test.cjs](../evidence/p0-outbox-stale-idb-after-fallback.test.cjs) ejecuta el módulo real con almacenamiento sintético. Comando: `node --test projects/assembled-v783/evidence/p0-outbox-stale-idb-after-fallback.test.cjs`. Resultado RED reproducido desde el archivo remoto: 0/1, esperado synthetic-B, obtenido synthetic-A.

Secuencia: guardar A exitosamente en IDB; abortar transacción de B y guardar B en localStorage con retorno true; recargar módulo y recuperar IDB; leer devuelve A porque leer() devuelve IDB primero. B permanece en localStorage en esta secuencia; el hallazgo es que queda oculto, no demuestra su borrado ni pérdida de venta comercial en producción. RestaurarCola en avanzado-extra descifra únicamente el blob devuelto. Un guardado posterior podría retirar el respaldo; investigar condiciones y carreras, sin inferirlo como demostrado aquí.

## Otra regresión verificable
[Auditoría 43999793625](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43999793625): baseline 3151 pruebas, 3088 pass, 59 fail, 1 cancel, 3 skip; candidata 3250, 3217 pass, 29 fail, 1 cancel, 3 skip. Ambos jobs failure. En comparación por nombre de líneas not ok figura un único nombre exclusivo candidata: v637 manifest matches all shell files. No implica causalidad ni comparación de suites idénticas. Log candidato muestra hash real sync-outbox 81ccaee12b0badb528b23c1adf4be517ad9ad241d9c6f419ec7d93c1b77a90ab y manifiesto esperado 928457788fa4200067beccf0aff15e2e6588e09cf92a839292024f57c7d84166; se reproduce localmente con node --test projects/assembled-v783/app/test/p0-v637-manifest.test.cjs. Corregir mediante generación y validar antes de cualquier entrega de shell, respetando prioridad de navegador y suspensión de despliegue PWA.

## Próximos pasos
1. Diseñar tratamiento de las dos copias cifradas con escrituras solapadas, multipestaña, interrupción, cuota y compatibilidad de formato; evitar elegir por reloj o borrar por intuición. Determinar si la cola se puede fusionar por ID tras descifrar sin reintroducir operaciones consumidas; investigar consumidores y semántica de ACK.
2. Extender RED con casos de concurrencia y reanudación. Corrección mínima con prueba real de lectura, persistencia, recarga y no pérdida; correr pruebas #69/#70 y QA integrado, asegurar que no empeore la ruta de respaldo.
3. Tratar manifiesto con generador y revisión del impacto sin activar SW ni publicar. Registrar CI exacta y repetir full apropiada.
4. NO-GO clientes: no hay validación física PC/iPhone ni ACK comercial remoto; no desplegar ni afirmar convergencia. No se cambiaron runtime, SW ni clientes en esta investigación.
