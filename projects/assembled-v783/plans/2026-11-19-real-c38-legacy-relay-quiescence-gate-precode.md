# C38 PRECODE — fail-closed legacy relay quiescence gate before 2.0 business cutover (same friendly-123 app)
19 November 2026, Ecuador. BASELINE exact `friendly-123/master@ec60623396d1f0bf3ef0267f828484cf17029ef2`, PORT 85.5/100.0, quality 76.2/100.0, commercial GO0/6.

## Root defect evidenced in REAL shipped sources
- C36 (PR#831) ensures same real durable `opId` in `mock-backend.js`, `sync-realtime.js` and typed C31. It does NOT itself ensure one transport is the business writer.
- `docs/sync-yjs.js`: `API.activarCorte20Runtime` calls C21a coordinator `activate20()` and sets `API.modoCorte20Activo=true` even when old legacy WebSocket is open. `publicarOpLocal()` then sends cash sale to 2.0.
- `docs/sync-realtime.js`: joined room `OCSyncEmit` STILL `encolar(op)` and `ws.send(...)` independently of C31 QA cutover; `vaciarCola()` can send queued old business movements. There is also roomless Yjs journal that will operate if deliberately disabled legacy (OCSync.desactivar removes the room).
- **This is an unsafe POTENTIAL double-writer at cutover**, not a claim a real duplicate charge has occurred. The backend C21a IDB fence only controls Yjs legacy opsMap and client caller, not the direct legacy socket.
- No current commercial activation, QA remains OFF. Do not switch clients.

## Root-level minimal change: adopt existing legacy facade as cutover precondition
- Scope ONLY `docs/sync-yjs.js` QA-gated `API.activarCorte20Runtime`. Before touching C25 `coordinador.activate20`, require either no installed old transport facade (QA isolated runtime) or:
  `window.OCSync.estado()==="apagado"`,
  `window.OCSync.salaActiva()===null` or falsy,
  `window.OCSync.durabilidadPendiente()===false`,
  `window.OCSync.onEstado` exists (enables monitoring/abort).
  Any unknown/throwing state -> fail-closed, never silent success.
- Re-check after the async C25 activation before setting mode. If legacy reawakens, failback with existing C21a method and mark `modoCorte20Activo=false`. Listen to `OCSync.onEstado` (existing mature app facade, not new sync engine) while session active to detect deliberate reactivation, immediately disable cutover and request `coord.failbackToLegacy('legacy-relay-restarted')`.
- Keep photo-only cutover and ordinary QA-OFF path unchanged. This gate cannot make full business dispatch production-safe; it *prevents activation while known legacy writer is live*. No extra money, no legacy queue deletion, no Cloudflare/R2 changes.
- Refuse customer activation if the old relay has pending journal, to avoid losing cash events; do not auto-call `desactivar()` on behalf of JFC.

## Test-driven proof & release
1. Exclusive Notion reservation for `docs/sync-yjs.js`, new `test/p0-c38-legacy-transport-quiescence.test.cjs`, new CI workflow, `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`, `docs/version-manifest.json`, and _if necessary_ existing C31 harness only. No overlapping active reservations.
2. RED exact-source test with same C31 runtime activation extracted from real `docs/sync-yjs.js`: old transport connected ⇒ activation throws BEFORE coordinator; old off but pending ⇒ throws; state inaccessible ⇒ throws; old really off and empty ⇒ activates; old reawakening during async activation ⇒ aborts and C21 failback. QA OFF still unchanged.
3. GREEN one minimal complete adapter check in product, official SHA manifest `v0.8.16/f123-shell-v816/golden352`; C31/C36 regression, check-sw, fixed score, full CI. No activation of customers, commercial GO0/6.
4. If all checks pass, merge to product with HEAD SHA audit and create separate C39 fixed-score assessment ONLY if defensible, not automatic. Remain 85.5/76.2 until verified independent score update.
5. Workshop is notebook of plans, RED GREEN evidence, checkpoint; not app port. No new bespoke sync engine. Future actual A→B→A physical GO remains blocked until source-history/R2/issuer, one writer and business receipt are proven.
