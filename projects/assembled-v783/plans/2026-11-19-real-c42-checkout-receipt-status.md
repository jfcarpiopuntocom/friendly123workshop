# PRECODE · PORT2 C42 — Observar estado real de recibo 2.0 en checkout (`v0.8.18`, `USD 0.00`)

- **Base:** `jfcarpiopuntocom/friendly-123` `master@07ad93b` (C41 `#837` fusionado: `PORT 86.5 / Calidad 76.6`, `GO 0/6`)
- **Reserva Notion:** `41e1642b-67f3-8199-bfdf-db13a0969067` (`Estado: En curso`)
- **Presupuesto autorizado:** `USD 0.00` (doble switch QA `OFF` por defecto, bundle `docs/vendor/yparty-piloto.min.js` intacto, cero Cloudflare/R2).

## 1. Problema y objetivo (Ponytail `full`)
Implementa el siguiente paso exacto del reporte C41 de Sol6 (`friendly123workshop@733c85a`):
1. En `docs/sync-yjs.js`, si `submitCommercial(comando)` rechaza su Promise (`Promise.reject`), `API.despacharOpComercialCertificada` actualmente omite `_registrarReciboComercial20` y `oc-op-20-recibo`, y tampoco propaga `reconcileRequired`/`retryable`.
2. En `docs/mock-backend.js`, la venta local (`ventas[]`) aún no escucha `oc-op-20-recibo` para distinguir entre guardado local durable y confirmación autoritativa del DO (`confirmado-do` vs `202/pendiente-reconciliacion-do` vs `cuarentena-do` vs `rechazado-sin-confirmar` vs `respaldo-local`), sin duplicar stock, caja ni publicaciones en legado.

## 2. Diseño mínimo completo
1. **`docs/sync-yjs.js`:**
   - `_registrarReciboComercial20(opId, res)` propaga `reconcileRequired: Boolean(res.reconcileRequired)` y `retryable: Boolean(res.retryable)`.
   - `API.despacharOpComercialCertificada` añade `.catch(function () { _registrarReciboComercial20(comando && comando.opId, { committed: false, duplicate: false, quarantine: false, fallbackLegacy: false, reconcileRequired: true, stage: "dispatch-rejected" }); throw err; })`.
2. **`docs/mock-backend.js`:**
   - Nuevo helper `_aplicarEstadoReciboDo20(detail)` y listener `window.addEventListener("oc-op-20-recibo", ...)` que localiza `v` en `ventas` por `v.opId === detail.opId`, asigna `v.reciboDo20` con el estado exacto (solo `committed: true` cuando `detail.committed === true && detail.receipt && detail.receipt.stage === "business-committed"`) y persiste vía `_mergeSucio = true; _guardarMergePendienteYa()`. No toca stock, caja, `rev` ni `emitirOpStock`.
3. Sellado `v0.8.18` / `f123-shell-v818` / `golden354`.

## 3. Verificación TDD RED → GREEN
- `test/p0-c42-checkout-receipt-status.test.cjs` + `.github/workflows/qa-port2-real-c42-checkout-receipt-status.yml`:
  1. **RED:** `docs/mock-backend.js` no escucha `oc-op-20-recibo` ni `docs/sync-yjs.js` registra `dispatch-rejected` ante Promise reject.
  2. **GREEN:** prueba exact-source de los 5 estados (`business-committed`, `202 stored-for-application`, `409 quarantine`, `Promise reject`, `fallbackLegacy`), sin falso ACK remoto ni doble publicación en legado.
