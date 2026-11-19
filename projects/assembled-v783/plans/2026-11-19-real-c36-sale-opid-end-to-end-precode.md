# PRECODE C36 — Stable sale opId from durable UI receipt to 1.0/Sync3/2.0 typed event (Ponytail)
Date: 2026-11-19 Ecuador. SOURCE master product `jfcarpiopuntocom/friendly-123@d1878b13e14a83bc7cb1026cb0dede16abed7d18`; fixed score PORT 85.0/100.0, quality 76.0/100.0, GO 0/6.

## Verified source/root defect
1. `docs/mock-backend.js` real sale endpoint accepts `body.opId` (same stable across retry), rejects conflicts, records `ventas.push({opId:opIdVenta,...})`, and publishes exactly one `_opVenta` only AFTER durable `guardarEstadoLocal(true,true)`. `opIdVenta = _opIdVenta || ventaId`; `uuid("v")` fallback creates a stable ID.
2. C34 enriched cash-only `_opVenta` with `cantidad` and `amountCents`, but forgot to attach its real `opIdVenta`.
3. `docs/sync-realtime.js` `window.OCSyncEmit("venta",payload)` allocates `uuidCorto()` independently BOTH roomless Yjs-journal and room-joined legacy/Yjs queue. Thus stable sale's durable receipt ID and 2.0 business command ID disagree; reboot and duplicate sale cannot be identified as the same event across layers. C31 `_traducirOpLegadoAComando20` requires `[A-Za-z0-9_-]{8,96}`, so do not feed incompatible legal legacy opIDs into typed dispatch.
4. C33 Workerd real SQLite QA and C34 39/39 CI already integrated; Sync3 is 2.0 and remains unchanged. Scope does NOT claim physical GO.

## Intervention minimal and safe
- ONLY in existing C34 cash-eligible guard in `docs/mock-backend.js`: require typed-compatible `opIdVenta` `/^[A-Za-z0-9_-]{8,96}$/` AND assign `_opVenta.opId=opIdVenta` together with quantity/cents, no second op. Invalid existing IDs, credit/courtesy/partial/discount/deficit keep legacy and receive no typed command. No changes to sale stock/money, strict save, role, UI or receipt.
- In `docs/sync-realtime.js` `OCSyncEmit`: for `tipo==="venta"` with validated `payload.opId` and C34-compatible cash metadata `cantidad/amountCents`, re-use that ID in BOTH roomless persisted Yjs journal and old room queue; all others get uuidCorto exactly as before. The resulting `oc-op-local` event carries same ID into C31 typed dispatch and recovered journal. No dispatch/ACK claims, no changes to Sync3/Yjs.
- RED exact-source tests: NEW `test/p0-c36-real-sale-opid-e2e.test.cjs` exercise a REAL `browser()` backend sale and duplicate retry, capture actual emitted payload, execute actual `sync-realtime.js` OCSyncEmit in both topologies (room / roomless), pass same event to actual C31 translator, assert `opId` equals durable sale record AND 2.0 command, legacy room and journal single same ID, money/stock once, non-cash/unsafe ID stays legacy, no cross-license leakage. No mocked fabricated intermediary id.
- Update existing `test/p0-c34-real-sale-envelope-contract.test.cjs` harness to provide `opIdVenta` to exact source and negatives; fixes earlier harness independence. Add dedicated C36 CI runner for RED→GREEN + old op tests + official manifest and score, then global CI.
- Release v0.8.15 shell f123-shell-v815/golden351 with official deterministic manifest via CI. Change only `docs/mock-backend.js`, `docs/sync-realtime.js`, `test/p0-c34-real-sale-envelope-contract.test.cjs`, NEW C36 test, NEW workflow, `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`, `docs/version-manifest.json`; no Worker code, no QA switch change, no R2/Cloudflare/no customer data. Alert any concurrent file reservation before editing.

## Gates and rollback
- First commit test fails RED on master with misaligned `opId`, then minimal actual product source change, green on exact sha, complete GitHub Actions and release manifest verification.
- Match C34 strict SHA and no double accounting: replay `body.opId` returns duplicate without a second emit.
- If full CI fail, leave PR draft and checkpoint; no merge. GO 0/6 until real two-device PC↔Safari A→B→A×2 + cash/stock/receipts reconciled; no claimed activation.
- Only AFTER MERGE and independent audit, consider fixed-budget reclassification of at most 0.5 from pending `production-business-dispatch` (2.5) and quality +0.2 if proven; no fabricated increment. Another separate scoring PR C37 TDD red.
- Save logs and code in workshop and append Notion live immediately. User priority: solve Belén's stock/money correctness and minimize future patches to 1.0.
