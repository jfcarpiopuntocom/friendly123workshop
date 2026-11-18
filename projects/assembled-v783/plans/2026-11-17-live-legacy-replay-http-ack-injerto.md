# P0 JFC/Opus · injerto clase A: replay HTTP nunca consume un opId ante 403/500
Fecha local Ecuador: 2026-11-17. **Plan persistente antes de cambios**, para recuperación incluso tras corte.

## Fuentes y snapshot exactos
- Decisión original JFC: 3 bloques de 4 h, gates A20/B20/C10/D25/E10/F15 **congelados**. [Guía Opus 5.5](https://app.notion.com/p/41b1642b67f381fbab5cf45ac55aabd3) y [prioridad por 21 días de bloqueos](https://app.notion.com/p/41c1642b67f3814f96bbd5383ed3449d).
- LIVE repo `jfcarpiopuntocom/friendly-123` master **45757cac5d9268402049c0fba90cccdece150ac6**, archivo `docs/avanzado-extra.js` blob **e1c13108ba3734324b7db16f4f061abcd1d76b19**. Taller `friendly123workshop/main@428a4d476acfe8749515ded07ad344f4aaaed649`; fuente de injerto `projects/assembled-v783/app/docs/avanzado-extra.js` blob `c328c3723ff39f55cab2fb2e357140e942df1508`.
- Sin tocar `docs/sync-outbox.js`: Codex tiene reserva vigente hasta 2026-11-17T04:00Z (UTC 18 nov), ni `docs/sync-yjs.js` de PR #741, ni Worker, fotos, PWA, business UI, PIN o producción desplegada.
- Fuente test TDD existente: `projects/assembled-v783/app/test/p0-legacy-manual-replay-http-ack.test.cjs` blob `cbdaf8b3f2acd19cf76afd4b89f08f3779dcc3ee`.

## Pasos exactos Ponytail/Superpowers
1. Crear rama aislada LIVE desde master SHA observado, SIN cambios en master. Copiar test verificado del taller a `test/p0-legacy-manual-replay-http-ack.test.cjs`, integrar workflow QA focal `.github/workflows/qa-live-legacy-replay-http-ack.yml`, SIN secrets, NO deploy.
2. Ejecutar CI **RED** de fuente LIVE sin parche; esperar 403, 500, response null y cross-sender no dedup: documentar run, SHA y TAP; la prueba demuestra pérdida lógica, no reproducibilidad física.
3. Cambiar únicamente el bloque de replay real en LIVE `docs/avanzado-extra.js`: `const respuesta=await fetchOriginal(...)`; `if(!respuesta||respuesta.ok!==true) break;` **antes** de `aplicados.add(op.id)` y `relayAplicados.add(op.opId)`. Sin reintentos extra, sin mutar el body, sin rollback de almacenamiento, sin doble writer.
4. Correr MISMO test GREEN, y lo disponible de contratos de ventas/relay; revisar manifest integrity: sin regenerar sellado de producción sin pipeline completo. Crear PR DRAFT con evidencia y NO auto-merge a MASTER. El release debe regenerar manifiesto/version-manifest y superar gates sellados antes de activar.
5. Registrar prueba/SHAs/enlaces, Notion/relevo, fiabilidad. **No sumar puntos del port A**: el fix evita falso ACK de replay legacy, NO es la economía tipada de 2.0 ni cierre de migración. Calidad tampoco sube automáticamente. Marker actual main 67.0/36.0 y candidato #97 67.0/41.0, GO 0/6.

## Failback
Un revert a este único parche en LIVE conserva semántica original; el parche NO modifica los formatos de colas ni PIN ni envía solicitudes nuevas. Si test falla por arnés, corregir test sin relajar aserción sobre IDs, y repetir RED. No tocar usuarios/clientes físicos, no desplegar jamás sin GO autorizado.
