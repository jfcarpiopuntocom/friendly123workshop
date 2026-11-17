# P0 · Yjs cold join · no certificar página si falla el readback del cursor durable

**Fecha Ecuador:** 2026-11-16 / UTC 2026-11-17. **Workshop base:** `80a4c4e166c0c90d422ed6527bdbafc5419b5d56`. **Responsable:** ChatGPT. **Rama aislada:** `fix/20261116-yjs-pullcursor-proof-failclosed`. **NO cambios en `jfcarpiopuntocom/friendly-123` producción**, ni en clientes. Próximo relevo desde este documento y Notion.

## Hallazgo de lectura de fuente, aún por demostrar RED

`projects/assembled-v783/app/docs/sync-yjs.js`:
- `guardarPruebaCausal` (función real) devuelve `false` si fallan barrera journal, `persistencia.set/get`, readback íntegro del cursor o snapshot pendiente. El cursor durable `_appliedPullCursor` no avanza en esos casos.
- `guardarPullCursor(c)` adelanta `_pullCursor` **antes** del commit IDB y retorna la promesa de prueba; si falla, puede resolver `false` conservando `_pullCursor` adelantado.
- `ws.onmessage`, al manejar `k:pull-page`, actualmente hace `guardarPullCursor(c).then(function () { pullEstado.pullAplicado = true; ... pedirPagina(...) })` **sin comprobar** `false`. Así podría reanudar desde cursor no verificado y señalar page applied; éste es un defecto de control de recuperación, NO prueba de pérdida real de venta.
- `pedirPagina` usa `_pullCursor` (para el siguiente pull), y `procesarHead` puede usar `pullEstado.pullAplicado` para llamar `markRecovered`, por lo que el booleano importa. El transporte es cifrado; `Y.applyUpdate` puede ser idempotente pero no recupera padres omitidos.

## Plan primero, prueba RED→GREEN del módulo real

1. Reservar en Notion archivos del **workshop** `app/docs/sync-yjs.js`, nuevo `app/test/p0-yjs-pull-failed-cursor-proof.test.cjs` y nuevo workflow focal; no tocar archivos `sync-outbox.js` del port Codex ni `avanzado-extra.js` del otro agente. Revisar contratos de `test/pull-cursor-durable-ack.test.cjs` y `test/sync3-head-causal-gap.test.cjs`.
2. Test fuente REAL (extraer handler `ws.onmessage` de `sync-yjs.js` en VM), sin clientes, claves, navegador, web real ni Firebase. Inyectar `guardarPullCursor=async()=>false` con `_pullCursor` adelantado (simula barrera journal/IDB fallida) y `k:pull-page more:true`. Exigir que **NO** pida otra página, **NO** ponga `pullAplicado=true`, cierre el socket para reintentar, y restituya el cursor en memoria al `_appliedPullCursor` probado. Con código inicial debe ser RED. En otra prueba, un `true` comprobado deja seguir; `undefined` (escritura diferida/solo memoria) puede continuar pagina en RAM pero **no** certificar `pullAplicado`.
3. Obtener CI RED focal con SHA y TAP antes de runtime. El test y su workflow se guardarán en GitHub antes del parche. Registrar en Notion la evidencia y cualquier fixture inesperado.
4. Parche pequeño SOLO en `ws.onmessage` y `guardarPullCursor`: `true` si cursor previamente probado o si journaling+readback aprobado; `false` en commit I/O fallido; `undefined` si debe seguir reuniendo trozos/pendientes y no hay prueba durable. En false: cerrar solo socket activo con código 1013, `enCurso=false`, `pullAplicado=false`, restaurar **RAM cursor** desde último `_appliedPullCursor`, nunca modificar certificado IDB ni pérdidas de Y.Doc. No reintentar PIN, no bypass de metadatos, no aumentar timeout.
5. GREEN focal + regresiones `pull-cursor-durable-ack.test.cjs`, `p0-yjs-pending-snapshot.test.js`, `sync3-head-causal-gap.test.cjs`; usar workflow Node22 sin red. Después suite integrada 585 (SHA exacto) y revisión diff, no silenciar fallos. Guardar resultados y veredictos en Notion y `STATUS.md`.
6. Si cierres verdes y revisión aprueba, fusionar **solo en workshop**; no portar automáticamente a producción. Aún necesitan prueba física PC↔iPhone A→B→A×2, full histórico (tiene fallos abiertos), coldjoin Firebase real, fotos/dinero/roles/acceso y confirmación app-level.

## Principios de rollback / no-go

- No otorgar ACK de aplicación remota por WebSocket.send ni por `pull-page` recibido.
- No elegir datos por reloj ni inventar eventos de stock.
- No borrar respaldos IDB/localStorage legacy.
- Nada de claves, PIN, ciphertext, URLs de relay ni identificadores comerciales en logs.
- **No equivale a reparar el frío de producción**, pendiente de evidencia física; historia histórica cifrada faltante puede seguir sin recuperarse.

## RED real comprobado antes de modificar el runtime

[Actions 44010690891](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44010690891), SHA `87d8c37b89f5d6f4d36e405a8728c358cb57891b`, ejecutó 63 tests contra el módulo original: **61 PASS, 2 FAIL esperados, 0 SKIP/CANCEL**. Primer FAIL: nuevo test exige `pages=0` tras resultado de readback `false`, código original solicita 1 página desde _pullCursor no validado. Segundo FAIL: resultado `undefined` sin prueba durable se etiqueta `pullAplicado=true` (debería permanecer false), aun cuando puede seguir paginando en RAM. Regresiones existentes `pull-cursor-durable-ack`, `p0-yjs-pending-snapshot`, `sync3-head-causal-gap` permanecieron GREEN. La fuente `app/docs/sync-yjs.js` no se había editado al observar RED. Artefacto TAP+SHA retenido por Actions.

**Parche autorizado para probar**: en el `then` del mensaje `pull-page`, comprobar explícitamente el valor real devuelto por `guardarPullCursor`; si `false`, revertir *solo* cursor RAM a `_appliedPullCursor`, marcar no completo, detener paginación, cerrar WS activo con 1013 para reconectar y releer desde punto certificado; si `true`, marcar `pullAplicado`; si `undefined`, continuar acumulando historia sin falsificar ACK durable. No tocar ledger ni pruebas.
