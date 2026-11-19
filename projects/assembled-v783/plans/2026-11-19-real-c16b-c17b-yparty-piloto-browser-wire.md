# PRECODE · PORT2 C16b + C17b · Cablear despacho económico tipado (`C15` + `C16a`) y tickets Team (`C17a`) en `src/yparty-piloto.js`, bundle compilado y `docs/sync-yjs.js` (`v0.8.06`)

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios Cloudflare/R2:** NINGUNO (100% local + Miniflare/Workerd CI).
- **Base:** `jfcarpiopuntocom/friendly-123` `origin/master@a9995a6` (incluye `#795` C15, `#798` C16a reconciliador async IDB, `#799` C17a Team tickets, `#800` calidad `74.1/100`, `#801` Belén #6 `v0.8.05`).
- **Coordinación con Sol6 (`C16b-S`, reserva `41d1642b-67f3-81d8-aebf-f35f5a455ded`):**
  - CERO colisión con los 3 archivos nuevos de Sol6 (`src/port2-idb-ops-store.mjs`, `test/p0-c16b-idb-ops-store.test.cjs`, `.github/workflows/qa-port2-c16b-idb-ops-store.yml`) ni con PR `#803` (`src/port2-typed-ops-idb-store.mjs`).
  - `crearDespachadorComercialTipado({ store, ... })` exige un `store` durable inyectado con `{ loadAll, save, remove }` (sin fallback volátil en memoria), compatible 100% con el adaptador IndexedDB de Sol6 (`C16b-S`) o con `#803`.

## Alcance Ponytail (archivos y contratos)
1. **`src/yparty-piloto.js`** (y recompilación determinista de **`docs/vendor/yparty-piloto.min.js`** vía `scripts/build-yparty-piloto.cjs`):
   - Importa `dispatchTypedCommercialCommand` (`./port2-typed-ops-client.mjs`), `createTypedOpsReconciler` (`./port2-typed-ops-reconciler.mjs`) y `createTeamTicketParams` (`./ws-team-ticket-params.mjs`).
   - Expone **`crearDespachadorComercialTipado({ store, fetch, timeoutMs, maxAttempts, maxPending, baseDelayMs, maxDelayMs, onSettled })`**:
     - Valida `f123_owned` (`licenseCode === licencia`, `instanceId` 6..120), `sala` 32-hex y exige `store` durable (`loadAll/save/remove`; jamás memoria volátil).
     - En cada intento lee `OCAuth.rolActual() === 'dueno'` + PIN transitorio `OCSecure.leerPinQueAbre().owner` (nunca `456`/`789`, nunca almacenado en `localStorage`/URL/logs).
     - Compone `createTypedOpsReconciler` + `dispatchTypedCommercialCommand` contra `sala + '-ops'` en el Worker QA fijado.
     - Engancha `visibilitychange` (pausa al ocultarse, reanuda al volver visible) y `pageshow` (`e.persisted` BFCache: pausa y reanuda limpio); `destroy()` limpia listeners y timers.
   - Expone **`solicitarTicketComercialEquipo(scope, { fetch } = {})`**:
     - Valida `f123_owned`, `sala` 32-hex y `!document.hidden`.
     - Deriva sala exacta (`-ops` para `ops:sale|ops:adjust|ops:payment`; `-fotos` para `fotos:read`).
     - Lee credenciales transitorias de equipo desde `OCAuth.rolActual()` (`'admin' | 'empleado'`) + `OCSecure.leerPinQueAbre().team` (`{ subject, pin }`) y delega a `createTeamTicketParams(...)()`.
     - Rechaza en cerrado `empleado`+`ops:adjust`, `contador`/`artista`/`demo`, `-cat`/`-priv`/`ops:read`/`fotos:write` con **0 red**.
   - Conserva intactos `leerCatalogoPublicoCertificado(...)`, `fotoSha()` (fail-closed `#765`) y `canal(...)` (fail-closed a `usarRelayHabitual()`).
2. **`docs/sync-yjs.js`:**
   - Detrás del mismo doble switch QA de C13 (`piloto` solo existe si `docs/sync-rollout.json` lo autoriza — hoy **OFF**), expone `API.crearDespachadorComercialTipado(opc)` y `API.solicitarTicketComercialEquipo(scope, opc)`. Cuando `piloto` es `null` (todos los clientes actuales), devuelven `null` / rechazo fail-closed sin tocar el transporte legado.
3. **Sellado de shell:** `v0.8.06` / `f123-shell-v806` / `golden342` (`docs/sw.js`, `docs/version.json`, `docs/dashboard.html`, `docs/version-manifest.json`).
4. **Métricas:** NO modificamos `architecture-2-port-score.json` en esta PR (Sol6 audita y acredita el salto tras verificación en SHA exacto, respetando su regla en `C16b-S`).

## Plan TDD (RED → GREEN → Bundle compilado → Workerd real)
- **RED:** `test/p0-c16b-c17b-browser-pilot-wire.test.cjs` verifica en **fuente**, en **`docs/vendor/yparty-piloto.min.js` compilado** y en **`docs/sync-yjs.js`**:
  1. `crearDespachadorComercialTipado` exige `store` durable (rechaza sin store), persiste `opId` antes del HTTP, bloquea fallback legado tras `202`/timeout/`5xx` y reconcilia el mismo `opId` al volver visible / tras recarga.
  2. `solicitarTicketComercialEquipo` emite tickets one-use para `admin` (`ops:sale`/`ops:adjust`/`ops:payment`/`fotos:read`) y `empleado` (`ops:sale`/`ops:payment`/`fotos:read`), rechaza `empleado`+`ops:adjust`, `contador`/`artista`, `-cat`/`-priv`/`fotos:write` con 0 red, y falla si `document.hidden`.
  3. `docs/sync-yjs.js` solo expone los hooks cuando el piloto QA está habilitado; con rollout OFF devuelve fail-closed y mantiene el relay legado 100% intacto.
  4. Todas las pruebas previas (`p0-c12-browser-pilot-readonly-seam`, `p0-yparty-client-real-tickets`, `p0-yparty-client-built-bundle`, `p0-c13-browser-certified-reader-wire`) siguen 100% VERDES.
- **Workerd real:** `.github/workflows/qa-port2-real-c16b-c17b-pilot-wire.yml` corre build determinista de `docs/vendor/yparty-piloto.min.js`, `gen-manifest.js`, `check-sw.sh`, pruebas unitarias+bundle y prueba end-to-end contra `Tienda` DO en Workerd real!
