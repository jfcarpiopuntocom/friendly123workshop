# C44 Verification Report — Real `ajuste` (`stock.adjust`) & `abono` (`credit.customer.payment.record` / `credit.payment.record`) 2.0 Cutover

- **Date:** 2026-11-19 (GMT-5)
- **PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/842 (`19e80f4`)
- **Base:** `master@f7d96a7` (C43 merged: `PORT 87.0 / 100.0`, `Calidad 76.8 / 100.0`, `GO 0/6`)
- **Shell:** `v0.8.19` / `f123-shell-v819` / `golden355` (synced across `docs/sw.js`, `docs/version.json`, `docs/dashboard.html`, `docs/version-manifest.json`)
- **Spend:** `USD 0.00` (all QA flags OFF by default, ZERO R2 writes, ZERO Worker deploys)

## Implemented Changes
1. `docs/mock-backend.js`:
   - `POST /api/productos/:id/stock` (`fisico === null`): attaches `stockNuevo: p.stockActual` and validated durable `opId` (`body.opId` or `uuid("adj-")`) on `op` before `emitirOpStock("ajuste", op, true)`.
   - `POST /api/clientes/:id/abonar` (`tipo === "abono"`): guarded with `typeof emitirOpStock === "function"`, derives `customer-payment:<id>` opId and calls `emitirOpStock("abono", { opId: _opIdAbono, clienteId: c.id, movimientoId, amountCents, monto }, true)` without fabricating `receivableId` and preserving `opId: body.opId || null` in the HTTP response.
   - `aplicarOpRemota`: skips the `stock-proof-missing` gate when `op.tipo === "abono"`.
2. `docs/sync-realtime.js`:
   - `OCSyncEmit`: preserves the exact `const opIdVentaDurable = tipo === "venta"` C36 guard while delegating `"ajuste"` (`productoId` + `Number.isSafeInteger(stockNuevo) && stockNuevo >= 0`) and `"abono"` (`customer-payment:<id>` with `clienteId`, or explicit `receivableId` with `^[A-Za-z0-9_-]{8,96}$`) to `_opIdAjusteOAbonoDurable(tipo, payload)`.
3. `docs/dashboard.html`, `docs/sw.js`, `docs/version.json`, `docs/version-manifest.json`: bumped to `v0.8.19` / `f123-shell-v819` / `golden355` (`130` shell files hashed).

## Verification Results (Exact SHA `19e80f4`)
- `node scripts/release-control.cjs validate origin/master` -> `PASS 31 protected capabilities; identity consistent`.
- `bash check-sw.sh` -> all gates PASS (`G2`, `G4`, `G5`, `G6`, `G7`, manifest hashes).
- `node --test test/p0-c44-ajuste-abono-envelope-and-opid.test.cjs test/p0-architecture-2-port-score.test.cjs test/p0-c36-real-sale-opid-e2e.test.cjs test/p0-c34-real-sale-envelope-contract.test.cjs` -> **10/10 PASS, 0 FAIL**.
- `cd cloudflare-yparty-worker && node --test qa/p0-c44-ajuste-abono-workerd.test.mjs` -> **1/1 PASS** on real Miniflare + Workerd `-ops` DO SQLite (`stock 5->8`, `debt 3000->1500`, `receipts: 2`, `effects: 2`, 0 duplicate on replay).
