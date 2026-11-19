# PRECODE · PORT2 C16a · Reconciliador acotado `same-do-only` para comandos económicos `-ops` (cero colisión, USD 0,00)

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios Cloudflare:** NINGUNO (100% local + CI GitHub).
- **Base:** `jfcarpiopuntocom/friendly-123` `origin/master@673edca`.
- **Colisión con #795, #796, #797:** CERO (solo 3 archivos nuevos: `src/port2-typed-ops-reconciler.mjs`, `test/p0-c16a-typed-ops-reconciler.test.cjs`, `.github/workflows/qa-port2-real-c16a-typed-ops-reconciler.yml`).

## Problema que resuelve (continuación directa del endurecimiento de Sol6 en #795)
En PR #795 (`5853a54`), Sol6 fijó la invariante crítica anti-duplicación: cuando un comando económico ya cruzó la red hacia el DO (`202`, `200 stored-for-application`, timeout, pérdida de ACK o `5xx`), `dispatchTypedCommercialCommand` devuelve:
```js
{ committed: false, fallbackLegacy: false, reconcileRequired: true, retryTarget: 'same-do-only' }
```
Si el navegador no tiene un reconciliador dedicado `same-do-only`:
1. Un usuario/cajero que reintenta podría volver a emitir la venta por el libro legado (duplicando caja/stock), o
2. Un loop ingenuo podría disparar cientos de requests sin backoff (violando la política de tráfico mínimo / cero costo y agotando rate limits de `/ws/ticket`), o
3. Dos pestañas/reintentos podrían volar en paralelo para el mismo `opId`, o correr con la pestaña oculta/BFCache.

## Diseño Ponytail (`src/port2-typed-ops-reconciler.mjs`)
Módulo ESM puro (sin dependencias externas, listo para importar en `src/yparty-piloto.js` en C16b tras merge de `#795`):
- `createTypedOpsReconciler({ dispatch, store, isVisible, maxAttempts = 5, maxPending = 64, baseDelayMs = 800, maxDelayMs = 15000, now, schedule, cancelSchedule })`
- **Invariantes estrictas:**
  1. **Latch `same-do-only` irreversible por `opId`:** una vez un `opId` recibe `reconcileRequired: true` / `retryTarget === 'same-do-only'`, queda marcado en el `store` durable con `sameDoLocked: true`. Jamás puede volver a `fallbackLegacy: true`, incluso si un reintento posterior recibe `auth-denied` o `precondition-denied` (pausa y espera a que el dueño vuelva a autenticarse).
  2. **Failback limpio solo ANTES de tocar el DO:** si el **primer** intento (sin latch previo) devuelve `fallbackLegacy: true` (`precondition-denied`, `auth-denied`, `invalid-command`, `unsupported-issuer-scope`), NO se encola y devuelve `fallbackLegacy: true`.
  3. **Cierre idempotente:** al recibir `committed: true` (incluso `duplicate: true`), saca el `opId` de pendientes, guarda recibo final y notifica sin duplicar.
  4. **Cuarentena terminal (`409`):** al recibir `quarantine: true`, mueve el `opId` a cuarentena terminal (ni reintentos ni legado).
  5. **Single-flight + cola acotada + backoff exponencial:** máximo 1 vuelo concurrente por `opId`, tope `maxPending` (rechaza en cerrado si se llena), tope `maxAttempts` (tras agotar intentos pasa a estado `paused-retry-exhausted` — exige `reconcileNow()` manual al reconectar; **nunca** loops infinitos ni tormentas de peticiones).
  6. **Ciclo de vida Safari/BFCache:** `pause()` cancela temporizadores pendientes sin perder la cola; si `!isVisible()`, no dispara red; `resume()` reanuda la reconciliación pendiente de forma segura.
  7. **Validación de payload idéntico por `opId`:** si se re-envía el mismo `opId` con distinto payload canónico mientras está pendiente, rechaza en cerrado (`opid-payload-mismatch`) para impedir sobrescribir una operación económica en vuelo.
  8. **Privacidad:** nunca guarda ni devuelve PINs ni tokens Bearer en el `store` (solo `opId`, comando canónico, estado, contador de intentos y timestamps).

## Plan TDD (RED → GREEN)
- **RED:** `test/p0-c16a-typed-ops-reconciler.test.cjs` falla antes de implementar `src/port2-typed-ops-reconciler.mjs`.
- **GREEN:** 100% de los casos (10 escenarios críticos) pasan localmente y en GitHub Actions.
- **Métricas:** sin cambios en PORT (`81.5/100.0`), Calidad (`72.7/100.0`) ni GO (`0/6`) — este módulo se acreditará al cablearse con C15 en `src/yparty-piloto.js` en C16b.
