# Reconcile v601 early-send tests with strict durable rack ACK (TDD)
Date 2026-11-16. Branch test/20261116-v601-durable-rack-guard, base workshop main 95e5a7408b404814139866e58b97ac46618aef53.

## Real historical evidence
Full historical npm test [43965240844](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43965240844) 3220/3162 PASS/54 FAIL shows two failures in `test/enviar-mientras-guarda-v601.test.js`: scenarios (a), (a2) throw `POST /api/ubicaciones: 503 {"code":"RACK_DURABILITY_UNCONFIRMED"}` *before reaching their old assertions*. They intentionally set all `localStorage.setItem` operations to throw and mock only the old asynchronous `OCEstadoIDB.guardar`. Since #39 rack POST now uses strict `guardarEstadoLocal(true)` and must never ACK or publish a failed rack, a 503 is correct. The original v601 assertion that a newly CREATED rack becomes visible to Yjs before durable store completion is **unsafe and obsolete**.
Case (b) payout strict-save no provisional publication already PASSES and must remain unchanged.

## Minimal source-aware change (Ponytail full)
1. Keep setup and the complete financial case (b) unchanged. Revise only (a)/(a2) to explicitly assert that a failed create-rack POST rejects with code `RACK_DURABILITY_UNCONFIRMED` (or quota 507 if reliable), leaves no new rack visible and does NOT broadcast provisional catalog. Verify persisted state and check accepted retry after restored storage where supported.
2. Do NOT force `catalogoPropio()===null` globally if earlier valid seed exists; use before/after observations and event counters at the operation boundary.
3. Run **original complete** `test/enviar-mientras-guarda-v601.test.js` with Node 22 and `test/helpers/sin-red-produccion.cjs`, 0 skipped. If green, include strict modern rack POST quota/CAS browser suite to ensure no lowered bar.
4. Do not touch `mock-backend.js`, any runtime, Yjs, licensing, money or production. Older fast-publish invariant may apply to unrelated non-durable operations, but NOT rack create; do not generalize beyond this test.
5. Before merge, check exact main / parallel PR #52 rack activate/deactivate. No physical A→B→A, remote ACK or full historical GO inferred.
