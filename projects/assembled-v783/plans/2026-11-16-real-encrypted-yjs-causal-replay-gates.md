# Próximo P0 funcional: replay causal cifrado con checkpoint+tail y ACK verificado — plan antes de runtime

**Fecha:** 2026-11-16 Ecuador / 2026-11-17 UTC. **Base workshop:** `3fced2258cd2f96740d2136cdecf65b00919cde3`. **Estado:** diseño de experimento test-first; NO implementado, NO-GO clientes. **Fuente crítica:** `projects/assembled-v783/app/docs/sync-yjs.js` (revisada sha del blob `d3bfaecabff2ae69d41ee1dbcdd153d07169bb1b`). No escribirla en paralelo con otra reserva activa.

## ¿Qué cambió la evidencia?
La [PR #72](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/72) añadió al canario *del taller* clasificación segura de etapa sin tocar Sync3; no ha resuelto el canario de producción. La [PR #73](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/73) midió 5k updates en Node22 con vendor Yjs fijo: causal 118/78 ms, inverso 7043/5569 ms, inverso con `Y.mergeUpdates` en lotes de 192 113/79 ms. Son dos muestras, **no** prueba de optimización de la app.

En la fuente REAL `sync-yjs.js`:
- `:1780–1876`: `manejar(buf, source)` autentica/desencripta `descifrarBin(API.clave,buf)`; maneja etiquetas 3 (fragmentos), 7 (checkpoint gzip), 4 (señal) y 0/6 (Yjs); `Y.applyUpdate(doc,payload,'red')` se invoca individualmente después de descifrar. `appliedUpdate(payload,receipt)` y `API.confirmarCatalogoVisible` pueden observar efectos de actualización.
- `:1880–1915`: frames ArrayBuffer/Blob se encadenan en `_colaRecepcion`, secuencialmente. El comentario promete guardar cursor **después** de aplicar todos los binarios.
- `:1942–2052`: `pull-page` verifica `fallos`, rebase/checkpoint, `guardarPullCursor(c)`, continuación, HEAD y rescate causal; no debe confirmar página si falta autenticación/aplicación.
- `:1027–1058`: `guardarPullCursor` separa `_pullCursor` de `_appliedPullCursor`, guarda prueba causal en IDB y readback, retiene pending proof si faltan structs, nunca certificar un durable cursor en modo RAM. **Preservar** estas barreras.
- Producción canario 16-nov: 26 páginas y 4.966 frames al pulso 130s, 15 padres faltantes y `more=true`, luego excepción genérica; no se conoce causa. 14/14 canarios programados 3–16nov rojos.

## Orden de trabajo obligatorio — sin tocar clientes

1. **Reserva/lock y SHA.** Antes de crear rama, consultar Notion War Room para ownership de `sync-yjs.js`. Usar `friendly123workshop` branch aislada, plan antes de prueba. No tocar `friendly-123` production ni relay real. Codex port #70 y cola multipestaña son carriles distintos; no pisar.
2. **Test RED en código REAL, no solo microbench.** Reutilizar `app/test/helpers/e2e-app.cjs`, `firebase-relay-pagina-v665.test.cjs`, `yjs-autorecovery-native.test.cjs`, `p0-yjs-pending-snapshot.test.js`. Crear fixture local: `Y.Doc` de 2–3 emisores con checkpoints y tail cifrados, páginas 64 y fragmentos tag3, reorder inverso, duplicados, missing parent deliberado, y tag7; mock de WebSocket/Firebase on-localhost sin network exterior. Exigir RED en barrera que se quiere reparar, no cambiar expect para fabricar fallos/verde.
3. **Instrumentar solo QA.** Recoger tiempos relativos `t_decrypt`, `t_apply`, `t_idb_journal`, `t_cursor_readback`, `t_business_apply`, contadores y `pendingStructs.missing` **sin** licencia/PIN/capability/Yjs client IDs/ciphertext en logs. Probar que el socket/página no da ACK comercial si falta frame, padre, checksum o IDB commit.
4. **Contrapruebas semánticas.** Misma licencia sintética en dos contextos Chromium/WebKit con IDB independientes; A→B→A×2, 4 recibos únicos, stock 8→4, replay mismo opId no altera stock/dinero, fotos y roles; close/reopen offline→online. No confundir pump Yjs sintético con transporte real.
5. **Sólo tras pruebas:** evaluar a) checkpoint completo + tail fiable, b) coalescencia bounded **después** de autenticar/decryptar tag0 de pull, c) ordenación causal antes de `Y.applyUpdate`. Prohibir fusión ciega de etiquetas 3/4/7, mezcla ops/fotos/catálogo, ACK antes del commit IDB, pérdida de `appliedUpdate`/observadores, bypass de PIN/HEAD y cambio de proveedor. Checkpoint viejo o historial irrecuperable debe señalar NO-GO, nunca inventar movimientos.
6. **Performance/recursos.** Medir por fase en CPU GitHub y navegadores nativos; 5k inversos en Node fueron ~5.6–7.0s, no extrapolar a 50–200ms en dispositivo. Limitar memoria/lote (<cap fijado tras medición), ciphertext bytes, cuotas por proveedor. No aumentar timeout del canario para blanquear fallos.
7. **Integración segura.** RED→GREEN focal, regresiones y 585 integrada sobre SHA final, full histórico reportado aunque rojo, canario sintético sin secrets, revisión independiente, manifesto/SW solo si runtime cambia y corresponde release. Guardar todos los logs, plan, commits y diff en workshop + Notion **ANTES** de merge. No GO en producción hasta 2 ciclos físicos Opera PC↔iPhone Safari/PWA↔PC con venta, inventario, dinero, fotos, roles, PIN y readback después de reinicio.

## No asumir
Yjs es idempotente/conmutativo si están *todos* los updates; `Y.mergeUpdates` no genera padres ausentes. 14/14 canarios rojos no prueban pérdida de venta, y 585/585 sintéticos verdes tampoco certifican red/IP física. Referencia oficial: https://docs.yjs.dev/api/document-updates.

## Checkpoint y orden de reanudación
Este archivo y [Notion](https://app.notion.com/p/41b1642b67f381998ad5eda4b3ac951c) son el punto de partida tras stop de 5h. NO reescribir/olvidar PR #72 (merge `03861673`), #73 (merge `62262c9b`), el benchmark, los pendientes de PR #67 full histórico, ni los warnings del outbox. Antes de editar: leer `STATUS.md` y PRs recientes y verificar HEAD/owner/lock. Crear prueba contra *fuente de app* y no sólo Yjs aislado.

**No implementado en este documento:** batching, cambio de relevo, recuperación cliente real, validación de credenciales o despliegue.
