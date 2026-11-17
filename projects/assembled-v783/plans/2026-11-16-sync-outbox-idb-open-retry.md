# P0 encrypted legacy outbox: retry IndexedDB opening after temporary error/blocked/throw · 16 Nov Ecuador

Repo `jfcarpiopuntocom/friendly123workshop`, isolated branch `fix/20261116-sync-outbox-idb-reopen-after-failure`, exact main base `59884047b533349aafeb0279b87cd850cbecc133`, source `projects/assembled-v783/app/docs/sync-outbox.js` blob `47ec942e0e248329db6c53842420a179d514a586` (after PR #69 durable abort fallback). **Plan fully committed before editing tests, so 5h cut cannot lose the work.**

## Verified source causality, yet to prove RED
Current `abrirDB()`:
```js
if (dbPromise) return dbPromise;
dbPromise = new Promise(function(resolve,reject){
  var req=indexedDB.open("f123_outbox",1);
  // req.onerror=... reject(error), req.onblocked=... reject(error)
});
return dbPromise;
```
A first error/blocked/synchronous open exception produces a **rejected memoized dbPromise**, reused by all future saves and reads. This means a transient Safari IndexedDB opening problem permanently forces the legacy localStorage fallback in this tab, even after IndexedDB recovers. When small localStorage subsequently fills, later encrypted ops cannot persist while a working IDB may be available. This is a code-level hypothesis; do not claim it explains any client's specific real-device incident until native reproduced and physical evidence.

## TDD sequence, no guesswork
1. Add `app/test/p0-sync-outbox-reopen-recovery.test.cjs`, executing the actual unchanged `docs/sync-outbox.js` in Node vm with tiny synthetic IDB/localStorage. For each transient first failure (request `onerror`, `onblocked`, `indexedDB.open` synchronous throw), first encrypted write uses the existing localStorage fallback and returns true. Then open becomes available but legacy LS rejects quota: second encrypted write **must retry** `indexedDB.open`, return true after completed transaction, store exact current encrypted blob in IDB and clear legacy LS only when disk committed. Also verify `OCOutbox.leer()` returns the recovered encrypted blob. No real PIN, license, business payload, network or filesystem outside test.
2. Add lean Node22 no-prod GitHub Actions `.github/workflows/v783-sync-outbox-open-retry.yml` to execute every original new test, preserve SHA/TAP and actual nonzero exit. Open DRAFT PR and require **RED on original source** (first write success fallback, second write fails due cached rejection), with no setup/syntax failure.
3. **Only after true RED** apply the smallest shared-opening fix in actual `docs/sync-outbox.js`: after `dbPromise = new Promise(...);` attach a catch that clears `dbPromise` and rethrows, so next call can actually retry. E.g. `dbPromise = dbPromise.catch(function (e) { dbPromise = null; throw e; });`. This handles request.onerror, onblocked, and synchronous exceptions; leaves DB name/version/store, encryption and existing localStorage fallback unchanged. No new timers, queues, service workers or dependencies.
4. Run focal GREEN and adjacent legacy abort full suite [#69](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/69), assembled browser/authority integration 585 test gate, and review diff. If any test fails, preserve RED and diagnose, do not waive. Revalidate current main and other agents' PRs before fusion, squash merge only if all required gates GREEN.
5. Record exact RED/GREEN URL, SHAs, differential changes, unresolved gates in plan, `STATUS.md` and [Notion living handoff](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902), maintaining rest of history. Commit/push plans before edits, never lose notes across 5h.
6. **No production deployment**: `jfcarpiopuntocom/friendly-123` and customers untouched; GitHub Pages workshop excludes `projects/`. The fix concerns recovery of legacy encrypted outbox, not remote application-level ACK and not P2 server authority. MDD JFC local-first/PIN + causal stock/forensics remains binding. Physical PC Opera/iPhone Safari/PWA A→B→A×2, real PIN/roles, photos/money, remote `business-committed` readback and 33 historical full failures remain NO-GO.

## Concurrent activity
[#68](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/68) merged synthetic native Chromium/WebKit 2-cycle test on preceding main; [#69](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/69) merged `onabort` fallthrough as `59884047b533349aafeb0279b87cd850cbecc133`. No overlap with other open PR paths confirmed at planning time. No Workbox/PWA/SW modification. Ponytail minimal proven reuse over new implementation; Superpowers test RED→minimum→GREEN.

## Exact RED confirmed before source change — 2026-11-17 UTC

[CI 43999198876](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43999198876), job `133758733174`, original unmodified source `docs/sync-outbox.js`, head `f83eb2c5a299d368c37fc548bc8eb692833ac7d5`: **6 tests, 3 PASS / 3 FAIL, 0 SKIP**. All **previous PR #69 abort+success tests PASS**, proving adjacent behavior preserved. Three new tests RED independently on `indexedDB.open` first `onerror`, `onblocked`, and synchronous exception: first ciphertext correctly persisted in localStorage, second call when IDB recovered but LS quota blocked returned `false !== true` at exact assertion `recovered IDB must be retried even when the legacy fallback is full`. Source root cause is the rejected cached `dbPromise`, not failed setup or mock. Preserve this RED as distinct evidence, no claims about physical client recovery.

**Minimal remedy ruling:** keep DB transaction/schema/recovery fallback unchanged, add one line after the existing `new Promise` closure and before `return dbPromise`:
```js
dbPromise = dbPromise.catch(function (e) { dbPromise = null; throw e; });
```
The error still propagates to existing `guardar`/`leer` try/catch and localStorage fallback, but the next operation can reopen IDB. Do NOT return success before transaction commit or reset state on success. Require fresh full 6/6 + integrated browser QA.
