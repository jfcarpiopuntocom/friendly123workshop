# Research + C68 UI Photo 2.0 Cutover Advisory (`master@b6c24a0` -> PR #868)

Date: 2026-11-20 (Ecuador), Cost: **USD 0.00** (zero R2 writes, zero prod deploy, QA flags OFF).

## 1. Cloudflare Durable Objects (SQLite / Alarms / WebSocket Hibernation) Research Audit
Checked 2025-2026 Cloudflare DO production pitfalls against `cloudflare-yparty-worker/src/`:
- **Synchronous `transactionSync`:** All SQLite calls inside `ctx.storage.transactionSync(...)` in `index.js`, `authoritative-business-sql.mjs`, `certified-frozen-import.mjs`, `merge-frozen-into-existing.mjs`, `photo-sha-storage.mjs`, and `typed-commercial-ledger.mjs` are pure synchronous SQLite calls with zero `await` / network calls inside the transaction block.
- **Alarms:** Zero unguarded `setAlarm()` loops exist in `cloudflare-yparty-worker/src/`.
- **WebSocket Hibernation state & close lifecycle:** `index.js` keeps admission state in `conexion.state.accesoFirmado` (hibernation-safe) and cleans `this.pendingAdmissions.delete(conexion.id)` inside `finally`, delegating close frames cleanly to PartyServer `YServer.onClose`.

## 2. Three Real Browser UI Photo 2.0 Cutover Bugs Fixed in PR #868 (`C68 v0.8.25`)
1. `docs/vista-perchas.js` (`readSyncByHash`): Only inspected legacy `window.OCYjs.fotosMap` (which is empty under `corteFotosShaActivo=true`). Now falls back to `OCYjs.fotoSha.get(hash)` ONLY when backed by `OCYjs.fotosRefs.get(hash)` (`ref.sha === hash`) and verifies SHA-256 of downloaded bytes via `OCFotos.hashDeDataUrl(bytes)`.
2. `docs/sync-yjs.js` (`oc-catalogo-cambiado`): Saving a new shelf/product photo in the UI only triggered `pedirSeed()` (publishing the `fotoHash` pointer) without calling `API.sembrarFotos()` to upload bytes to `-fotos` DO. Added an independent guarded listener (`if (API.corteFotosShaActivo === true && API.fotoSha && typeof API.sembrarFotos === "function") API.sembrarFotos()`), leaving `pedirSeed()` untouched for `test/p0-v637-perf-300.test.cjs`.
3. `docs/sync-yjs.js` (`_instalarLectorFotoShaBajoDemanda`): Reusing `OCFotos.leerPorHash` across authenticated logins never reset the 16-read remote cap when a new `API.fotoSha` client was installed. Scoped `API.__fotoShaLecturasRemotas` per `API.fotoSha` bridge instance.

**TDD:** Confirmed 3/3 RED before fix -> **34/34 unit/contract PASS + 2/2 Workerd E2E (`C33`/`C49`) PASS + `release-control.cjs` PASS + `check-sw.sh` OK** in [PR #868](https://github.com/jfcarpiopuntocom/friendly-123/pull/868).
