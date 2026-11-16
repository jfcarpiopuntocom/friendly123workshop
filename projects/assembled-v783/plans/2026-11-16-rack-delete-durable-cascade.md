# v783 P0: rack DELETE cascade requires local durable ACK — plan before code
**Date:** 2026-11-16 America/Guayaquil
**Branch:** `fix/20261116-rack-delete-durable-cascade`
**Immutable base:** workshop `main` at `aebe93f482bee9320e59ee7c6f9b78c7ee967400` (PR #48 already landed)

## Mandate and coordinating decisions
- All work, test assets, plans and CI in `jfcarpiopuntocom/friendly123workshop`, `projects/assembled-v783`; **never** alter production, client data, real PIN, relay configuration, or business permissions.
- This is **NOT another PUT fix**. Concurrent PR #48 already landed the strict rack PUT fix, making our original PR #49 redundant; PR #49 was closed with RED/GREEN evidence preserved. Avoid repeat edits. New target is DELETE cascade only.
- Use Superpowers systematic debugging + real RED→GREEN, Ponytail full. Existing mature `guardarEstadoLocal(true)`, error classification, conditional rollback and Yjs catalog publication only. No new dependency, component, transport, or generalized mutation framework.
- Keep prior #39 rack POST CAS and #43 category batch strict durability; #47 PUT validation and #48 PUT strict ACK must remain untouched. The app must never return an HTTP 200 deleting a rack and all its products if both IDB and A/B reject writes.

## Root cause from exact current main
In `app/docs/mock-backend.js`, handler `DELETE /api/ubicaciones/:id`:
1. checks rack exists / never delete last rack;
2. marks EVERY active product of the rack `p.borrado=true;p.rev=_revNueva()`;
3. marks rack `u.borrado=true;u.activa=false;u.rev=_revNueva();u.estadoRev=u.rev`;
4. deletes `gastosMensuales[u.id]`;
5. `mov('ubicacion-borrada',...)` immediately announces `oc-catalogo-cambiado`;
6. returns HTTP success while generic finally schedules a **non-strict** `guardarEstadoLocal()`.
This is a source-grounded false ACK + early publication risk with destructive catalog cascade. No confirmed real customer loss is asserted.

## Task A — RED-first synthetic browser regression (must run before runtime edit)
- Extend `app/test/tab-session-handoff.test.js` using existing `context`, `seed`, `ownerLogin`, `api`, with separate Chromium and WebKit tests and native browser binaries.
- Add a second disposable synthetic rack and one fake product with barcode, then confirm baseline durable copy and capture rack, product, exported movement journal length and other sales/stock.
- Monkeypatch IDB `guardar`/`guardarConRevision` to return false, `ultimoError` to QuotaExceededError and A/B localStorage journal writes to throw QuotaExceededError. Intercept only synthetic page storage; never real network or data.
- Attempt `DELETE /api/ubicaciones/:id`. Require **HTTP 507 `RACK_DELETE_STORAGE_QUOTA`**, both rejection mechanisms hit, **no `oc-catalogo-cambiado` announcement**, old rack/product remain present and unmodified, same product/rack revision, movement count unchanged (failed tombstone never written). Do not lower any assertion.
- Restore adapters and retry once; require HTTP 200, only that rack and its one product tombstoned in durable IDB after cold reload; exactly one `ubicacion-borrada` movement. Existing seed sale/stock retained.
- Commit **test only** and a GHA workflow that installs pinned Node22+Playwright Chromium/WebKit, applies `test/helpers/sin-red-produccion.cjs`, archives TAP and SHA, fails on test failures. Observe actual RED from HTTP 200 (not setup failures or missing fixtures).

## Task B — minimal production fix, only after RED proved
- In DELETE handler snapshot `u`, affected active products, their `borrado/rev`, monthly expenses map key/value, `movimientos.length` and `selloUltimo` BEFORE mutation.
- Perform existing modifications; call `mov('ubicacion-borrada', ..., false)` so no Yjs publication precommit. Set `debePersistir=false`; call `await guardarEstadoLocal(true)`.
- If save failed: undo only this operation and ONLY if rack, every affected product and appended movement are still exactly the provisional values and object identities; restore original snapshots and expense key, pop just our movement and restore seal. Otherwise leave peer facts intact and set `_estadoLecturaBloqueada=true` with meaningful `_errorBloqueoLectura`; never silently delete a newer peer update.
- Distinguish HTTP 507 `RACK_DELETE_STORAGE_QUOTA` from 503 `RACK_DELETE_DURABILITY_UNCONFIRMED` through existing strict error classifier; no 200 and no catalog publication on failure.
- On true durable success announce catalog exactly once and preserve original success JSON `{ok:true,productosBorrados}`.
- Do NOT change stock/money/credit business logic or photo bytes; this change is only rack deletion metadata + pre-existing tombstone cascade.

## Task C — GREEN, source seal, integration, handoff
- Recompute **actual SHA256** of `docs/mock-backend.js` and update **only runtime** `./mock-backend.js` in `app/docs/version-manifest.json`; verify in Node crypto CI, preserve immutable `SOURCE-MANIFEST.json` (historical import provenance, not release assets).
- Observe native 2/2 GREEN, prior rack POST CAS, rack PUT validation & strict durability, categories, photo & finance tests and exact SHA 585-target integrated QA with 0 skips/fails. Archive URLs and counts.
- Recheck workshop main SHA for parallel commits. Never merge if #50 or another agent landed an equivalent DELETE fix. Otherwise optional workshop-only merge with expected HEAD SHA after verification and documented plan. Any closed/superseded PR keeps all forensic work.
- Current historic full >3200 still RED; physical same license+PIN PC↔iPhone Safari/PWA A→B→A ×2, offline data, real remote ACK, roles, PWA duplication remain **NO-GO for customer deployment** regardless of synthetic CI.
- Record exact next executable action and test results in THIS file plus Notion https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902 so 5-hour Codex stop never loses work.

## Extra correctness risk
Deleting a rack is destructive and cascades product tombstones; if a peer modified a product or rack during the strict save, we must NOT erase peer facts in rollback. Check both object identity and provisional content including revision and movement/seal. Err on fail-closed. The original code blocks deleting the last rack and must keep that rule.
