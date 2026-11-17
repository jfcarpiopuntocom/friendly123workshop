# v783 P0 #607 strict rack quota regression: plan and 5h checkpoint

Date Ecuador 2026-11-16. Repo `jfcarpiopuntocom/friendly123workshop`, branch `sol/20261116-v607-strict-rack-quota-contract`, base exact `main 73f005a5ed62d0727ee269a38fff347d0834a585` (#58 merged).
No production, real license/PIN, user/business data, backend, relay, source bundles or assets changes.
Separate, non-overlapping #52 PR modifies `mock-backend.js`, rack status and manifest; this PR MUST NOT touch those files. Superpowers: forensic → observed RED → strict behavior-based TDD → real CI GREEN; Ponytail: reuse current strict CAS and A/B design.

## Reproduced historical RED and root cause
[Full unfiltered native historical run 43983149410](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43983149410) `not ok 2891`, test `app/test/venta-durable-deficit.test.js:193`, asserts that `POST /api/ubicaciones` triggers `oc-memoria-llena:true` when `localStorage.setItem` throws synthetic quota but `OCEstadoIDB.guardarConRevision` explicitly returns `true`. That route is NO LONGER A BACKGROUND WRITE: merged rack POST #39 now performs `await guardarEstadoLocal(true)` and issues HTTP success only after durable ACK. Real current `docs/mock-backend.js` `_guardarEstadoLocalAhora` prefers strict CAS, and when it returns true, tries A/B backup best-effort, calls `terminar(true)` and `despejarAvisoMemoriaLlena()`. The test's IDB CAS fake asserts a durable successful COMMIT, so demanding the visible memory-full warning for a secondary A/B failure is contradictory. Owner explicitly prohibited misleading banners where primary save succeeded. The contract must cover both situations, **not merely remove assertion**.
Further evidence in living [Notion](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902).

## TDD scope: change only original test and test-only CI
1. Preserve historical full RED trace (done) and this plan committed before code.
2. Update the old #607 case to assert **strict** `POST /api/ubicaciones`: simulated IDB `guardarConRevision() === true`, A/B full → HTTP200, exactly one strict CAS ACK, one rack, zero false `oc-memoria-llena:true` events. Keep already existing adjacent test: stale A/B quota must not mislabel IDB CAS revision conflict.
3. Add paired, distinct **REAL full-store quota** synthetic case: `guardarConRevision() === false` with `ultimoError()=QuotaExceededError`, `localStorage.setItem` full, A/B unavailable → expected HTTP507 `RACK_STORAGE_QUOTA`, visible `oc-memoria-llena:true` (real loss of local durable commitment), no rack or movement in exported state, no Yjs provisional catalog event. If RED, inspect root before runtime fix, and **DO NOT change `mock-backend.js` while #52 owns it**.
4. Keep nearby actual financial/stock/v607 tests unmodified; run entire original `test/venta-durable-deficit.test.js` in Node22 with no-production-network blocker. New workflow `.github/workflows/v783-v607-rack-storage-quota.yml` archives TAP, SHA, unfiltered exit code, no deploy.
5. Open DRAFT PR from exact head; read CI logs; distinguish GREEN of old behavior and RED of actual both-store failure. If RED persists, do not merge or wave warning; report and handoff to #52 branch owner. If all green and integrated QA green, merge workshop-only after rechecking main and PRs.
6. Full historical audit and physical PC Opera↔iPhone Safari/PWA A→B→A×2 and remote opId/ACK remain NO-GO regardless. No production customer changes.

## Handoff
Record exact commit SHA, CI links and results here and Notion. No hidden background work. On 5h limit, resume this plan and PR instead of redoing analysis.
