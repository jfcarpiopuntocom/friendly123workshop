# friendly-123 · APP REAL Gate D4 SQL/Yjs union MERGED · 19 November 2026

## Final verified state
- Real product: **[jfcarpiopuntocom/friendly-123 PR #784](https://github.com/jfcarpiopuntocom/friendly-123/pull/784)**, MERGED; independently read `master@ed983045c7ac834c0fdb63f371f4c3b4f07226e7` after merge, candidate exact `cef4bd98bcd8e9b73d03f8314c5fe4222fa07cef`, parent base `ec8359432ffd2ffeb6a9974cd1721ecb02a7ca40`.
- **16/16** GitHub PR check-runs on candidate exact SHA successful, no failures; Miniflare/Workerd and bundled neutral Worker pass. `friendly123workshop` records the plan/report but is not the port target. Sync3 untouched. OpenCode/Hermes is read-only auditor, Sol6 owner of implementation.
- Exact-head [GREEN Workerd runner #44474285447](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44474285447): **18/18** native SQLite, independent SHA-256 Node/WebCrypto oracles and SQL rollback; **31/31** real Worker/Tienda/pagination/privacy and cold-reopen regressions; 0 skip/fail/cancel.
- Initial [RED occupied shop #44471320121](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44471320121): 2/7 green, `nonempty legacy or journal storage refuses frozen import`. Further [RED Hermes #44472889942](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44472889942): 10/13 green, caught redundant empty journal, absent exact union SHA, modified local sale under same opId. All addressed in final GREEN.
- [Ponytail PRECODE written before source edits](../plans/2026-11-19-real-gated4-merge-nonempty-precode.md), [Hermes independent observations](https://app.notion.com/p/41d1642b67f3817abe2fc6920c50dc36).

## What was grafted into product
- `cloudflare-yparty-worker/src/merge-frozen-into-existing.mjs`: guard certified source and 0 pending Yjs parent/delete; refuse `-cat` private root or mixed `-ops`; read local YParty snapshot + live journal inside exact `transactionSync` read barrier. Compare each overlapping business opId by canonical value; reject same-key divergent money regardless of Yjs writer clientID.
- Calculate `Y.diffUpdate(frozen,localVector)`; append **one** journal frame or 512KiB blocks (no snapshot overwrite), not when delta is exactly two-byte empty update. In the **same atomic SQL transaction** write separate `f123_frozen_unions` certificate (frozen HEAD/SHA/vector, exact `union_sha256`, SHA of canonical original events, counts) and immutable per-opId baseline of **both local and frozen facts**. Does not create false `f123_frozen_imports` (used only for empty-store initial import).
- `cloudflare-yparty-worker/src/open-existing-store.mjs` redirects occupied stores to new union, retains original empty import and failback. `src/index.js` real `Tienda.onStart` recognizes union certificate before `super.onStart`, verifies local SQL on cold reopen, avoids needless Firebase source fetch.
- `durable-full-yjs-export.mjs` exports exact existing snapshot/barrier decoder for reuse. New `sha256-sync.mjs` implements bounded incremental FIPS SHA256 using a 64-byte buffer, because neutral Worker test bundlers cannot resolve Node built-in `node:crypto`. Verified against separate native Node and WebCrypto on 55,56,64,120,1MiB and UTF-8 blocks. No third-party dependency/credential.
- New QA `p0-gated4-merge-nonempty-sql.test.mjs`, `p0-sha256-sync-transaction.test.mjs`, `p0-gated4-real-onstart-workerd.test.mjs`, fixture and dedicated GitHub workflow.

## Critical cases proven in real SQLite/Workerd
- 10 local + 100 certified frozen operations → exactly 110, correct sum, no dropped/duplicated facts.
- Identical same-opId across sources → 109 unique facts, divergent amount → total refusal, original SQL unchanged.
- SQL injected failure → rollback no union certificate/no partial journal; OFF flag → local 10 only; initial store import branch unchanged.
- Retry same HEAD doesn't append; cold reopen without source verifies 110 and still no duplicate; new post-cut sale increases to 111 and remains accepted.
- Forged union hash, changed frozen sale, **changed local sale** with equal total count → no successful reopen.
- Empty two-byte Yjs diff → certificate only, no pointless journal; >512KiB delta → chunked journal and cold readback; snapshot compaction → same union SHA and durable cert.
- Already certified rival frozen HEAD is denied without journal write; Yjs pending ancestors denied, source pages 401/403/429, root SHA, cut index, public catalog guards regressions green.

## Hard boundaries
- These tests are **synthetic**; no real customer, no live Firebase cutover, no Cloudflare script deploy or flags changed.
- Cloudflare account confirmed after merge: six QA switches still `"0"`; `WS_AUTHORITY` points to `friendly123-licencias`; **no `WS_FROZEN_HISTORY_SOURCE` binding**, so no live frozen source.
- D4 only merges immutable `-ops` Yjs facts. It **does not** execute the typed business SQL effects of new facts or itself certify existing shop cash/inventory. A complete business cutover needs commercial reconciliation/digest and independent issuer/service.
- **Remaining root blockers:** R2/Firebase exact-byte frozen source anchored to immutable HEAD, 19 missing Yjs parents and 9 transient HTTP 401 from previous pilot, safe `-cat` projection while preserving privacy, SQL staging with verified bounded 48MiB finalizer, QA issuer `/ws/ticket`, physical Opera PC ↔ Safari iPhone A→B→A×2 with actual sale/stock/money/photo/PIN.
- Frozen rubric until real criteria: architecture 67/100, operational PORT 61/100, 0/6 commercial GO. Integration is material source progress, not proof of a real shop cutover.

## Rollback
- GitHub revert merge `ed983045c7ac834c0fdb63f371f4c3b4f07226e7` if regression on code; QA flags OFF. For a future activated shop, do not delete SQL/cert: use verified PITR/failback under same license and source anchored to original HEAD.
