# C36 checkpoint: stable opId sale→local ACK→joined/roomless→C31; candidate v815 (19-nov-2026)
Real product: `jfcarpiopuntocom/friendly-123`, master starting `d1878b13e14a83bc7cb1026cb0dede16abed7d18`. Sync3 retained as 2.0; workshop ONLY persistence of plans and QA evidence.

## Root cause and proof
- `docs/mock-backend.js` real sale API accepts durable request `body.opId` (same across retries), saves `ventas[].opId`, dedups retry (unchanged sale/stock/money/movement), then emits `_opVenta` AFTER strict local commit.
- C34 `_opVenta` included correct cash `cantidad`/`amountCents` but not the actual sale ID. `docs/sync-realtime.js` created new `uuidCorto()` as transport ID in both legacy-room queue/Yjs bridge and roomless Yjs journal. C31 SQL would see a different event identity from business receipt.
- [C36 RED Actions 44634045970](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44634045970): actual backend scenario failed `expected sale-c36-retry-0001, actual undefined` and cash legacylike `sale:c36_legacy_0001` incorrectly carried typed money.

## Fix
- [PRECODE](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-real-c36-sale-opid-end-to-end-precode.md) FIRST commit `f973a8c999924b310feac1830fe5ca986fdec9db`.
- [PR #831](https://github.com/jfcarpiopuntocom/friendly-123/pull/831) branch `port2/20261119-c36-real-sale-opid-once`, HEAD `079542f810e4ce74204aa3173eae4a15085b4f87` (as of checkpoint). Actual C34 cash-eligible guard now requires `/^[A-Za-z0-9_-]{8,96}$/` and assigns `_opVenta.opId=opIdVenta` only if exact business contract fits; old colon IDs, noncash and insufficient stock do NOT receive C15 typed envelope.
- `OCSyncEmit` reuses `payload.opId` only for `tipo==='venta'` + valid amount/qty/ID, in both durable legacy-room + roomless paths. Other operations remain generated UUID, no modifications to `docs/sync-yjs.js`, storage backend, Worker, Yjs bundle or UI.
- New exact-source `test/p0-c36-real-sale-opid-e2e.test.cjs` uses ACTUAL browser backend (one posted sale + duplicate retry, same original opId), source-extracted emitter in both topologies, source-extracted C31 typed mapper, checks queue/journal before publication, same opId in SQL command, and rejects unsafe IDs/noncash. Updated existing C34 suite to assert opId original as part of cash amount and reject colon IDs.
- [C36 GREEN on pre-final-sha Actions 44634454153](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44634454153): 3/3 new tests + 11/11 old contracts, tracking remains `85.0/100.0` and `76.0/100.0`. Final HEAD [C36 Actions 44634921664](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44634921664) dedicated job SUCCESS, including committed-manifest byte equality gate.

## Official shell
- v0.8.15; `f123-shell-v815`; `golden351`. Official `node scripts/gen-manifest.js` on CI said 130 tracked shell assets. Committed sha256: `./mock-backend.js` = `d44f201a67f99031b7a762a3c6cf8fbc1058ba2a12121d589da89b0437fe7528`; `./sync-realtime.js` = `3b49321b9fb59ff1a795b5d7090013efe919def09d7b72e3b9fddc5530613ffe`; `./dashboard.html` = `a5b073caae077fa706f757102e4069ec588dcfc57883c4ca64f736b7fb9fa22d`.
- Dedicated gate re-generates manifest and requires `git diff --exit-code -- docs/version-manifest.json docs/sw.js`, not just transient green.
- No Cloudflare/R2 writes, no customer traffic change: C31 cutover QA OFF, GO 0/6.

## Last remaining actions
1. Poll final HEAD `079542f810e4ce74204aa3173eae4a15085b4f87` global CI (41 workflows; pending at checkpoint). If all SUCCESS, mark PR ready and merge with expected head; else diagnose actual failures before merging.
2. After confirmed product merge, C37 PRECODE https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-real-c37-c36-score-audit-precode.md commit `a53b5eb30a5f383b3c25624ca31c47ffb5ac6ac2`. Audit fixed budget: split pending `production-business-dispatch` 2.5 -> `stable-real-sale-opid-c36` 0.5 DONE + remaining 2.0 undone; PORT 85.5, quality 76.2 only if independently verified, GO 0/6. Create reserve only for four score files, RED→GREEN, CI, merge.
3. Update live Notion https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902 and release C36 reservation https://app.notion.com/p/41d1642b67f38101a125e9e397d2a903; update workshop report final.
