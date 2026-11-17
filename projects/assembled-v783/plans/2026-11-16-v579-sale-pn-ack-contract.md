# v783 P0 v579 sale/PN durable-ACK historical regression recovery — plan before code

Date 2026-11-16 Ecuador / 17 Nov UTC.
Repo `jfcarpiopuntocom/friendly123workshop`, isolated branch `test/20261116-v579-sale-pn-ack-contract`, immutable base main `4ea62e717e029f091b4fdc35cbae481b4cf5481f` (post-#64).
This is an executable 5-hour restart checkpoint; no user data, real credentials, source app/money/stock/PWA/relay changes or production deployment.

## Verified RED, no false bug classification
Unfiltered full native [43989633836](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43989633836), 3,231 tests/44 FAIL on pre-#63 SHA, shows `not ok 528 - test/v579-venta-pn-ack.test.js`; **Node file aborts before all actual tests** at line 6 source anchor `const _fotoVenta = { stock: p.stockActual`. Current `app/docs/mock-backend.js` uses safer shared `function _marchaAtrasStock(p)` capturing `stockActual`, movement count/seal and exact presence+deep copies of `stockBase, stockPN, stockTs, stockCountTs, stockDeficit, stockReconciliacionPendiente`. Current sale instead begins `const _ventasAntes = ventas.length, _deshacerStockVenta = _marchaAtrasStock(p);`, and `_revertirVenta` uses this closure plus `ventas.length = _ventasAntes`.
Source verified: `mov("venta", ... false)`, `_prepararOpStock(_opVenta)`, `_perchaEnCeroYFaltante(p)` before `await guardarEstadoLocal(true, true, false, opIdVenta)`; after true ACK, `emitirOpStock("venta", _opVenta, true)`. Failure path calls `_revertirVenta()`, and `_ventaConfirmando` gates Yjs, reads and catalog merge. Source inspection alone is NOT dynamic proof that no ghost sale occurs.
Original historical test also assumes old inline `const _fotoVenta` and old per-sale `_revertirVenta` body in its VM. It must be migrated to *actual shared rollback primitive* rather than recreating old business logic or changing runtime. The other test clauses, particularly full backend sale, declined CAS, IDB pending, PN counter exact-once, and remote merge after rollback, must stay unmodified and execute after harness is repaired.

## Steps: Superpowers RED→smallest harness update→GREEN, Ponytail proven primitive
1. Preserve original RED log and this plan BEFORE edit.
2. Modify only `app/test/v579-venta-pn-ack.test.js`:
   - start sale source slice at the current `_ventasAntes, _deshacerStockVenta` line, keep original end at `/api/ventas/:id/anular`.
   - for second original test, extract exact shared helper source using anchors `function _marchaAtrasStock(p)` through `function _prepararOpStock(...)`; extract current sale's `_ventasAntes/_revertirVenta` declarations through `let _ventaGuardada`; execute real helper plus actual failure branch `if (!_ventaGuardada)` in VM with synthetic prior/no-PN product states. Preserve checks for status 503, no double entry, no ghost movement, and exact own-key presence; augment snapshot/role/operation identity as feasible without weakening.
   - Keep every original dynamic full backend test, no skip/regex relaxation. If more prior anchor has become stale, inspect actual source stack and repair only that fixture. If true product failure emerges, stop and isolate RED before any runtime patch.
3. Add minimal no-prod-network Node22 GitHub Actions workflow `v783-v579-sale-pn-ack.yml`, entire original test file `node --test`, archived TAP+SHA+failure. No production fetch, no PWA/browser or credentials.
4. Draft PR and run. Require complete original file GREEN; separately integrated assembled 585 cases before workshop-only merge; no global full success claim.
5. Recheck main and other parallel branches before merge. If product violation is observed, preserve failing PR and start independent root-cause design before source edit. Do not write fake ACK or override PIN/sync.
6. Record exact head, original RED, current GREEN or blockers, CI link, and follow-up in this plan/Notion. No loss at 5-hour cut.

## Strategic gates unchanged
Current full historical last 44 FAIL on older SHA; #63/#64 focused green but no postmerge full. No physical two PC Opera→iPhone Safari/PWA→PC A→B→A cycles with same license/PIN or remote commercial `business-committed` readback, exactly once opId, photos/stock/money/roles/outbox. `stored-for-application` inbox is not business ACK. Product and clients remain NO-GO, work only workshop.


## Native exact-source RED after initial harness restoration (observed before second edit)
Focal [CI 43992822406](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43992822406) on commit `661a8face69373e1f85b9889c44fcb1a670b3ca8`: **8 executed; 7 PASS, 1 FAIL, 0 SKIP**. All seven other original business assertions including strict rollback with actual shared helper, source merge/read lock and real backend sale serial/IDB pending/reject PN survived. Failing test only `sale: stock PN must enter first durable snapshot, and only then announce` `error: prepare PN before durable ACK` at line 16. Its **left** source token `_prepararOpStock(` exists; its right anchor `await guardarEstadoLocal(true, true)` is obsolete as exact string because current backend invokes `await guardarEstadoLocal(true, true, false, opIdVenta)`, adding explicit non-budget flag and opId exact-once receipt. Not evidence of out-of-order stock movement. The next tiny test-only edit changes the latter token to the exact four-argument call, making assertion STRICTER about stable opId; rerun complete original file with same no-production network and integrated browser QA. If any new RED appears, inspect; no runtime modifications.
