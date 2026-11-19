# PRECODE · PORT2 C40 — Contrato recibo local → recibo autoritativo DO (`v0.8.17`, `USD 0.00`)

- **Base:** `jfcarpiopuntocom/friendly-123` `master@8cd8afb` (C38 `#833` fusionado; respeta reserva `#834` C39)
- **Reserva Notion:** `41d1642b-67f3-811b-b433-c0f4db81cff6` (`Estado: En curso`)
- **Presupuesto autorizado:** `USD 0.00` (doble switch QA `OFF` por defecto, bundle `docs/vendor/yparty-piloto.min.js` intacto, cero Cloudflare/R2).

## 1. Problema y objetivo (Ponytail `full`)
Responde al punto 5 del PRECODE C39 de Sol6: cuando `publicarOpLocal(op)` enruta una operación comercial C15 (`opIdVenta`) hacia `API.despacharOpComercialCertificada(cmd20)`, actualmente descarta `res.receipt` y no expone el vínculo **1-a-1 entre el recibo local (`opIdVenta`) y el recibo autoritativo del DO (`receipt.receiptId`, `receipt.stage`)**, ni existe una prueba E2E conectada en Workerd SQLite real de toda la cadena `mock-backend.js` (sobre C34+C36) → `sync-realtime.js` (`OCSyncEmit`) → `sync-yjs.js` (`C38` quiescence + `publicarOpLocal`) → `-ops` DO SQLite.

## 2. Diseño mínimo completo
1. En `docs/sync-yjs.js` (sin tocar `src/yparty-piloto.js` ni recompilar bundle):
   - Exponer `API.recibosComerciales20` (acotado a 500 entradas) y `API.obtenerReciboComercial20(opId)`.
   - Al resolver `API.despacharOpComercialCertificada(comando)` (y desde `publicarOpLocal(op)`), registrar el vínculo autoritativo `{ opId, committed, duplicate, quarantine, fallbackLegacy, stage, receipt, recordedAt }` y emitir `CustomEvent("oc-op-20-recibo", { detail })`.
   - Conservar intacta la valla C21b + C29 + C38: un `opId` enganchado o confirmado en 2.0 jamás entra a `API.opsMap` ni duplica stock/caja en failback o reload.
2. Sellado `v0.8.17` / `f123-shell-v817` / `golden353`.

## 3. Verificación TDD RED → GREEN
- Nuevo `cloudflare-yparty-worker/qa/p0-c40-local-receipt-to-do-receipt-workerd.test.mjs` + `.github/workflows/qa-port2-real-c40-local-receipt-do.yml`:
  1. **RED:** `API.obtenerReciboComercial20` no existe antes del parche.
  2. **GREEN (Workerd SQLite real):**
     - Sobre C34+C36 real de `docs/mock-backend.js` (`formaPago: "efectivo"`, `cantidad: 1`, `amountCents: 1500`, `opId: opIdVenta`) → `sync-realtime.js` (`OCSyncEmit`, relay legacy `apagado`) → `sync-yjs.js` (`C38` quiescence + `activarCorte20Runtime` + `publicarOpLocal`).
     - Verifica `API.obtenerReciboComercial20(opIdVenta)` (`committed === true`, `receipt.opId === opIdVenta`, `receipt.receiptId` SHA-256 24-hex, `receipt.stage === "business-committed"`) + evento `oc-op-20-recibo`.
     - Verifica SQLite en `-ops` DO (`stock: 5 → 4`, `cash: 500 → 2000`, `effects: 1`, `receipts: 1`, `API.opsMap.size === 0`).
     - Failback (`switchToLegacy`) + re-emisión del mismo `opIdVenta` + reload Safari: `puedeDespacharOpEnLegado(opIdVenta) === false`, `API.opsMap.size === 0`, SQLite intacto (`effects: 1`, `stock: 4`, `cash: 2000`).
