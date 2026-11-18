# 2026-11-18 · PR #766 integration — cuota Safari Belén, single-opId, fail-closed

## Baseline
- LIVE master v0.7.91 f123-shell-v791. Current UI docs/plan-pagos-ui.js persists `customer-payment` and `customer-allocation` *only* in localStorage. On QuotaExceeded it refuses to post money, but user cannot collect. Evidence direct Belén report: https://app.notion.com/p/4031642b67f38194a024cea8832b105c.
- Tested branch PR #766 `src/pago-intento-idb.mjs`, GREEN `44386022218` and retrospective proper RED `44386208104`. Existing `test/fiados-quota-cliente-4d.test.js` is the baseline for fail-closed when both storage paths fail.
- Other concurrent WIP PR #765 UltraReview: separate, do NOT merge into this PR/enable YParty. Operational port score unchanged (67/57).

## Behavioral contract
1. Never POST /abonar or /aplicar until the specific payment/allocation intent has a durable readback. If localStorage full but IDB works, use IndexedDB; if neither works, report precisely and block POST. Scope IDB key to SHA256 of active license + instance; reject missing/changed identity (legacy fallback only when IDB unavailable).
2. Read old localStorage pending references first. If both old and new contain differing opId/receipt/amount, fail closed; never discard legacy or silently choose a newer payment.
3. Preserve `customer-payment:uuid` across Safari kill/reopen, dual tabs and retry. In-progress recorded money can only be retried with the same opId; require a matching business receipt `movimientoId` before purging the pending reference.
4. Allocation selection `partes` remains chosen by employee, never auto-pick a purchase, no cross-customer allocation; before payment save allocation intent; after payment save monotonic `abonoId`; only then apply allocation with a distinct stable allocation opId, verify `aplicacionId`.
5. A failing post-payment local write reports `cobroConfirmado` and NEVER offers a fresh payment; stable pending id remains on disk. A failed cleanup after confirmed ACK cannot reclassify success as failed.
6. Fail-closed on revoked/missing role and cross-business identity. Never send license or PIN to new remote server.
7. Existing browser/no IDB behavior remains as before when localStorage works; direct ui regression for old tests. Minimum new code; no new ledger, no backfill of disputed five IPA sales.

## Tests RED→GREEN
- Real app `ocEnviarAbono` extracted from docs/plan-pagos-ui.js, fake-indexeddb and synthetic `f123_owned` + authenticated role, localStorage QuotaExceeded, network stub. Two POST attempts concurrent => 1 network call; after simulated restart pending reference same opId; response business receipt idempotent; wrong amount/role/license cannot send.
- Allocation `reanudarAsignacion` extracted real code: durable prepayment intent; receipt storage post-payment, retry same opId; no automatic selection, `/aplicar` called exactly once upon receipt; allocated payment does not debit stock.
- Inject IDB error/blocked/quota and localStorage quota => no request and actionable error. Legacy pending import conflict fail closed.
- Node full focal tests + npm dependencies and official packaged shell/parity. Chromium/WebKit browser smoke for mobile Safari emulation, not physical proof.
- On green fast track PR #766 ready/merge with exact SHA, v0.7.92 shell v792 + golden328 and manifest. New public shell explicitly authorized by JFC Nov 18. No full 33-minute test. Verify hotfix publish jobs and HTTP version. If any unexplained legacy regression/failed security test, STOP publication and document.
- Real client adoption NOT proven by CI; retain legacy and rollback.
