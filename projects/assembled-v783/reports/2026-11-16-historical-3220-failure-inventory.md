# Full v783 historical audit: precise unreduced failure inventory
Date 2026-11-16 | Actual run [43965240844](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43965240844) | Job 133642831554

## Verified summary
- **3220 TAP tests, 3162 passed, 54 failed, 3 skipped, 1 cancelled.** Exit nonzero; **NO-GO** for full suite.
- Logs contain **55 `not ok` records**, including parent file failures. These are NOT all independent failures and must not be reported as 55 TAP test failures.
- This run restored original immutable v607 `82952a84958641010c48bfbee6aab80007ba12e9` and v606 `7e51ed51560d6138866dae98e4a01ff1772db51c` `docs/sync-yjs.js` before `npm test`; missing-history-file failures from earlier full run did not recur.
- This branch predates merged #46 opsDoc VM-binding fix, which separately passed all 7 assertions and landed in main `1808c932`. Distinguish source SHA before comparing historical counts.
- Several failures assert on external production, canary, deployment or old-shell workflow structure. Treat as **unclassified** until source and environment are examined. Do not waive or delete tests to obtain an artificial green.
- The later workshop main has advanced through #47, #48 and #51, with rack activate/deactivate #52 under development; results here do NOT certify that later main.

## Exact `not ok` records (in original job order)
- `497` — v459 reader on data from the new mechanic: keeps the old balance, no double discount, no invented cash, no crash
- `499` — old device + new device on the same data: the new mechanic fixes the debt, the old one keeps working with real payments
- `679` — E1b-3: three Yjs rooms follow visibility and lease
- `129` — test/e2-active-user-reload.test.js
- `704` — (a) non-money change is announced and broadcast while a normal save is still pending
- `705` — (a2) a failed last save with RAM different still blocks sending
- `811` — hotfix hands off tested SHA after promotion; broad regression cannot duplicate deployment
- `931` — real language buttons preserve a synchronized name and translate the location selector after redraw
- `1028` — src/app/app-inline-03.js — never auto-reload during Yjs peer recovery
- `1029` — src/app/app-inline-03.js — never auto-reload during local IndexedDB recovery
- `1030` — src/app/app-inline-03.js — keep upgrades possible only after completed sync recovery
- `1031` — docs/app-inline-03.min.js — never auto-reload during Yjs peer recovery
- `1032` — docs/app-inline-03.min.js — never auto-reload during local IndexedDB recovery
- `1033` — docs/app-inline-03.min.js — keep upgrades possible only after completed sync recovery
- `1284` — official app keeps bytes and never forwards customer headers or query
- `1285` — official app follows a new stable source automatically without another deploy
- `1286` — landing stays on its existing assets and /app keeps correct relative base
- `1287` — source failures are explicit and cannot silently serve an obsolete local app
- `1288` — source proof identifies the same promoted commit
- `1289` — friendly123.com/app/sw.js retires the old worker and never reloads a ?stay=1 tab
- `1290` — official /app and /app/ redirect directly via 307, without any origin fetch
- `1291` — new /app?entry=1 bypasses an old cached permanent /app → /app/ mapping
- `1292` — invalid double-slash HTML paths are not externally redirected
- `1293` — a deep HTML entry preserves its relative view, never arbitrary query data or license
- `1294` — JS, SW, version and immutable release proof are still served from the one stable branch
- `1295` — clients who already own a new-origin notebook retain a non-destructive escape
- `1296` — HEAD is not a login redirect, POST is never redirected, landing is untouched
- `1298` — a join invitation survives the redirect; anything else in the query is dropped
- `1309` — P0 hotfix required check invokes exact selector and executes ALL selected test files
- `248` — test/p0-coldjoin-workflow-secrets.test.cjs
- `266` — test/p0-hotfix-gate-contract.test.cjs
- `1407` — RED: missing GitHub workflow pull_requests metadata must NOT make a real exact-merge green look unverified
- `1408` — fail closed on unmerged, wrong-base, wrong-head or wrong merge SHA associations
- `1409` — fail closed on missing or failing exact gate even if merged PR association is valid
- `1410` — fail closed on permissions error in PR association API
- `1454` — real strict path measures queue, serialization, IDB and total outcome without touching CAS
- `281` — test/p0-mixed-shell-v636.test.cjs
- `1560` — S1 API.opsDoc: IndexedDB hydration never becomes a new durable relay op
- `1604` — P0 JFC: strict CAS stays fenced; verified local A/B recovery is the only IDB-failure fallback
- `325` — test/p0-v603-update-consent-click.test.cjs
- `1661` — joined team login cannot overwrite original device owner PIN
- `1663` — unrecovered team metadata shows pending without classifying the PIN as wrong
- `1871` — a new version shows no strip, never reloads, and tells the waiting service worker to take over
- `2296` — estatico: workers.dev queda limitado a licencias y senalizacion, nunca negocio central
- `2298` — estatico: toda llamada fetch/cliente a hosts externos esta clasificada
- `2332` — public proof records exact artifact bytes and recovery retains the already published canary
- `2449` — Sonar cannot replay an earlier PUSH against a newer master commit
- `2457` — E4: Yjs authoritative owner name converges on equal revision despite local future clock
- `2599` — estable y canario conviven: el canario mas nuevo NO borra la cache de los clientes
- `499` — test/sw-dos-canales.test.js
- `2782` — failed business rename keeps the old identity and informs the owner
- `528` — test/v579-venta-pn-ack.test.js
- `2870` — v765: todo shell con el adaptador Firebase ya lee el marco 7 (commit 962ebb3a, shell v639)
- `2883` — P0 \#607: background A/B quota still reports quota with a strict IDB CAS present
- `2985` — the Lord stable-entry guard no longer redirects, while historical routes remain noindex

## Next engineering steps (Superpowers RED→GREEN / Ponytail full)
1. For each failure considered material, inspect test and actual runtime paths, original committed environment, and whether it expects missing historic fixtures or obsolete deployment files. Label `real regression`, `harness mismatch`, `historical integration`, or `unknown`; do not guess.
2. Prioritize actual stock/financial/network data-loss failures over static source-text assertions. Keep unmodified original assertion as external validation when feasible.
3. Use one branch from current workshop main for one root cause, checkpoint the hypothesis before edit, real-browser RED and GREEN, integrated 585-target, SHA256 manifest when runtime assets change, then workshop-only merge. Do not touch production.
4. Physical iPhone Safari/PWA↔PC two cycles A→B→A and remote exact-once ACK remain outstanding even after CI success.
