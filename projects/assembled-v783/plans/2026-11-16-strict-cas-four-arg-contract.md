# v783 strict local CAS — two historical assertions on obsolete 2-arg call · restart proof · 2026-11-16 Ecuador

Repo `jfcarpiopuntocom/friendly123workshop`. Branch `test/20261116-strict-cas-four-arg-real-contract` forked immutably from `main 4ea62e717e029f091b4fdc35cbae481b4cf5481f` after #64; #65 is concurrent test-only branch `test/20261116-v579-sale-pn-ack-contract` (do not overwrite or merge prematurely). Plan committed **BEFORE any test code** for 5-hour restart and other agents.

## Why — exact real evidence
Unfiltered original historical [run 43989633836](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43989633836), 3,231 TAP/44 FAIL, TAP #1455 `real strict path measures queue, serialization, IDB and total outcome without touching CAS` in `test/p0-local-save-performance-opt-in.test.cjs` and TAP #1605 `P0 JFC: strict CAS stays fenced; verified local A/B recovery is the only IDB-failure fallback` in `test/p0-sales-atomic-idb-webkit-browser.test.cjs` both fail on exact regular expression `/idb\\.guardarConRevision\\(completo, _localRev\\)/` matching obsolete 2-arg call. Actual assembled runtime `app/docs/mock-backend.js` contains `idb.guardarConRevision(completo, _localRev, _commitLocal, opIdVenta)` for both hung IDB retry and strict normal CAS. This is stronger: receipt identity `opIdVenta` and immutable commit marker `_commitLocal` propagate through transaction; missing opId is a correctness risk. The tests must not reject it. No proof this is an app runtime bug; original browser CAS tests and A/B fallback checks remain essential.

## TDD execution
1. Preserve original full RED and name/location in this plan, no runtime edit.
2. In only two existing test files, replace the exact obsolete call regex with a stricter, exact 4-argument version (must include `_commitLocal, opIdVenta`). Do NOT remove either assertion, or any behavior test, or disable browser tests. Preserve 4 original Chromium/WebKit/IDB-CAS cases + performance privacy checks.
3. Add a lean Node22 native Chromium/WebKit no-deploy Github workflow `v783-strict-cas-four-arg-historical.yml`, running **ENTIRE original two test files**, with pinned npm lock, official browsers, production network blocker, TAP, SHA and exit code archived even red. Run; if red, investigate actual stack and retain evidence, not grant fake ACK.
4. Run the integrated assembled 585 test harness on exact new head. If both focal and QA green and main still compatible (possibly after #65), merge only this test-only change to workshop main, archive exact URLs and SHA. No client release.
5. Full historical unfiltered needs fresh run after #63/#64/#65/this change. Existing 44 fail on old head remain authoritative until new evidence, do not subtract imagined fixes.
6. Record Notion live handoff and `STATUS.md`; never lose plans/branch/RED artifacts across 5h stops.

## Critical product gates
No root/docs or deployment modification. No PIN, actual license, customer data, money or photos, no PWA/SW/Workbox. Browser local CAS never implies server-side receipt; `stored-for-application` != `business-committed`; remote exactly-once executor/authority absent. Two physical PC Opera→iPhone Safari/PWA→PC A→B→A cycles still unverified.
