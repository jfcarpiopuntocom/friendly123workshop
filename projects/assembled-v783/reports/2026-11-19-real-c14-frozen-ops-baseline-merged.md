# C14 · imported -ops historical opId/payload baseline · MERGED · 2026-11-19

## Product verified
**App real** [friendly-123 PR #794](https://github.com/jfcarpiopuntocom/friendly-123/pull/794) MERGED on `master@673edca3d9d18ebed4af24f3b9c21fdec9185e17`, exact candidate `b77c0d8a4868f84edc0fa419c983a7eb8e6a5445`. It is NOT code living only in friendly123workshop. Sync3, customer browser UI, release shell, and Cloudflare flags unchanged. [PRECODE plan](../plans/2026-11-19-real-c14-imported-ops-baseline-precode.md); [Buzón coordination and reservations](https://app.notion.com/p/41d1642b67f38120a972da10c46f58a3).

## Confirmed root cause / contract
Before C14, after import into previously EMPTY `-ops` Durable Object, `open-existing-store.mjs` verified `eventCount >= frozen eventCount`. A historical sale could be rewritten (same opId/different cents) or replaced (different opId/same count) and still report successful cold reopening. Occupied-room union D4 already checked exact opIds; C14 closes the missing analogous invariant for empty-store import. No raw private `products` in `-ops`.

## Implementation (real app files)
- `cloudflare-yparty-worker/src/frozen-ops-baseline.mjs` (NEW): bounded deterministic canonical payload per original opId; SHA-256 digest and immutable baseline SQL rows. Explicitly only original frozen events are checked on future reopen: **new post-cut events are not counted against old 25k historical budget**.
- `src/certified-frozen-import.mjs`: attach baseline to SHA-certified proof in WeakMap, install baseline rows and digest **in same synchronous SQLite transaction** as original Yjs snapshot + `f123_frozen_imports` certificate. Duplicate import checks original baseline and does not rewrite.
- `src/open-existing-store.mjs`: before advertising `opened:true,already:true` for `-ops`, verify each historical opId and exact canonical payload exists in SQL-replayed current document. Missing/corrupted tables, changed amount, or replaced opId cause fail-closed. Do not destroy journal or customer facts. `-cat` is unchanged.
- `qa/fixtures/c14-imported-ops-baseline-worker.mjs` and `qa/p0-c14-ops-baseline-reopen-workerd.test.mjs`: real Tienda inherited, QA-only synthetic tamper through SQL journal and cold Workerd restart with frozen source offline.
- Updated two **old synthetic fixtures only** to align with stricter, existing privacy model: `qa/p0-gate-d-open-existing-workerd.test.mjs` now uses an independent `-ops` Y.Doc instead of reusing mixed products+sales; `qa/p0-gated7-frozen-r2-packager.test.mjs` recognizes a sanitized privacy error while proving synthetic PIN does not leak. No privacy check weakened.

## RED → GREEN
- [Initial RED #44575625770](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44575625770): 1/6; missing durable baseline + false-success after same-count tamper confirmed. Historic fixture needed updating.
- [C14 initial Workerd GREEN #44576285561](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44576285561): 6/6.
- [C14 7/7 exact opId substitution #44577080066](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44577080066): 7/7; checks include new after-cut op, tamper amount, same-count swap, baseline deletion, digest tamper, flag OFF, successful first import.
- [Final C14 Workerd](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44578186071) GREEN.
- [Final integrated PORT + real Worker #44578186561](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44578186561): **229/229 tests PASS, 0 FAIL/skip**, app sibling job PASS; 18/18 CI checks SUCCESS on final head SHA. Gate D4 and real Gate D Workerd workflows GREEN.
- [Final master after merge](https://github.com/jfcarpiopuntocom/friendly-123/commit/673edca3d9d18ebed4af24f3b9c21fdec9185e17) verified.

## Important non-claims and compatibility
- No certified actual customer Firebase HEAD or configured R2/source binding in Cloudflare QA. Tests use synthetic histories in real Miniflare/Workerd only.
- Previously imported `-ops` certificates **without** C14 immutable baseline now fail closed. Never forge the baseline from mutable current SQL. A future controlled migration for pre-C14 QA shops needs independent frozen source and actual original SHA; QA flags remain OFF.
- No business commit, physical cross-device convergence or commercial GO shown. Port engineering score from C13 stays **81.5/100**, quality **72.7/100**, GO **0/6**. C14 hardens correctness of an already-counted capability; do not arbitrarily add points for one bug test.
- C13 [PR #793](https://github.com/jfcarpiopuntocom/friendly-123/pull/793) by Antigravity merged immediately before C14; no file collisions. C15 [PR #795](https://github.com/jfcarpiopuntocom/friendly-123/pull/795) transferred to Sol6 for contract audit before merge; current client code risks double charge if 202, timeout or HTTP 200 invalid receipt is treated as permission to run same sale on legacy without shared opId dedup. [Buzón C15 audit](https://app.notion.com/p/41d1642b67f381059a94ff0532349940).
