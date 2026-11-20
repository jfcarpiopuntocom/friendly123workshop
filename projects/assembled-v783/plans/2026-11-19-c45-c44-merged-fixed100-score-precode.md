# C45 PRECODE — scoring of C44 merged in REAL friendly-123

19 Nov 2026 Ecuador / 20 Nov UTC. Sol6. Ponytail: score-only credit from the same fixed 100.0-point rubric, NO new feature work and NO production cutover.

Product master baseline: be032b2b27fd52c299d8e1b6942d9b7bb2596934, v0.8.19, C44 PR #842 merged. C44 final branch SHA 00ebbb9b5805009f1534cb3f58d838b52d7fd3ba passed 46/46 GitHub workflows, including Chromium/WebKit lost-payment-response retry, Workerd SQLite real DO E2E and release-control. Authenticated Cloudflare Workers Builds successful for exact merged SHA, build 0d4d8889-2b95-4d70-8acc-b43852df983a.

ROOT CAUSE AND REGRESSION: original C44 replay sent a duplicate inventario_abono to EventBus after an HTTP response loss even though cartera_abono remained unique. Final product guarded OCSyncEmit('abono') by first-seen movimientoId, without EventBus synthetic inventory fact. The real client uses the original customer-payment opId. Actual product files: docs/mock-backend.js, docs/sync-realtime.js, docs/sync-yjs.js; Workerd qa/p0-c44-ajuste-abono-workerd.test.mjs and browser payment test. No Sync3 or deployment flags changed.

BASE SCORE verified in master: migration 87.0/100.0, engineering quality 76.8/100.0, physical 0/5, commercial GO 0/6. Workshop is NOT the app. Sync3 is already a retained 2.0 component. Fixed-budget typed-economics capacity 17.0, earned 16.0, remaining production-business-dispatch 1.0.

PROPOSED MERGED-ONLY CREDIT: split the existing 1.0 remaining business-dispatch budget into 0.5 DONE for real C44 browser adjustment and payment opId envelope and typed Workerd acceptance; 0.5 remains UNearned for actual production dispatch. PORT 87.0→87.5/100.0, budget 100.0 unchanged. Business quality +0.2 (18.3→18.5 out of 20.0), total quality 76.8→77.0/100.0 for negative Chromium/WebKit replay regression and Workerd DO replays. No other quality or GO credit. Must pass RED→GREEN exact source and budget assertions; otherwise revert.

FILES score-only: docs/engineering/architecture-2-port-score.json, docs/engineering/architecture-2-quality-score.json, scripts/architecture-2-port-score.cjs, test/p0-architecture-2-port-score.test.cjs, docs/engineering/architecture-2-port-score.md. Product code untouched, no second writer; use own score-only branch from exact C44 merged master. C43 prior score reservation is released. Ledger docs/core/ledger.js is reserved to another owner; PR #841 is intentionally red. Do not touch.

EXECUTE: (1) commit RED score test on branch and verify failure expected 87.5 vs 87.0; (2) add C44 guarded score checks of exact real source, shell v819 and manifest, exact negative retry and Workerd SQL test presence; (3) change JSON with SHA pinned to merged PRODUCT SHA be032b2... for every credited DONE milestone; (4) run score tests, check-sw.sh, GitHub required workflows and Cloudflare Builds; (5) merge only if GREEN and no new conflicts, log evidence in Notion and workshop.

Acceptance and next core blocking causes after C45: real Firebase HEAD/R2 binding, one-authoritative-writer production switch and customer PC↔Safari/PWA A→B→A twice. GO 0/6 remains. The C44 score does NOT count deployed DO or live customers.
