# VERIFICATION REPORT · PORT2 C42 — Observar estado real de recibo 2.0 en checkout `mock-backend` (`v0.8.18`, `USD 0.00`)

- **PR:** `jfcarpiopuntocom/friendly-123#838` (`port2/20261119-c42-checkout-receipt-status-v818`, commit `7342eaa` tras endurecimiento red-team `#839`, base `master@07ad93b`)
- **Shell / Cache:** `v0.8.18` / `f123-shell-v818` / `golden354` (bundle `docs/vendor/yparty-piloto.min.js` SHA `a45e716d95a880ca0338df1d78a433014e196813baa97294492ec846e455ccc2` intacto)
- **Presupuesto Cloudflare/R2:** `USD 0.00` (doble switch QA `OFF` por defecto, cero despliegues productivos, cero escrituras R2).

## Cambios aplicados
1. **`docs/sync-yjs.js`:**
   - `_registrarReciboComercial20(opId, res)` propaga `reconcileRequired` y `retryable`.
   - `API.despacharOpComercialCertificada(comando)` captura rechazos `Promise.reject` registrando `{ committed: false, duplicate: false, quarantine: false, fallbackLegacy: false, reconcileRequired: true, stage: "dispatch-rejected" }` y emitiendo `oc-op-20-recibo` antes de relanzar el error (sin reclamar commit remoto).
2. **`docs/mock-backend.js`:**
   - `_aplicarEstadoReciboDo20(detail)` + listener `oc-op-20-recibo` adjuntan `v.reciboDo20` sobre la venta local por `opId` distinguiendo honestamente entre `confirmado-do` (`200 business-committed`, único con `committed: true`), `pendiente-reconciliacion-do` (`202 stored-for-application` / `reconcileRequired`), `cuarentena-do` (`409 conflict-quarantine`), `respaldo-local` (`fallbackLegacy`) y `rechazado-sin-confirmar` (`dispatch-rejected`), persistiendo vía `_guardarMergePendienteYa()` sin duplicar stock, caja ni publicaciones en legado.
3. **Sellado y regresión:**
   - `docs/version.json`, `docs/dashboard.html`, `docs/sw.js`, `docs/version-manifest.json` (`v0.8.18` / `f123-shell-v818` / `golden354`).
   - `test/p0-c42-checkout-receipt-status.test.cjs` + `.github/workflows/qa-port2-real-c42-checkout-receipt-status.yml`.

## Evidencia verificada
- **Local:** `24/24 PASS` (`C42 + C40 Workerd + C38 8/8 + C36 3/3 + C34 3/3 + C31 3/3 + pwa-icons 5/5`) + `check-sw.sh` 7/7 OK.
- **GitHub CI + Workers Builds en `#838` (`7342eaa`):** `62/66 PASS`, `0 FAIL` (`Workers Builds: friendly-123` PASS, `c42-checkout-receipt-status` 17s/23s, `c40-local-receipt-do`, `cutover-no-dual-writers`, `c33-sync-yjs-workerd`, `c31-runtime-cutover`, `Release continuity gate` 2m2s, `P0 Hotfix Gate` 1m47s, `yparty-worker` 2m0s, `seal`, `two-tab-sales`; 4 mirrors/browser lentos completando). Incluye los 3 blindajes del red-team `#839` (rechazo de `receipt.opId` mismatch, ACK `confirmado-do` monótono ante `202`/rechazo tardío, y precedencia de `quarantine` sobre `reconcileRequired`).
