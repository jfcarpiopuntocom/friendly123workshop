# PORT 2.0 real app · Gate D `Tienda.onStart` · PR #781 · RED→GREEN · 19 Nov 2026

**Target/product:** `jfcarpiopuntocom/friendly-123` (not this workshop). **Sync3 survives** as compatible transport in 2.0. This workshop holds only plans, QA and reproducible evidence.

## Source / SHA

- Real app baseline `master@f53604b7e99ba8a9eb5f9e906199b17f110ebdcb` (v0.8.01 at audit).
- Real app candidate `port2/20261119-real-gate-d-onstart@22ea37befbb6a96afffb61078b92e82d976e4023`, [**DRAFT PR #781**](https://github.com/jfcarpiopuntocom/friendly-123/pull/781). Not merged, not deployed.
- Workshopped source [PR #133](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/133) and historical frozen reopen [PR #131](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/131).
- [PRECODE plan](../plans/2026-11-19-real-app-gate-d-port-precode.md) created FIRST at workshop SHA `852aba27be2cbe4b65570042e489d825fb9ee6fe`.

## Genuine TDD on REAL app

1. [RED `44463584973`](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44463584973) on app branch `5edeb6693aaf1957b28b6683b690e960d1fda722`: **16/20 PASS, four intentional FAIL** in original true `Tienda.onStart` Workerd tests. Failure modes: original catalog empty rather than independently supplied certified history; catalog/ops missing; private catalog disguised in ops falsely accepted; orphan Yjs parent falsely accepted. OFF path PASS.
2. Imported exact workshop `open-existing-store.mjs`, `trusted-frozen-source.mjs`, and `index.js` minimal Gate D hook. Invariant independently checked: **removing exactly 2 imports, 1 method and 1 call from workshopped `src/index.js` reconstructs real app baseline byte-for-byte**. No other code edit.
3. Preserved old frozen-open fixture + tests and original worker import/full export suites, plus isolated Action. [GREEN `44463929641`](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44463929641) on final app HEAD `22ea37b`: **25/25 PASS, 0 FAIL, 0 CANCEL, 0 SKIP** in actual Miniflare/Workerd with YParty, SQLite, 2-writer Yjs, cold reopen and protected rooms.
4. Exact GitHub compare: **7 changed files**, `cloudflare-yparty-worker/src/index.js` only `+29/-0`, remaining 2 new helpers, 3 test/fixture, 1 CI workflow. No shell, 1.0 business code, client Sync3, PIN/stock/money/photo, wrangler vars, secrets or Worker deploy changed.

## Reconciliation / avoid duplicating workshop

The next proposed `src/yparty-piloto.js` host transfer (#132 workshop) is **ALREADY in the REAL app**, exact `friendly123-yparty-port2-canary-qa.jfcarpio.workers.dev` in real source and browser vendor. No useful host graft exists. **Critical difference:** REAL app source intentionally disables `fotoSha()` immediately (privacy/E2E constraint of #765), while the workshop assembled copy enables it. Blind workshop → real copy would remove an existing security fail-closed; reject that regression rather than opening another PR. Resume only after a distinct verified privacy/photo sealing contract.

## Still missing for actual GO

- Independently certified full current Firebase catalog HEAD: historical cold join 6,112 frames, 19 missing causal parents and nine partial 401 responses; no snapshot reset or false `more:false`.
- QA `/ws/ticket` issuer deployment, protected `WS_FROZEN_HISTORY_SOURCE` service binding with complete source history, and a paginated scheme for history exceeding bounded current QA intake.
- Team must never see raw private Y.Doc. Ops `stored-for-application` is not `business-committed`; customer payments/stock are separate typed effects.
- An isolated QA canary plus physical Opera PC ↔ Safari iPhone A→B→A twice, receipts, stock, money, photos/PIN proof, rollback.
- Last Notion rubric **quality 67/100; operational port 61/100; commercial GO 0/6**. The feature is **implemented and tested in a REAL APP PR**, not merged/deployed/customer-accepted. Do not claim 80%.

**Next causal action:** complete independent Firebase frozen-source correctness + sealed source Service Binding; then authorize QA activation with exact SHA and trace. Do not rework Sync3, photos or 1.0 patches while the relevant 2.0 replacement is available.
