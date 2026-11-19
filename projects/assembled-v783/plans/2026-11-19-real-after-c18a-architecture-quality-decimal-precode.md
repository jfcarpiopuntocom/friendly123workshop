# PRECODE · 2026-11-19 · score decimal evidence update after C16b Safari + C18a photo

## Application / baseline
PRODUCT: `jfcarpiopuntocom/friendly-123`; master `cc9365aad373ded56f6118cdfd1f116e97d13068`. Sync3 belongs to 2.0, workshop ONLY plans/tests. [PR #805](https://github.com/jfcarpiopuntocom/friendly-123/pull/805) merged browser adapter; [PR #808](https://github.com/jfcarpiopuntocom/friendly-123/pull/808) merged Safari IDB, 13/13; [PR #809](https://github.com/jfcarpiopuntocom/friendly-123/pull/809) merged photo SHA, 14/14 checks, 7/7 unit+1/1 Workerd.

## Fixed rubric. No points for new module alone
PORT implementation 81.5/100 remains unchanged because neither typed checkout nor photo UI is commercially cut over. GO separate 0/6.
Architecture quality reviewed as **74.6/100, +0.5** since 74.1 recorded at `e2281fb4`:
- durability 17.0→17.3/20 (+0.3) for C16b Safari IDB.open watchdog, late onsuccess handle close, C15 exact command whitelist, two tabs same opId contradictory payload rejection and corrupted own-namespace fail-closed (verified PR #808 CI).
- photos 7.1→7.3/10 (+0.2) for C18a exact host/pinned scope Team read-only + SHA256 cold Workerd GET after Owner PUT, full body deadline verified P0 RED→GREEN (PR #809 CI).
Other dimensions unchanged. This is **reviewed quality** not uptime, adoption or commercial GO. Do not inflate 1.5/3.0/2.0 unearned port milestones.

## Code changes in real product
New candidate branch based master. Update only `docs/engineering/architecture-2-port-score.json` (assessed SHA + currently credited evidence URLs; no milestone change), `docs/engineering/architecture-2-quality-score.json` (assessment and previous baseline), `docs/engineering/architecture-2-port-score.md` (updated detailed tracking and zero-cost status), `test/p0-architecture-2-port-score.test.cjs` (expected decimal values) with current master SHA. Run existing `node scripts/architecture-2-port-score.cjs` and test via GitHub check; verify 100.0 denominator. Workshop is only PRECODE/report. No UI, Sync3, cloud/R2 writes, customer data or deployment. No commercial GO inferred.
