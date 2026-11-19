# PRECODE · PORT2 C16 · Cablear cliente económico tipado `-ops` (C15) en `src/yparty-piloto.js` + bundle reproducible + gancho opt-in

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` (100% local + Miniflare/Workerd CI; cero cambios en Cloudflare/R2).
- **Dependencias de secuencia (cero colisión con Sol6):**
  - Depende de fusión por Sol6 de **PR #795** (C15, `src/port2-typed-ops-client.mjs`, HEAD `5853a54`, 14/14 CI PASS).
  - Si incluye sellado de shell y `docs/version-manifest.json`, se abre/rebasa **después** de que Sol6 fusione **PR #796** (`v0.8.04`, 27/27 CI PASS) para evitar colisión de shell/manifiesto.

## Objetivo (avance de `typed-economics/production-business-dispatch`, +3.0 pts)
Conectar el cliente HTTP tipado `-ops` de C15 (`dispatchTypedCommercialCommand` en `src/port2-typed-ops-client.mjs`) al puente real de navegador `window.F123YPartyPilot(sala, licencia)` en `src/yparty-piloto.js`, compilar de forma determinista `docs/vendor/yparty-piloto.min.js`, y exponer un gancho explícito y fail-closed (detrás del doble switch QA, apagado por defecto en `docs/sync-rollout.json`) sin alterar ni debilitar el transporte comercial actual.

## Contrato Ponytail en `src/yparty-piloto.js`
Añadir `enviarComandoEconomicoTipado(command, opts)` a `window.F123YPartyPilot(sala, licencia)`:
1. **Validación estricta de sesión Owner (misma disciplina que `leerCatalogoPublicoCertificado`):**
   - `f123_owned` en `localStorage` coincide con `licencia` y `instanceId` válido (`/^[A-Za-z0-9_-]{6,128}$/`).
   - `sala` es 32-hex (`/^[a-f0-9]{32}$/`).
   - `window.OCAuth?.rolActual?.() === 'dueno'`.
   - PIN transitorio en RAM (`window.OCSecure?.leerPinQueAbre?.()?.owner`), 3 dígitos, nunca `'456'` ni `'789'`; **jamás** se guarda en `localStorage`, URL ni logs.
   - Pestaña visible (`!document.hidden`); si está oculta, fail-closed sin red (`precondition-denied`, `fallbackLegacy: true`).
2. **Delegación directa al cliente endurecido C15 (`dispatchTypedCommercialCommand`):**
   - `room: sala + '-ops'`, `host` fijado a `friendly123-yparty-port2-canary-qa.jfcarpio.workers.dev` (nunca sobrescribible por llamador).
   - `licenseCode: licencia`, `instanceId`, `command`, `getCredentials`, `isVisible: () => !document.hidden`, `fetch` inyectable solo para pruebas controladas (por defecto `globalThis.fetch`).
3. **Semántica de retorno intacta (anti-duplicación de ventas):**
   - `200 business-committed` + `receiptId` SHA-256 verificado → `{ committed: true, fallbackLegacy: false, reconcileRequired: false, receipt }`.
   - `202` / `200 stored-for-application` / timeout / pérdida de ACK / `5xx` → `{ committed: false, fallbackLegacy: false, reconcileRequired: true, retryTarget: 'same-do-only' }` (**PROHIBIDO** caer al libro legado y duplicar venta; el llamador reconcilia el **mismo `opId`** contra el mismo DO con un ticket nuevo one-use).
   - `409` conflicto → `{ committed: false, quarantine: true, fallbackLegacy: false, retryable: false }` (terminal, sin reintento ni legado).
   - Fallo previo al envío (`precondition-denied`, `auth-denied`, `unsupported-issuer-scope` como `expense.record`, `invalid-command`) → `{ committed: false, fallbackLegacy: true }` (nunca cruzó la red hacia el DO).
4. **Invariantes que NO cambian:**
   - `canal(...)` y `fotoSha()` siguen en su estado fail-closed actual (`#765`).
   - `docs/sync-rollout.json` sigue OFF; ningún cliente comercial real cambia de transporte.
   - `Sync3` intacto.

## Plan TDD (RED → GREEN → Workerd)
1. **RED:** crear `test/p0-c16-browser-pilot-typed-ops-seam.test.cjs` probando:
   - `src/yparty-piloto.js` y `docs/vendor/yparty-piloto.min.js` exponen `enviarComandoEconomicoTipado`;
   - sesión Owner válida dispara `sale.record` / `stock.adjust` / `credit.payment.record` / `credit.customer.payment.record` con ticket fresco one-use y verifica `receiptId`;
   - pestaña oculta, rol no dueño, PIN faltante/456/789 o licencia cambiada fallan en cerrado sin emitir red (`fallbackLegacy: true`);
   - `202` / timeout / `503` devuelven `fallbackLegacy: false`, `reconcileRequired: true`, `retryTarget: 'same-do-only'`;
   - reintento del mismo `opId` con segundo ticket fresco contra Workerd real `Tienda` DO cierra en `200 business-committed` (`duplicate: true` o aplicación única) sin duplicar stock/caja;
   - `expense.record` falla localmente sin llamar a `/ws/ticket` ni al DO.
2. **GREEN:**
   - Editar `src/yparty-piloto.js` (cambio mínimo reutilizando `dispatchTypedCommercialCommand` de `src/port2-typed-ops-client.mjs`).
   - Compilar `docs/vendor/yparty-piloto.min.js` con `NODE_PATH=cloudflare-yparty-worker/node_modules node scripts/build-yparty-piloto.cjs`.
   - Actualizar `docs/sync-yjs.js` (gancho opt-in tras doble switch QA OFF, si corresponde en el mismo corte o en C16b según coordinación con Sol6) y sellar shell + `docs/version-manifest.json`.
   - Workflow `.github/workflows/qa-port2-real-c16-typed-ops-browser.yml` con pruebas fuente + bundle compilado + Workerd real.
3. **Puntuación honesta:**
   - Solo se acredita `typed-economics/production-business-dispatch` (+3.0 pts → `84.5/100.0`) si el cableado está completo en `src/yparty-piloto.js` + bundle sellado + `docs/sync-yjs.js` (o el alcance exacto acordado con Sol6 en la rúbrica). GO comercial permanece `0/6`.
