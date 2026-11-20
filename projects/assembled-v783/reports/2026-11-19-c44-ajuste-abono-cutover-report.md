# C44 Verification Report — Real `ajuste` (`stock.adjust`) & `abono` (`credit.payment.record`) 2.0 Cutover

- **Date:** 2026-11-19 (GMT-5)
- **PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/842 (`0260e5e`)
- **Base:** `master@f7d96a7` (C43 merged: `PORT 87.0 / 100.0`, `Calidad 76.8 / 100.0`, `GO 0/6`)
- **Shell:** `v0.8.19` / `f123-shell-v819` / `golden355`
- **Spend:** `USD 0.00` (all QA flags OFF by default, ZERO R2 writes, ZERO Worker deploys)

## Implemented Changes
1. `docs/mock-backend.js`:
   - `POST /api/productos/:id/stock` (`fisico === null`): attaches `stockNuevo: p.stockActual` and validated durable `opId` (`body.opId` or `uuid("adj-")`) on `op` before `emitirOpStock("ajuste", op, true)`.
   - `POST /api/clientes/:id/abonar` (`tipo === "abono"`): derives validated `_opIdAbono` and calls `emitirOpStock("abono", { opId: _opIdAbono, clienteId: c.id, receivableId, movimientoId, amountCents, monto }, true)` after `Cartera.registrarMovimiento` + `mov(...)`, returning `opId: body.opId || _opIdAbono`.
   - `aplicarOpRemota`: skips the `stock-proof-missing` gate when `op.tipo === "abono"`, allowing non-stock credit ops to remain idempotent no-ops on legacy pilot peers.
2. `docs/sync-realtime.js`:
   - `OCSyncEmit`: preserves the exact `const opIdVentaDurable = tipo === "venta"` C36 guard while delegating `"ajuste"` (`productoId` + `Number.isSafeInteger(stockNuevo) && stockNuevo >= 0`) and `"abono"` (`receivableId` + `Number.isSafeInteger(amountCents) && amountCents > 0`) to `_opIdAjusteOAbonoDurable(tipo, payload)`.
3. `docs/sw.js`, `docs/version.json`, `docs/version-manifest.json`: bumped to `v0.8.19` / `f123-shell-v819` / `golden355` (`130` shell files hashed).

## Verification Results (Exact SHA `0260e5e`)
- `node scripts/gen-manifest.js` -> `v0.8.19`, `f123-shell-v819`, `130` files.
- `bash check-sw.sh` -> all gates PASS (`G2`, `G4`, `G5`, `G6`, `G7`, manifest hashes).
- `node --test test/p0-c44-ajuste-abono-envelope-and-opid.test.cjs test/p0-c42-*.test.cjs test/p0-c34-*.test.cjs test/p0-c36-*.test.cjs test/p0-c31-*.test.cjs test/p0-c38-*.test.cjs test/p0-architecture-2-port-score.test.cjs` -> **26/26 PASS, 0 FAIL**.
- `cd cloudflare-yparty-worker && node --test qa/p0-c44-ajuste-abono-workerd.test.mjs` -> **1/1 PASS** on real Miniflare + Workerd `-ops` DO SQLite (`stock 5->8`, `debt 3000->1500`, `receipts: 2`, `effects: 2`, 0 duplicate on replay).
