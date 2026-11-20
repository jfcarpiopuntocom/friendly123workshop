# C47 · fixed-100 photo and cross-device QA scoring, PRECODE / Ponytail

Product source of truth: `jfcarpiopuntocom/friendly-123` master commit `f05cd2fa0a104439845bad96f9e341267c82e33c` (PR #844 merged), code runtime remains v0.8.19 (C46 test-only).
Workshop serves ONLY as plan and QA evidence, not a separate ported app. Sync3 retained. No real customer/R2/Cloudflare data modifications.

## Already verified
- PR #844 final head `a475298171c958ed2e6161df7d9897a8ffd8fe4e`: 11/11 full GitHub workflows green (Workerd C46 [run 44660882184](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44660882184) 1/1 TAP PASS).
- Real existing app source from `docs/idb-fotos.js`, `docs/sync-yjs.js`, `docs/application/recover-shelf-photo.js` and `docs/core/shelf-photo-policy.js` executed as actual snippets/bundles against Miniflare Workerd SQLite -fotos and -ops Durable Objects; no legacy Yjs binary shadow. Cold Team IDB retrieves Owner photo bytes by SHA.
- Original C46 test was A1-B1-A2 once; revised to A1-B1-A2-B2-A3, TWO complete simulated Workerd handoff cycles, five unique opIds, same store: stock 5→0, cash 500→8000 cents, 5 effects, 5 receipts; repeated old opIds no sixth effect. All synthetic devices; not native real Safari/iPhone or real business history.
- Cloudflare Workers Build of master merge f05cd2fa... SUCCESS (read-only authenticated Build API).
- Existing fixed 100.0 rubric post-C45: implementation 87.5/100, quality 77.0/100, GO0/6, physical0/5; photo-sha group weight9 with browser-photo-cutover2.0 still FALSE, and offline-failback verified-cross-device-downpath1.5 FALSE.

## Fixed 100.0 scoring decision to prove with RED → GREEN
1. Split already pending photo-sha browser-photo-cutover2.0 into **0.5 QA-only certified browser-to-DO photo bridge** DONE, **1.5 real active UI+CAS+physical device cutover** FALSE. Implementation 87.5→88.0, missing12.5→12.0. The 0.5 is for previously merged source now verified end-to-end by the C46 new test; not for tests by themselves, not for commercial mode, and not from the offline-failback physical1.5.
2. Quality: photo dimension 7.3→7.5 (+0.2) due exact cold Team SHA recovery, sync 15.6→15.7 (+0.1) due two full sequential Workerd handoffs with no duplicate effects, total77.0→77.3. Keep physical0, GO0/6, no claim about production reliability SLA. All budgets unchanged.
3. Both scorecards `assessedProductSha` pinned to actual C46 **merged** source `f05cd2fa0a104439845bad96f9e341267c82e33c`; all DONE evidence paths repin to that SHA, not PR-head. 
4. Minimal product files: score JSON x2, `scripts/architecture-2-port-score.cjs` invariant guard against ghost claims, `test/p0-architecture-2-port-score.test.cjs` RED first, and score MD update. No feature runtime or shell modifications, zero new dependencies.

## Test gate
- First commit RED test only, require expected old 87.5/77.0 to fail against new 88.0/77.3 invariant.
- Then apply bounded score updates, source/manifest hash checks, verify C46 Workerd QA literal two full cycles, five receipts and sha, confirm no active QA release flags, keep physical zero.
- `node --test test/p0-architecture-2-port-score.test.cjs`, `node scripts/architecture-2-port-score.cjs`, `bash check-sw.sh` / full GH Actions, Cloudflare build on actual SHA. Merge only when required checks green. On fail leave branch and scores unchanged; do not force numbers.
