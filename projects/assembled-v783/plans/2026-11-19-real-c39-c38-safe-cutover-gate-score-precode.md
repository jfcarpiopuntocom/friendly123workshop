# C39 PRECODE (conditional) — credit limited C38 local single-writer activation interlock, fixed 100
19 Nov 2026 Ecuador. This is a future score AUDIT, never permission to deploy or to replace the app.

## Baseline
Master product friendly-123 `ec60623396d1f0bf3ef0267f828484cf17029ef2`, source-assessed C36 merge `3e367eadd6b87a8143471041875decc523af3e76`; engineering port **85.5/100.0**, quality **76.2/100.0**, commercial GO **0/6**, physical 0/5. All scores originate in `docs/engineering/` with an immutable 100.0-weight rubric.

C38 [PR #833](https://github.com/jfcarpiopuntocom/friendly-123/pull/833) is QA-gated in real `docs/sync-yjs.js`, RED then GREEN source tests for: old WS active rejects C21a writer; outstanding legacy old ops queue rejects; missing/unreadable OCSync refuses; reactivation during/after activation revokes; role-photo-only / employee cannot unexpectedly arm; missing C21a `activate20` fails closed. C33 Workerd simulated OFF old relay and C31 VM updated. v816 SHA/CI must prove; no real customer turned on.

## Conditional score if (and ONLY if) C38 is MERGED and full CI GREEN
- Split existing `operational-switch` 1.5 unearned into new `local-legacy-relay-quiescence-gate-c38` 0.5 DONE, source `docs/sync-yjs.js` pinned to **actual C38 merge SHA**, and remaining `operational-switch` 1.0 UNDONE. Global 100 unchanged. PORT **86.0/100.0** (vs 85.5). This is only one local gate, NOT a certified global single-writer, full remote cutover, or an actual customer-traffic share.
- Adjust architecture-quality `sync` 15.4→15.6 (+0.2) ONLY after source-level actual C38 green and existing C31+C33 regressions; total quality **76.4/100.0** (vs76.2). All other dimensions and physical 0 untouched.
- GO remains **0/6** (PC Opera→Safari iPhone A→B→A twice, live history, money, photos, access not verified). Pending 14.0 points.

## TDD and release procedure
1. Workshop C39 PRECODE before any score files; Notion exclusive reservation exactly `docs/engineering/architecture-2-port-score.json`, `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs` once C38 merged. No runtime and no manifest edits.
2. Test-first RED `85.5 !==86.0` on product master.
3. Implement 0.5 split within existing group, historical source SHA preserved in score history; script checks actual C38 cutover source guard OFF + pending false + old relay absent fail + C21a failback + team OFF guard, tests C38 and real C31/C33, v816 sealed manifest SHA; **assessedProductSha must be actual C38 merge** for both JSONs, evidence links immutable.
4. CI GREEN, verify every job for final HEAD and PR merge under expected head SHA; re-fetch actual master JSON, Notion write final; release reservation. No Cloudflare/R2 use or cost.
5. Next migration root should be a tested **single local receipt → authoritative DO business receipt** contract using existing C15/C16/C21b, with failback not duplicate stock or cash. Current C38 gate is precondition only; do not count full `production-business-dispatch`.
