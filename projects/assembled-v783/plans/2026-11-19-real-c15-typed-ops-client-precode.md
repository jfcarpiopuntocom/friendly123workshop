# PRECODE · PORT2 C15 · Cliente HTTP tipado `-ops` con ACK `business-committed` y guardas contra pitfalls · 2026-11-19

- **Producto destino:** `jfcarpiopuntocom/friendly-123` (base limpia `master@5daab17d24d5407f7d089b1d9d28c8a89b647319`).
- **Rama candidata (para revisión y fusión de Sol6):** `port2/20261119-c15-typed-ops-client`.
- **Aislamiento total:** CERO solapamiento con C13 ([PR #793](https://github.com/jfcarpiopuntocom/friendly-123/pull/793), `docs/sync-yjs.js`, shell `v0.8.03`, score) y CERO solapamiento con Sol6 C14 (`cloudflare-yparty-worker/src/frozen-ops-baseline.mjs`, `certified-frozen-import.mjs`, `open-existing-store.mjs`). No toca bundle/shell/rollout/Cloudflare/datos de clientes.

## Pitfalls reales hallados antes de escribir código
1. **`src/ws-owner-ticket-params.mjs:24` solo pide `['ops:read', 'ops:sale']` para `-ops`:** no puede emitir tickets HTTP de mínimo privilegio `['ops:adjust']` (requerido por `stock.adjust`) ni `['ops:payment']` (requerido por `credit.payment.record` / `credit.customer.payment.record`), ni `['ops:sale']` aislado.
2. **Desajuste de scope `expense.record`:** `typed-commercial-ledger.mjs:10` exige `ops:expense`, pero `cloudflare-worker/ws-capability-issuer.mjs:10-15` (`CEILING`) NO incluye `ops:expense` para ningún rol. El cliente debe rechazar `expense.record` localmente (`unsupported-issuer-scope`) antes de quemar cupo de `/ws/ticket`.
3. **Trampa HTTP 202 (`response.ok === true`):** `cloudflare-yparty-worker/src/index.js:277` devuelve HTTP `202` con `receipt.stage === 'stored-for-application'` cuando `WS_BUSINESS_EXECUTOR_QA !== '1'`. Un cliente que valide solo `response.ok` marcaría una venta/cobro como aplicada sin haber ejecutado el SQL de stock/caja. Solo HTTP `200` + `receipt.stage === 'business-committed'` + coincidencia exacta de `opId`/`kind`/`license`/`payloadHash` puede marcar commit comercial.
4. **Trampa 409 conflicto de `opId`:** reenviar un `opId` ya aplicado con distinto monto/producto devuelve `409`. Reintentar o hacer fallback silencioso rompería contabilidad; debe entrar en `quarantine: true, retryable: false, fallbackLegacy: false`.
5. **Trampa CORS / env QA:** `cloudflare-yparty-worker/src/index.js:621` exige `WS_TYPED_ORIGIN_QA` HTTPS exacto; hoy `friendly123-yparty-port2-canary-qa` no tiene esa variable (ni `WS_CATALOG_ORIGIN_QA`), y `friendly123-licencias` sigue en código del 4 nov sin `/ws/ticket`.

## Cambio mínimo completo (Ponytail)
1. `src/ws-owner-ticket-params.mjs`: añade parámetro opt-in `opsScope` (`'sale' | 'adjust' | 'payment'`) exclusivo para salas `-ops` (incompatible con `photoScope` y `catalogReadOnly`), emitiendo exactamente `['ops:' + opsScope]`. Comportamiento anterior intacto cuando `opsScope === undefined`.
2. **Nuevo** `src/port2-typed-ops-client.mjs`:
   - `validateTypedCommercialCommand(command)` + `dispatchTypedCommercialCommand(opts)`.
   - Valida whitelist exacta de claves/tipos/límites antes de pedir ticket (jamás filtra `pin`, contactos, roles ni campos extra).
   - Rechaza tab oculto (`!isVisible()`), sala no `-ops`, licencia/instancia inválida antes de red.
   - Usa `AbortController` con timeout acotado (`200..10000 ms`, default `4500 ms`).
   - Clasifica explícitamente: `business-committed` (solo 200 validado), `queued-not-committed` (202 → `committed:false, fallbackLegacy:true`), `conflict-quarantine` (409 → `quarantine:true, retryable:false`), `auth-denied` (401/403 → `retryable:false, fallbackLegacy:true`), `invalid-command` (400/413/415), `unavailable-fallback` (429/5xx/timeout/red → `fallbackLegacy:true, retryable:true`).
3. **Pruebas TDD RED→GREEN:**
   - Unit + contratos: `test/p0-c15-typed-ops-client.test.cjs` (más regresión en `test/p0-yparty-client-real-tickets.test.cjs`).
   - **Workerd real contra `Tienda` + `authoritative-business-sql.mjs`**: `cloudflare-yparty-worker/qa/p0-c15-typed-ops-client-workerd.test.mjs` (prueba 202 queued vs 200 business-committed para `sale.record`, `stock.adjust`, `credit.payment.record`, idempotencia sin doble descuento, 409 quarantine, 403/503 fail-closed).
   - Workflow dedicado: `.github/workflows/qa-port2-real-c15-typed-ops-client.yml`.

## Rollback y límites
- No cambia el bundle ni el shell ni activa ninguna tienda (`docs/sync-rollout.json` y Cloudflare QA siguen OFF).
- No incrementa `architecture-2-port-score.json` todavía (el crédito `production-business-dispatch` de 3,0 pts se reclama solo cuando Sol6/cableado conecte este módulo al flujo real de `src/yparty-piloto.js` + bundle + `docs/sync-yjs.js`).
