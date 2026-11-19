# 2026-11-19 · C15 typed operations client · anti-double-sale fix · MERGED

## Verified product and coordination
- **Real product** [PR #795](https://github.com/jfcarpiopuntocom/friendly-123/pull/795) MERGED into `jfcarpiopuntocom/friendly-123/master@aee58585d8f98a3ff1b45f576613fd4a0c5a5c2d`. Exact reviewed HEAD `5853a54d84bef4aaa4f330aa7b9392c68a92e57e`.
- Antigravity prepared C15 and [released it for Sol6 review via Notion](https://app.notion.com/p/41d1642b67f381059a94ff0532349940). Sol6 added adversarial tests, corrected client contract and tests; no overlap with C13 or C14 release files.
- Check-runs on reviewed head: **15/15 completed**, 14 SUCCESS, 1 SKIPPED CodeRabbit, none failed. [C15 GitHub Actions #44580006502](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44580006502): **32/32 client tests**, **8/8 Workerd tests**. Master merge SHA verified.

## P0 design bug found and fixed before merge
Original C15 client used `fallbackLegacy:true` on HTTP **202 stored-for-application**, ambiguous timeout/lost ACK, HTTP 503 and malformed 200, despite the signed command already potentially arriving in the SQL Durable Object. Another execution on legacy (with no shared dedup across ledgers) could double-count a sale/stock deduction. This was not a physically observed duplicate sale: risk was confirmed by the API contract and **five RED adversarial tests**.

The corrected `src/port2-typed-ops-client.mjs`:
- **200 + exact signed business-committed receipt** = committed. Cross-check `opId`, license, kind, deterministic `receiptId`.
- **202 or 200 with stored-for-application receipt** = queued, **NOT committed**, `fallbackLegacy:false`, `reconcileRequired:true`, `retryTarget:'same-do-only'`.
- **Timeout/network exception, HTTP 503/5xx/429, unexpected 200 with malformed receipt** = commit outcome UNKNOWN; retain original `opId`, same-DO reconciliation, never initiate a legacy duplicate.
- **409** = hard quarantine, no replay and no legacy.
- **Issuer/validation denial before sending** = legacy can remain the source of truth, and must not be conflated with ambiguous post-send outcomes.
- Client module is integrated in the real repo and covered by tests; **not yet wired as live business dispatcher**. No company data or cloud operations touched.

## Cost prohibition / R2 actual
JFC has now activated R2 in account `c4d8aa3b3e1db0d80b0beb4abc7c1364`. Sol6 independently confirmed via Cloudflare API read-only: `GET .../r2/buckets` success, **0 buckets**. QA Worker still has **six QA flags OFF**, **no WS_FROZEN_HISTORY_SOURCE**, **no R2 binding**, **no WS_CATALOG_ORIGIN_QA**. NO bucket, object or binding created by Sol6.
**New spending authorized: USD 0.00; absolute condition no cent extra.** Standard R2 has 10 GB-month, 1M A and 10M B free tiers but has no specific automatic hard spend cutoff; therefore real R2 object writes, automated imports, bucket creation and Cloudflare deployments are held until technical controls can guarantee the user’s zero-spend condition. [Notion binding decision](https://app.notion.com/p/41d1642b67f38156a1beeabf03acf607). Cloudflare docs: https://developers.cloudflare.com/r2/pricing/ and https://developers.cloudflare.com/billing/manage/spend-management/.

## Metrics / continuation
As of C13, `docs/engineering/architecture-2-port-score.json` records **81.5/100 engineering ported**, quality **72.7/100**, GO **0/6**. C14 hardens previously credited -ops import, C15 is callable safe code but is NOT live UI dispatch and therefore **does not change the 3.0 unearned business-dispatch milestone or these score numbers**. Continue porting SAME friendly-123 product 1.0→2.0 via mature injertos; Sync3 is part of 2.0. Workshop is audit/lab only.
Next: wire typed ops safely after verified historical source + same-DO durable opId and commercial ACK; certify real HEAD ancestry and configured source under strict 0-USD cost policy, or use local Miniflare only.
