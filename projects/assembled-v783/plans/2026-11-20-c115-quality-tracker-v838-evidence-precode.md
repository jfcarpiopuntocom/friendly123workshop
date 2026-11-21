# C115 PRECODE: source-audited quality 81.4 → 81.7, frozen rubric

Scope: same friendly-123 application, port 1.0→2.0 100.0/100 implementation remains unchanged. Engineering quality original 100 point fixed weights, independent GO0/6 and physical0/5.

Reserve owned files only:
- docs/engineering/architecture-2-quality-score.json
- docs/engineering/architecture-2-port-score.md
- scripts/architecture-2-port-score.cjs
- test/p0-architecture-2-port-score.test.cjs
Notion C115 reservation https://app.notion.com/p/41f1642b67f38180a003dd77e62a56ca

Evidence nonoverlapping:
1. PR #927 merged a9b299ed5efdc09e0703331db16e0d2b6f4fd936, source docs/estado-idb.js, real source-executed QA test/p0-v834-idb-connection-lost-reopen.test.cjs, RED two UnknownError paths, GREEN two, 27/27 CI, public v0.8.36. +0.1 quality DURABILITY only: bounded reconnect and strict CAS transaction on Safari. No device GO credit.
2. PR #930 merged 6d5e40805eff7924c9b6005ac908870bac8dbb7d, source docs/mock-backend.js product create, test/p0-c112-product-create-durable-ack.test.cjs, 3 tests strict ACK false -> 503 rollback; in-flight save never emits; true durable ACK one catalog movement, fallback A/B. P0 and release gates SUCCESS; public v0.8.37. +0.1 DURABILITY engineering quality only, not real customer data.
3. PR #931 merged b5ce01a7f46e801001cc052c2797aa2150bb3cba, sources docs/mock-backend.js and src/app/app-inline-01.js + minified docs, test/p0-browser-stock-adjustment-opid.test.cjs. Real RED 35/38 (3 exact failures duplicate HTTP retry, amount collision, missing stable UI opId), GREEN focal 38/38, P0 172/172, release-control success. +0.1 BUSINESS engineering quality for exactly-once adjustment by signed opId, independent of #925 same-tab CAS rebase. Credit ONLY after production public v0.8.38 verified.

Planned C115 quality = 81.7/100; DURABILITY 18.9→19.1/20, BUSINESS 19.2→19.3/20. All other dimension scores and original weights unchanged. PORT 100.0; commercial GO 0/6; physical 0/5. Persist C110 unchanged in auditTrail, C109 and C106 untouched, retain original 80.4 comparison. Keep assessedProductSha frozen implementation source; lastAuditedProductSha points to last source proof b5ce01...

Test-first: change source assertions to new score and three independently evidenced components without rewriting C106/C109/C110 proof checks. Add explicit test for C115 evidence and negative misuse. Run node scripts/architecture-2-port-score.cjs, node --test test/p0-architecture-2-port-score.test.cjs, CI P0 and release. Documentation-only no release identity bump if docs metadata changed; keep public app unchanged. Do not merge until all gates green and source v838 live.