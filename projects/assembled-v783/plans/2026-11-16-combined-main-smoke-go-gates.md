# v783 combined-main integration and release gate — checkpoint 2026-11-16
Base and target: friendly123workshop main 5cbd966d27e55de4559883a20e40163d96418a3b
Branch: qa/20261116-combined-main-go-gates
Purpose: prove two independently landed changes TOGETHER at exact new main SHA. This is NOT a production release.

## Landed evidence
- PR #43 merged as c0d3ad08081cdf3bdf42f24b727fbd04f90ab023. Real dual-store quota test was RED Chromium/WebKit HTTP200 vs507, then GREEN 2/2 with strict commit, conditional rollback, no pre-commit catalog broadcast. Category batch+adjacent tests and SHA256 app manifest green, rack quota/CAS 4/4. Exact last head ef489837 integrated 585/585 PASS (run 43962926512) with no skips, plus credit and money.
- PR #44 merged as 5cbd966d27e55de4559883a20e40163d96418a3b. Earlier Workerd test had 1 in-flight pre-revocation awareness frame granted seq379 vs revocation seq380. One existing durable protocol barrier added to test fixture before strict zero-frame gate, without changing runtime auth. Workerd paired authorization suite 27/27 ×3 =81/81 green (run 43963514639), zero skips.
- PR #41 open rack PUT touches the same huge mock-backend.js. Explicit warning posted to preserve #39+43 and recompute manifest on its rebase. Do NOT integrate #41 into this immutable combined SHA during audit.
- Previous historical suite on post39/diagnostic branch: run 43960371230 **3218 tests /3157 PASS /57 FAIL /3 SKIP /1 CANCELLED**. Several legacy tool/deployment tests are known red; separate product regressions from historical fixture/deployment failures. It is NOT production GO.

## Mandatory verification order
1. New PR on THIS base triggers the existing integrated browser+authority QA using unchanged app/relay code from combined main. Read full log, actual test counts, failures, skipped, exact checkout SHA. 585-target is expected, not presumed.
2. Run full `npm test` over combined main, Chromium+WebKit, guard production HTTP/WS, pin SHA, archive complete logs and exit status. Compare failure names against prior 43960371230. Never silence or downgrade failures.
3. Native category regression + adjacent categories and rack POST/PUT tests; verify release manifest real SHA256; credit/money/photo/sales/proof via integrated tests. Do not need another vendor or transport.
4. Even all green CI does NOT establish physical Safari/PWA↔PC, two A→B→A cycles, same license/PIN identity, role continuity, photos, offline ACK, remote exact-once, or old-room rescue. These are release gates requiring physical verification and client-free synthetic business.
5. No production, user data, real PIN, Cloudflare deployment, or service scope changes. Declare workshop QA status separately from customer release GO. If a new red, record path, exact line and real root cause in GitHub/Notion before patching.

## Next engineer after interruption
Open PR #45 and GitHub Actions logs for this branch, then compare to exact prior run IDs above. Keep all notes in workshop plans/ and Notion living log. Coordinate with PR #41 before any file edits to mock-backend.js. No staged/untracked local state is trusted; GitHub is the canonical checkpoint.

## Full historical suite fixture root cause observed (additional prep)
The prior full run 43960371230 failed four mixed-version PN/stock tests in `test/incident-v608-publication-after-recovery.test.cjs` **before entering product assertions** with `v607 historical sync script must be fetched at exact pinned SHA`. Their `peer({legacy})` helper explicitly requires `F123_V607_SYNC_FILE` and `F123_V606_SYNC_FILE`. The copied standalone workshop full workflow omitted these fixture env vars. Original first-party historical workflow `friendly-123` commit `eb3d983546ed2d7c41258b344292710bf681404e` names exact immutable historical commits: v607 `82952a84958641010c48bfbee6aab80007ba12e9` and v606 `7e51ed51560d6138866dae98e4a01ff1772db51c` and fetches only their `docs/sync-yjs.js`. Repair **QA workflow only** with two read-only GitHub fetches of those pinned commit trees into /tmp, assert both exist, set two envs on npm test. Do not change runtime or four assertions, do not fetch customer data, and preserve full suite failure log. Compare the resulting four test outcomes to old missing-fixture errors; do not equate them with application regressions.
