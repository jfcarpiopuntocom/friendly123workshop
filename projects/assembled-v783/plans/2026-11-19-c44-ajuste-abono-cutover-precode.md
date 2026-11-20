# C44 PRECODE — Real `ajuste` (`stock.adjust`) & `abono` (`credit.payment.record`) 2.0 Cutover in `docs/mock-backend.js` + `docs/sync-realtime.js`

- **Date:** 2026-11-19 (GMT-5)
- **Repo:** `jfcarpiopuntocom/friendly-123` (`master@850925d`, `v0.8.18`)
- **Shell Bump:** `v0.8.19` / `f123-shell-v819` / `golden355`
- **Budget:** `USD 0.00` (local + GH Actions + Workerd/Miniflare only; ZERO R2, ZERO Worker deploys, all QA flags OFF)
- **Collision Check:** Sol6 C43 (`#840`) reserves score-only files (`docs/engineering/*`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`). Zero overlap.

## Root Cause
1. `docs/mock-backend.js` (`POST /api/productos/:id/stock`, `fisico === null`): `emitirOpStock("ajuste", op, true)` emits `{ productoId: p.id, delta: d }` without `stockNuevo: p.stockActual` or a caller-validated durable `opId`, even though `_traducirOpLegadoAComando20` in `docs/sync-yjs.js` translates `ajuste` to `stock.adjust` using `stockNuevo`.
2. `docs/mock-backend.js` (`POST /api/clientes/:id/abonar`, `tipo === "abono"`): saves the customer payment in `AMG.Cartera.registrarMovimiento` and records `mov(...)`, but NEVER calls `emitirOpStock("abono", ...)` at all—so real browser credit payments never reach `OCSyncEmit` -> `OCYjs.publicarOpLocal` -> `despacharOpComercialCertificada` -> `-ops` DO.
3. `docs/sync-realtime.js` (`OCSyncEmit`): `opIdVentaDurable` only preserves `payload.opId` when `tipo === "venta"`, replacing `ajuste` and `abono` opIds with `uuidCorto()` and breaking end-to-end idempotency/receipt lookup (`API.obtenerReciboComercial20(opId)`).
4. `docs/mock-backend.js` (`aplicarOpRemota`): rejects any op without `stockPNHecho` when `OCYjs.esLicenciaPruebaJfc` is true, which would spuriously error on `abono` (a non-stock credit op).

## Minimal Ponytail `full` Fix
1. `docs/mock-backend.js`:
   - In `POST /api/productos/:id/stock` (`fisico === null`): include `stockNuevo: p.stockActual` and validated `opId` (from `body.opId` if matching `/^[A-Za-z0-9_-]{8,96}$/`, else generated `adj-...`) on `op` before `emitirOpStock("ajuste", op, true)`.
   - In `POST /api/clientes/:id/abonar` (`tipo === "abono"`): after `registrarMovimiento` + `mov(...)`, derive validated `_opIdAbono` and emit `emitirOpStock("abono", { opId: _opIdAbono, clienteId: c.id, receivableId: String((relacion && relacion.ventaId) || recibo.id || c.id), movimientoId: String(recibo.id || ""), amountCents: Math.round(monto * 100), monto }, true)`, and return `opId: _opIdAbono`.
   - In `aplicarOpRemota`: allow `op.tipo === "abono"` without `stockPNHecho` to fall through to idempotent no-op.
2. `docs/sync-realtime.js`:
   - Extract `_opIdComercialDurable(tipo, payload)` so `"venta"`, `"ajuste"` (`productoId` + finite non-negative `stockNuevo`), and `"abono"` (`receivableId` + positive integer `amountCents`) preserve their validated `payload.opId`.
3. `docs/sw.js`, `docs/version.json`, `docs/version-manifest.json`: bump to `v0.8.19` / `f123-shell-v819` / `golden355` and regenerate manifest hashes.

## Verification Plan (TDD RED -> GREEN)
1. `test/p0-c44-ajuste-abono-envelope-and-opid.test.cjs` (real `docs/mock-backend.js` + `docs/sync-realtime.js` VM): proves `ajuste` & `abono` emit exact C15 fields + preserve `opId` (RED before fix, GREEN after).
2. `cloudflare-yparty-worker/qa/p0-c44-ajuste-abono-workerd.test.mjs` (real Workerd + Miniflare + `docs/mock-backend.js` + `docs/sync-realtime.js` + `docs/sync-yjs.js` + `yparty-piloto` bundle): proves `POST /api/productos/:id/stock` and `POST /api/clientes/:id/abonar` flow end-to-end into `-ops` DO SQLite (`stock.adjust` & `credit.payment.record`), `API.obtenerReciboComercial20(opId)` returns `committed: true`, and replay produces 0 duplicates.
3. `bash scripts/check-sw.sh` + full existing `test/p0-c*.test.cjs` + `scripts/architecture-2-port-score.cjs`.
