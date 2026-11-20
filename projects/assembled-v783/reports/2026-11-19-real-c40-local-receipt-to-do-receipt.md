# VERIFICATION REPORT · PORT2 C40 — Contrato recibo local → recibo autoritativo DO (`v0.8.17`, `USD 0.00`)

- **PR:** `jfcarpiopuntocom/friendly-123#835` (`port2/20261119-c40-local-receipt-to-do-receipt-v817`, commit `955aadc`, base `master@8cd8afb`)
- **Shell / Cache:** `v0.8.17` / `f123-shell-v817` / `golden353` (bundle `docs/vendor/yparty-piloto.min.js` SHA `a45e716d95a880ca0338df1d78a433014e196813baa97294492ec846e455ccc2` intacto)
- **Presupuesto Cloudflare/R2:** `USD 0.00` (doble switch QA `OFF` por defecto, cero despliegues, cero escrituras R2).

## Cambios aplicados
1. **`docs/sync-yjs.js`:**
   - Expone `API.recibosComerciales20` (acotado a 500 entradas) y `API.obtenerReciboComercial20(opId)`.
   - `API.despacharOpComercialCertificada(comando)` registra el vínculo autoritativo 1-a-1 (`{ opId, committed, duplicate, quarantine, fallbackLegacy, stage, receipt, recordedAt }`) y emite `CustomEvent("oc-op-20-recibo", { detail })`.
2. **Prueba E2E Workerd SQLite real:**
   - `cloudflare-yparty-worker/qa/p0-c40-local-receipt-to-do-receipt-workerd.test.mjs` + `.github/workflows/qa-port2-real-c40-local-receipt-do.yml`:
     - Ejecuta el sobre C34+C36 (`opIdVenta`) → `oc-op-local` → C38 quiescence + `publicarOpLocal` → `-ops` DO SQLite (`stock: 5 → 4`, `cash: 500 → 2000`, `effects: 1`, `receipts: 1`), verificando `API.obtenerReciboComercial20(opIdVenta)` + evento `oc-op-20-recibo` + `API.opsMap.size === 0`.
     - Ejecuta `failbackToLegacy()` + re-emisión del mismo `opIdVenta`: confirma `API.puedeDespacharOpEnLegado(opIdVenta) === false`, `API.opsMap.size === 0` y SQLite intacto sin duplicar stock ni caja.
3. **Verificación local:** `18/18 PASS` (`C40 Workerd + C38 8/8 + C31 3/3 + C37 + pwa-icons 5/5`) + `check-sw.sh` 7/7 OK.
