# C46 Verification Report — Workerd E2E Browser Photo Cutover + Cross-Device `A->B->A x2` Downpath

- **Date:** 2026-11-19 (GMT-5)
- **Base:** `master@be032b2` (C44 merged, `v0.8.19`)
- **Branch:** `port2/20261119-c46-cross-device-photo-downpath-qa`
- **Spend:** `USD 0.00` (Miniflare + Workerd SQLite only; zero shell bump, zero score-file collision with C45, zero collision with PR #841)

## Verified Real-Source Behavior
1. **`browser-photo-cutover`:** `docs/idb-fotos.js` (`OCFotos.guardarFotoContenido`) + `docs/sync-yjs.js` (`sembrarFotosAlRelay` with `API.fotosMap.size === 0`) -> Workerd `-fotos` DO SQLite -> cold Team `empleado` running `docs/application/recover-shelf-photo.js` + `docs/core/shelf-photo-policy.js` (`OCFotos.leerPorHash`) recovers exact shelf photo bytes and caches in Team B IndexedDB.
2. **`verified-cross-device-downpath` (`A -> B -> A x2`):** `Owner A` sale (`op_c46_a1_sale`) -> `failbackToLegacy` (`mode: 'failback-legacy-1.0'`) -> `Owner B` (`activarCorte20Runtime`, sale `op_c46_b1_sale`) -> `failbackToLegacy` -> `Owner A` re-arm (`op_c46_a2_sale` + replay `op_c46_a1_sale`), yielding `stock: 2`, `cash: 5000`, `effects: 3`, `receipts: 3` in Workerd `-ops` DO SQLite.
