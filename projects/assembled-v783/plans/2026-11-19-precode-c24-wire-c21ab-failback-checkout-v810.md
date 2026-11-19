# PRECODE · PORT2 C24 · Cablear el coordinador C21a+C21b (`port2-cross-device-failback.mjs`) y la valla anti-duplicación de checkout (`publicarOpLocal`) en `src/yparty-piloto.js` + bundle `esbuild 0.28.2` + `docs/sync-yjs.js` (`v0.8.10`)

- **Fecha:** 2026-11-19
- **Rama propuesta:** `port2/20261119-c24-wire-c21ab-failback-checkout-v810` (base `master@10f6004`)
- **Colisiones:** **CERO** (no hay ninguna otra PR activa en `friendly-123`; `#816` y `#817` ya están fusionadas en `master@10f6004`).
- **Problema que cierra definitivamente (nota explícita en `afc3526` / `v0.8.09`):**
  > *"Incluye el componente C21a de failback en src, pendiente de conexión al checkout comercial."*
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Causa raíz (enfoque Ponytail — cerrar todos los módulos `src/port2-*.mjs` sin abrir frentes nuevos)

Tras `#816` (`v0.8.08`) y `#817` (`v0.8.09`), `src/port2-cross-device-failback.mjs` (con el tombstone atómico IndexedDB v2 `settled_ops` de C21b) es el **único** módulo `src/port2-*.mjs` que falta por importar en `src/yparty-piloto.js`, compilar en `docs/vendor/yparty-piloto.min.js` y conectar a la valla de publicación comercial (`publicarOpLocal`) en `docs/sync-yjs.js`.

## 2. Cambio mínimo completo

1. **`src/yparty-piloto.js`**:
   - Importa en una sola línea `import {createVerifiedCrossDeviceFailbackCoordinator} from './port2-cross-device-failback.mjs';`.
   - Expone `async crearCoordinadorCorteYFailback({ store, indexedDB, openTimeoutMs = 2500, privateDoc, expectedFrozenHead, modoCatalogo = 'escritor', createProvider, fetch, timeoutMs = 6000, maxAttempts = 5, maxPending = 64, baseDelayMs = 800, maxDelayMs = 15000, onSettled = null, onModeChange = null } = {})`:
     - Usa el `store` inyectado o crea el almacén durable IndexedDB v2 mediante `await this.crearAlmacenDurableOpsTipadas({ indexedDB, openTimeoutMs })` (que incluye `loadCommittedOpIds()` / `settled_ops` de C21b).
     - Construye el reconciliador mediante `this.crearDespachadorComercialTipado({ store: durableStore, ... })`.
     - Conecta `openCatalogSession` a `abrirEscritorDeltaCatalogoCertificado` (o `leerCatalogoPublicoCertificado` si `modoCatalogo === 'lector'`).
     - En `visibilitychange` (cuando `document.hidden === true`) y `pageshow.persisted` (Safari BFCache), ejecuta `failbackToLegacy('tab-hidden' | 'bfcache-persisted')` para liberar de inmediato cualquier lock C10 de `-cat` en el Durable Object mientras preserva intacta la cola IndexedDB `same-do-only` y las lápidas `settled_ops`.
2. **`docs/sync-yjs.js` (detrás del doble switch QA OFF):**
   - Expone `API.crearCoordinadorCorteYFailback`, `API.despacharOpComercialCertificada` y `API.puedeDespacharOpEnLegado`.
   - En `publicarOpLocal(op)`:
     - Cuando `API.coordinadorCorteYFailback` es `null` (por defecto en OFF), mantiene intacta la ruta síncrona actual (`if (!API.opsMap.get(op.opId)) API.opsMap.set(op.opId, op)`).
     - Cuando `API.coordinadorCorteYFailback` está activo, verifica `API.coordinadorCorteYFailback.canDispatchOnLegacy(op.opId)` antes de tocar `API.opsMap`: si el `opId` ya está enganchado en `pending_ops` o confirmado en `settled_ops` (incluso tras recargar Safari), **bloquea** su publicación en `API.opsMap` (legacy 1.0), eliminando cualquier posibilidad de venta duplicada entre 2.0 y 1.0.
3. **Bundle determinista y sello `v0.8.10` (`f123-shell-v810` / `golden346`):**
   - Recompila `docs/vendor/yparty-piloto.min.js` con `esbuild 0.28.2`, actualiza `.github/workflows/qa-port2-v785-shell-seal.yml`, `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`, `docs/version-manifest.json` y verifica `check-sw.sh` 7/7 OK.
