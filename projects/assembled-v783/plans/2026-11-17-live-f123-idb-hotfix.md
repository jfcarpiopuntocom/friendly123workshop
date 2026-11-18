# LIVE friendly-123 hotfix #1 · v2 outbox cross-tab atomic IDB without Web Locks · JFC Option A

## Scope and baseline (17 November 2026)
- JFC explicitly approved first LIVE-repo PR, **not production deploy**, to port the already-proven PR95 workshop fix from friendly123workshop/main (merged e50ee2ed). Keep store-level rollout flags unchanged, master untouched pending review/CI; test on only the one authorized QA license later, not a customer's business.
- LIVE jfcarpiopuntocom/friendly-123/master observed SHA 45757cac5d9268402049c0fba90cccdece150ac6. Its docs/sync-yjs.js contains the **same** v2 get/cache/save/mutarOutbox code and unsafe `navigator.locks ? ... : run()` at ~632-633, file blob fa7ab886523f23f8fff37bf1618516f7810cbff3.
- Source-of-truth proof: [workshop PR95](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/95) real source-extracted `fake-indexeddb` two-tab behavioral test: RED 5/7 (ACK tombstone lost) [44207154344](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44207154344) -> GREEN 7/7 [44208241569](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44208241569), plus frozen Firebase/Yjs historical tests GREEN [44208241466](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44208241466).

## Smallest complete safe change (ONE live PR, not two)
1. Create isolated LIVE branch from exact observed master SHA. Copy exact workshop test `app/test/p0-outbox-v2-two-tabs-web-lock.test.cjs` to LIVE `test/p0-outbox-v2-two-tabs-web-lock.test.cjs` and its GitHub workflow or existing CI integration; run RED on unmodified live source first. Keep money/stock/backend untouched.
2. Inject **only** helper `mutarOutboxAtomicoSinLocks` from merged workshop `app/docs/sync-yjs.js` into LIVE `docs/sync-yjs.js`, and replace unsafe no-lock `:run()` branch with helper. v2: a single native IndexedDB readwrite transaction serializes reading current meta + rows, applying synchronous changes, storing rows/tombstones/meta; durable notifier only after transaction `oncomplete`; missing v2 atomic IDB never fabricates ACK. Normal Web Locks branch unchanged.
3. Preserve legacy v1 when v2 rollout intentionally disabled or deferred for huge historical queue (109MB scenario); emit `f123-outbox-integrity` event `legacy-v1-single-tab-required`. This does NOT certify v1 multi-tab safety. Do not silently block checkout just because Web Locks are missing. Distinguish operation pending from confirmed durable.
4. Run focused two-tab 7/7 and full affected legacy/Firebase/Browser tests on exact PR SHA. Never claim a live physical QA sale without actual device evidence. Leave branch DRAFT/NO MERGE on CI failure or until human review.

## Non-goals and rollback
- No photo worker, no ledger opId architecture, no auto-reload/overlay, no global flag flip, no changes to stock or PIN, no deployment, no dashboard edits in this PR.
- Revert the single source hunk + test/workflow or close draft PR; production master untouched until accepted. Next separate D1 dashboard filter PR only after this security hotfix is green.
- Scores are separate: architecture candidate 67.0/100, full port 36.0/100, 0/6 frozen gates; a live PR alone does not earn port points or certify the 3-hour bridge.
