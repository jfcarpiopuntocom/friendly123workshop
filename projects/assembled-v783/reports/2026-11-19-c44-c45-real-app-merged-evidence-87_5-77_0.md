# C44+C45 CIERRE · misma friendly-123 portada de arquitectura 1.0 a 2.0

Fecha: 2026-11-19 Ecuador / 2026-11-20 UTC. Sync3 retenido. El workshop no es la app; esta nota archiva evidencia de la app REAL.

## C44 producto funcional MERGED
- PR: https://github.com/jfcarpiopuntocom/friendly-123/pull/842
- Master merge SHA: be032b2b27fd52c299d8e1b6942d9b7bb2596934; version 0.8.19, shell f123-shell-v819, golden355.
- Final candidate SHA 00ebbb9b5805009f1534cb3f58d838b52d7fd3ba: 46/46 GitHub workflows SUCCESS; real Workerd Miniflare DO SQLite and Chromium/WebKit payment replay regressions GREEN.
- Cloudflare authenticated build outcome success for exact merge SHA: https://dash.cloudflare.com/c4d8aa3b3e1db0d80b0beb4abc7c1364/workers/services/view/friendly-123/production/builds/0d4d8889-2b95-4d70-8acc-b43852df983a .
- Actual browser source: docs/mock-backend.js (adjustment stockNuevo/opId and first-receipt payment), docs/sync-realtime.js (validated durable original opId for venta, ajuste and abono), docs/sync-yjs.js existing typed dispatch via -ops. Workerd QA: synthetic stock 5→8, receivable 3000→1500 cents, exactly 2 receipts/effects even after payment replay. Zero second economic writer.
- RED discovered in initial C44: all 4 customer payment browser variants Chromium/WebKit × EN/ES detected duplicate inventario_abono after lost HTTP reply and reload although cartera_abono was 1. Final fix emits OCSyncEmit('abono') only inside first-seen movimientoId, without synthetic inventario EventBus fact. Regressions green.

## C45 independent audited score MERGED
- PRECODE saved BEFORE code: https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c45-c44-merged-fixed100-score-precode.md
- PR: https://github.com/jfcarpiopuntocom/friendly-123/pull/843
- Final merged master commit 879954d5d63f54b55c5cd5e328319d4961fe9187, score-only. All 11/11 candidate GitHub workflows SUCCESS. RED proof: https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44659226478 (expected 87.5, actual 87.0); then green score scripts/QA.
- Read-after-merge master JSON verified: migration **87.5/100.0**, fixed 100.0; quality **77.0/100.0**, physical **0/5**, commercial GO **0/6**. No code or live transport action in C45; assessedProductSha is C44 exact merged real app SHA be032b2b27fd52c299d8e1b6942d9b7bb2596934.
- Fixed economics budget 17.0: C44 gets 0.5 already-earned for actual merged adjustment+payment envelope + Workerd receipt and browser regressions. Former pending production-business-dispatch 1.0 reduced to 0.5 still NOT DONE. No budget added, earned total87.5, pending12.5.
- Quality business dimension improves 18.3→18.5 (+0.2) from C44 negative replay evidence; quality total 76.8→77.0. No physical, GO, cost, uptime or client synchronization points.

## Remaining fixed-score debt (12.5 points)
- Storage operational real switch: 1.0
- Frozen history Firebase HEAD complete and R2 binding: 4.5
- Real commercial business dispatch: 0.5
- Role commercial switch: 1.5
- UI photo SHA cutover: 2.0
- Browser legacy retirement: 1.5
- Verified physical downpath cross-device: 1.5

## Next P0 root causes, no new fronts
1. Finish certified commercial real source Firebase HEAD and R2 without inventing history or costs; retain physical customer data and forbid unapproved deployments.
2. One writer cutover only after old relay OFF/empty + authoritative DO receipt and durable original opId. No second writer, Sync3 remains.
3. Photo SHA in UI and roles, and physical PC→Safari/PWA→PC A→B→A x2 with exact stock, sales, money, photos, roles and license/PIN under 10s. GO stays 0/6.
4. PR #841 ledger conflicting same-ID red-team is intentionally RED and belongs to another reserved source owner; apply proven private #14 repair + UI provisional totals only after reservation clearance. Do not merge RED.

Notion live log: https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94
