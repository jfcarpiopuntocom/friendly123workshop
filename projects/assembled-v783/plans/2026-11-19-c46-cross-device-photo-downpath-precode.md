# C46 PRECODE — Real Browser `idb-fotos.js` + `recover-shelf-photo.js` Workerd `-fotos` Cutover & Cross-Device `A->B->A x2` Downpath E2E

- **Date:** 2026-11-19 (GMT-5)
- **Base:** `master@be032b2` (C44 merged, `v0.8.19`)
- **Budget:** `USD 0.00` (Miniflare + Workerd SQLite + GH Actions only; ZERO R2, ZERO Worker deploys, all QA flags OFF)
- **Collision Check:** Sol6 C45 reserves score-only files (`docs/engineering/*`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`). PR #841 reserves `docs/core/ledger.js` + its red-team test. Zero overlap: C46 adds only `cloudflare-yparty-worker/qa/p0-c46-cross-device-photo-and-downpath-workerd.test.mjs` + `.github/workflows/qa-port2-real-c46-cross-device-photo-downpath.yml`.

## Scope
1. **Real `browser-photo-cutover` (`docs/idb-fotos.js` + `docs/application/recover-shelf-photo.js` + `docs/sync-yjs.js` <-> Workerd `-fotos` DO SQLite):**
   - Device A (`dueno`) stores a real shelf photo via `OCFotos.guardarFotoContenido(dataUrl)` in IndexedDB, runs `API.sembrarFotosAlRelay()` with `corteFotosShaActivo = true` (verifying `API.fotosMap.size === 0`, no legacy shadow).
   - Cold Device B (`empleado`, empty IDB) activates 2.0 in Team role and runs real `F123Application.recoverShelfPhoto(shelf, ports)` wired to `window.OCFotos.leerPorHash`, pulling bytes on-demand from Workerd `-fotos` DO SQLite and caching locally.
2. **Real `verified-cross-device-downpath` (`A -> B -> A x2` + `failbackToLegacy` + re-cutover):**
   - Device A (`dueno`) dispatches `sale.record` (`op_c46_a1`) -> `-ops` DO (`stock 5->4`, `cash 500->2000`).
   - Device B (`empleado`) dispatches `sale.record` (`op_c46_b1`) -> `-ops` DO (`stock 4->3`, `cash 2000->3500`).
   - Device A executes `failbackToLegacy('qa-downpath')`, confirms `modoCorte20Activo === false`, re-arms `activarCorte20Runtime`, and dispatches `op_c46_a2` + replays `op_c46_a1` -> `-ops` DO SQLite ends with exact `stock: 2`, `cash: 5000`, `effects: 3`, `receipts: 3`, 0 duplicates.
