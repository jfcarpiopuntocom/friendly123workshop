# v783 — P0 Rack PUT durable ACK and rollback (2026-11-16)
Canonical branch: `fix/20261116-rack-put-durable-ack`, BASE `f370e73d71a72129852bd1103c866d0c6bf720fd` (workshop main after #47).
**Persist this plan before any test/runtime edits.** This document is the restart ledger if interrupted by a 5h tool or token limit.

## User mission and fixed boundaries
- All source/work/QA in `jfcarpiopuntocom/friendly123workshop`, `projects/assembled-v783`; no modifications to the production `friendly-123` repo, users, worker, licenses, or business data.
- Preserve already merged #39 rack POST CAS/quota rollback, #43 category strict local ACK, #44 relay causal test, #46 Yjs S1 fixture and #47 rack PUT atomic validation. These commits are not to be rewritten.
- Follow Ponytail full: existing `guardarEstadoLocal(true)`, quota classifier and conditional rollback; no dependency or new persistence layer. Superpowers: investigate → run real RED test → smallest GREEN → exact SHA and adjacent/integrated checks.
- Avoid false success or public Yjs publication before local durability, preserve peer writes, fail closed on ambiguous concurrent edits.

## Root-cause evidence and scope
- Just merged #47 validates rack edit fields BEFORE mutations in `app/docs/mock-backend.js`; valid `PUT /api/ubicaciones/:id` still ends:
  `u.rev = revCambio; guardarEstadoLocal(); avisarCatalogoCambiado(); return J(u);`
- `guardarEstadoLocal()` without `true` is asynchronous/best-effort, with no awaited durable ACK. A valid PUT can report HTTP 200 and announce renamed shelf, payout split or photo pointer even if IDB and A/B local journal fail.
- The same file now protects POST rack creation and POST category batch with `guardarEstadoLocal(true)` plus rollback, so the same bug is already demonstrated on adjacent routes (#43 initial RED).
- Affected callers: browser `fetch('/api/ubicaciones/'+id,{method:'PUT',...})` in UI; `test/tab-session-handoff.test.js` existing `P0 invalid rack edits are atomic` covers prevalidation but not durability; other callers use same API. Do not rewrite client code or change result shape.

## TDD test-first steps
1. Add 2 native browser tests (Chromium and WebKit) beside existing rack atomic/POST tests in `app/test/tab-session-handoff.test.js`. Use existing `context`, `seed`, `ownerLogin`, `api`. Baseline rack ID is synthetic and durably created before injecting failures.
2. Inject `idb.guardar` and `idb.guardarConRevision` rejecting saves with QuotaExceededError `ultimoError`; intercept only A/B journal writes in `Storage.prototype.setItem` like existing rack POST regression. Issue valid rack PUT changing `nombre`, `pctQuedaEnCasa`, and `fotoHash` (pointer; synthetic only); expect HTTP **507 RACK_STORAGE_QUOTA**, original rack name/share/photo + rev unchanged in live GET, and zero `oc-catalogo-cambiado` from rejected provisional edit. Prove both IDB and A/B denial injectors executed.
3. Restore real adapters, retry exact PUT: HTTP 200, expected changed name/share/photo, reload a cold browser page and verify one durable rack with expected fields and revision.
4. Create a single guarded GitHub Actions workflow for these tests. Install pinned npm packages + Chromium and WebKit, `F123_REQUIRE_WEBKIT=1`, existing `sin-red-produccion.cjs` and no customer network. Archive full TAP and exact SHA even on failure. Verify **RED from runtime** (200 vs 507), not an invalid fixture.
5. Only after RED, update ONLY the rack PUT path:
   - Capture `const antes={...u}` immediately after validation; preserve no partial mutations.
   - After modifications/rev, snapshot provisional edited keys/rev, set `debePersistir=false`, `await guardarEstadoLocal(true)`.
   - When commit fails, rollback only if same rack object and every edited property still equals provisional version; delete any newly added keys then restore `antes`. If a peer touched state concurrently, set `_estadoLecturaBloqueada` and `_errorBloqueoLectura` instead of erasing peer facts.
   - Return 507 quota or 503 unconfirmed with clear error; **no catalog event or HTTP success** on rejected write.
   - On durable commit, announce once and return unchanged successful rack JSON.
   - Do not retry stale absolute rack edits automatically on 503 (unlike the idempotent rack-create CAS path).
6. Recompute exact `app/docs/version-manifest.json` `./mock-backend.js` SHA256; verify against exact working source in CI with standard Node crypto.

## Verification / integration / interruption handling
7. Observe GREEN 2/2 Chromium+WebKit and original #47 invalid rack PUT (2/2), #39 rack POST/quota/CAS (4/4), #43 category dual-store quota/adjacent flows; verify zero skips.
8. Run existing integrated browser+authority QA suite (target 585, but actual count and logs decide), plus financial, photo, credit and off-device recovery witnesses where available. Run historical full audit if feasible or link unmodified failure baseline; do not suppress unrelated failures.
9. Draft PR against fresh main with exact SHA, RED/GREEN run IDs, manifest proof and remaining constraints. Do **not merge** until test gates observed and main checked again for concurrent commits. Workshop merge may proceed after expected head verification and no conflicting changes, but production remains NO-GO until physical iPhone Safari/PWA ↔ PC A→B→A ×2, remote durable ACK and real license/PIN.
10. Append every substantive result and next executable action to THIS file and Notion living log https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902. Never claim tests ran if they did not.

## Risks / rollback
- A strict local commit may add latency to rack edits; correctness outweighs an unacknowledged success. No accepted sale or stock is modified by this path.
- If existing reference to `u` moved or a peer changed rack while awaiting CAS, block writes rather than silently undo a newer event.
- The app needs a browser/Workerd real test to verify that IDB/A/B dual failure means quota and rollback is valid; no invented ACK.
- No changes to money, stock, roles, and real photos; `fotoHash` synthetic pointer only.

## Executed TDD checkpoint and exact pending work (2026-11-16 UTC)
- **Valid RED observed** in native Chromium AND WebKit at [GitHub Actions 43969521907](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43969521907), job 133657683605. Both tests reached actual endpoint and returned **HTTP 200 rather than 507** after dual-store synthetic quota injection. Logs: `P0 rack PUT rejects a false durable ACK`, 0/2 PASS, 2 FAIL, 0 SKIP. No fixture exception or setup failure.
- Runtime patch **`6f431643ea0126ed13b3c78a8a491251ceaabb17`** implements `guardarEstadoLocal(true)` on valid PUT, suppresses generic asynchronous finally, publishes catalog only after durable ACK; on rejected edit, restores only unchanged provisional properties/revision, otherwise fail-closed without overwriting concurrent peer facts. Error codes reuse `RACK_STORAGE_QUOTA` (507) and `RACK_DURABILITY_UNCONFIRMED` (503); no changes to rack POST, category batch, stock, money or user permissions.
- Asset manifest patch **`ae57dae3bf966906073d852be25bc1c57b8f56b5`**: independently SHA256-checked `docs/mock-backend.js` is `edaadbceeba5220f283372e4ed04a92133e3487534ac5a4d993b5bbc259ac737`. Workflow verifies this hash via Node built-in crypto; no dependency added.
- **Critical: the GREEN native-browser and adjacent tests were NOT yet observed at checkpoint time.** Do not merge or call fixed without a successful exact-head log. Next action: read GitHub Actions runs for head `ae57dae3bf96`, inspect failure causes and counts, then read integrated workflow (585 target, no skips). If GREEN, record run URLs and re-read current main for concurrent changes.
- If new test fails after patch due to a fixture/async readback, document its precise failure, correct the test without weakening original status, rollback, no-notice, cold-copy asserts; rerun. If product fails, trace `guardarEstadoLocal(true)` and adjust smallest existing logic.
