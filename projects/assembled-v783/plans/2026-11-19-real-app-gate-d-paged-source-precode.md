# Gate D2 · Historial certificado paginado en APP REAL — plan Ponytail PRECODE (2026-11-19)

> Destino de código: `jfcarpiopuntocom/friendly-123`; taller solamente registra plan, comparaciones y evidencia. Usar Superpowers / Ponytail, TDD RED→GREEN, auditar Qwen/Gemini. Sync3 queda intacto.

**Meta:** injertar paginación acotada al lector independiente `cloudflare-yparty-worker/src/trusted-frozen-source.mjs` de la aplicación REAL. Una tienda con >4096 frames válidos debe entrar por páginas de un mismo HEAD/SHA, sin aceptar 401 intermedios, páginas reordenadas, cursores circulares, pruebas divergentes o un `more` falso.

**Causa raíz verificada:** `MAX_FRAMES=4096` y `MAX_WIRE=16MiB` para una única respuesta; auditorías registran 6.112 frames, 19 padres Yjs y nueve Firebase 401. Las últimas dos anomalías no desaparecen por paginar; el importador seguirá exigiendo SHA/vector y `pendingStructs/pendingDs === null`.

**Estado y dependencias:** Gate D hook real [#781](https://github.com/jfcarpiopuntocom/friendly-123/pull/781) ya está MERGED `5beff221`. El emisor histórico real no existe desplegado; QA Worker tiene flags OFF y carece del Service Binding `WS_FROZEN_HISTORY_SOURCE`. Este injerto queda probado con proveedor sintético independiente, NO publicable a cliente.

## Contrato de páginas de Service Binding (solo servidor)

- Primer POST `/v1/frozen`: `{room,channel}`; continuaciones: `{room,channel,cursor}`; autenticar TODAS con el secreto de `WS_SERVICE_KEY` desde entorno del DO, nunca cliente.
- Cada respuesta: `room`, `channel`, `frozenHead`, `expectedStateSha256`, `expectedVectorSha256`, `expectedOpIds` solo `-ops`, `frames`, `completeToHead`.
- Cuando `completeToHead:false`, `nextCursor` es obligatorio (token seguro 1..128) y único; cuando `true`, no `nextCursor`.
- Mismo HEAD/vector/SHA y event-count en TODAS las páginas; sólo última página puede certificar HEAD; anclar `expectedStateSha256` al origen independiente. `prepareFrozenImport` valida además todos los Yjs frames y rechaza padres/deletes pendientes, SHA, vector y opId falsos.
- Límites QA fail-closed: 16 MiB JSON por página, 4096 frames por página, 4 MiB por frame, `16384` frames globales, `64MiB` bytes globales, `16` páginas, timeout agregado 5 s. No prometer importar 270MiB de Firebase sin compacción certificada.
- Mantener íntegra compatibilidad con respuesta antigua de una sola página; ninguna escritura a SQLite hasta completar y validar todas las páginas.
- No editar `docs/sync-yjs.js`, `src/yparty-piloto.js`, fotos, dinero, PIN, Cloudflare deployed ni shell; respetar todas las reservas.

## Plan ejecutable

- [ ] Confirmar master/head y reservas Notion; congelar propietario de los tres archivos nuevos.
- [ ] Crear rama real `port2/20261119-gate-d-paged-trusted-source`.
- [ ] **RED primero:** test `cloudflare-yparty-worker/qa/p0-gate-d-trusted-paged-source.test.mjs` con 4.097 frames en dos páginas y comprobación final `prepareFrozenImport`; negativo 401 en página 2, cabeza divergente, ciclo de cursor, página final engañosa, flag OFF y compatibilidad v1. CI debe fallar únicamente por falta de paginación, no sintaxis.
- [ ] **GREEN:** cambio mínimo dentro de `trusted-frozen-source.mjs`: loop paginado de Service Binding, acumulación acotada, invariantes por página, sin cambiar importador ni YParty. Simular 401 sin dejar pre-cut SQL parcial.
- [ ] CI exacta: nuevos tests y suite Gate D real Workerd/SQLite y regresiones del Worker. Revisar logs y SHA; publicar PR DRAFT del repositorio real, registrar evidencia independiente y límites.
- [ ] Actualizar Notion y reporte workshop; no acreditar 80/100 solo por paginación. Calidad 67, Port 61, 0/6 GO hasta HEAD real/401 y prueba física. Reversión: revertir PR del helper, manteniendo flags apagados.

## Auditoría breve (Qwen/Gemini + riesgos extra)

1. Origen falsifica `completeToHead:true` sin frames → rechazo por SHA/vector/cuenta y comparación con origen independiente.
2. Repetición de cursor o `page` faltante → rechazo sin bucle.
3. 401/429/Firebase incompleto → rechazo, NO vacío y NO `opened:true`.
4. SQL/DO no recibe bytes hasta certificar toda la historia; ningún segundo escritor.
5. 6.112 frames podría superar límites totales de bytes; flujo debe fallar seguro con diagnóstico, no saltarse padres ni truncar.

**Métricas:** Gate A20 B16 C7 D10 E8 F0 = 61/100, calidad 67/100, 0/6 gates.