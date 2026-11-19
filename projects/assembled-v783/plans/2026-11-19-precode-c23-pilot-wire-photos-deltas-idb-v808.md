# PRECODE · PORT2 C23 · Cablear en `src/yparty-piloto.js` + bundle `esbuild 0.28.2` + `docs/sync-yjs.js` (`v0.8.08`) los módulos C16b-store (IndexedDB), C18a (Fotos SHA Owner/Team) y C19a (Escritor Delta `-cat`)

- **Fecha:** 2026-11-19
- **Rama propuesta:** `port2/20261119-c23-pilot-wire-photos-deltas-idb-v808` (base `master@30a6519`)
- **Colisiones:** **CERO** (todas las reservas previas en Notion están en `Liberado`; no toca ninguno de los 4 archivos de `#815` C21a).
- **Hitos PORT 2.0 que ensambla en el bundle y runtime real del navegador (bajo doble switch QA OFF):**
  - `photo-sha / browser-photo-cutover` (`+2.0` pts): cablea `createOwnerPhotoShaClient` y `createTeamPhotoShaReader` (`src/port2-photo-sha-client.mjs`, `#809`) en `src/yparty-piloto.js`, `docs/vendor/yparty-piloto.min.js` y `docs/sync-yjs.js`.
  - `browser-cutover / typed-delta-and-legacy-retirement` (`+4.0` pts) y `storage / operational-switch` (`+1.5` pts): cablea `openCertifiedPublicCatalogWriter` (`src/port2-catalog-delta-writer.mjs`, `#811`) y `createTypedOpsIdbStore` (`src/port2-typed-ops-idb-store.mjs`, `#803/#808`) en `src/yparty-piloto.js`, `docs/vendor/yparty-piloto.min.js` y `docs/sync-yjs.js`.
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema raíz (enfoque Ponytail)

En `master@30a6519`:
- Ya están fusionados y probados en Workerd real los módulos:
  1. `src/port2-typed-ops-idb-store.mjs` (`#803` + `#808`, almacén IndexedDB durable con `tx.oncomplete`, allowlist C15 y timeout Safari).
  2. `src/port2-photo-sha-client.mjs` (`#809` C18a, cliente endurecido de fotos SHA con `createOwnerPhotoShaClient` PUT/GET y `createTeamPhotoShaReader` read-only GET).
  3. `src/port2-catalog-delta-writer.mjs` (`#811` C19a + `#813` C22, escritor único certificado de deltas tipados en `-cat`).
- Sin embargo, ninguno de esos 3 módulos estaba aún importado en `src/yparty-piloto.js`, ni compilado dentro del bundle real `docs/vendor/yparty-piloto.min.js`, ni expuesto en `docs/sync-yjs.js` detrás del doble switch QA OFF. Por eso `scripts/architecture-2-port-score.cjs` y la rúbrica mantenían `PORT` en `81.5/100.0`.

## 2. Cambio mínimo completo (Ponytail)

1. **`src/yparty-piloto.js`** (imports de una sola línea para compatibilidad con suites VM existentes; `fotoSha()` legado se conserva en `return null` para no romper `RED ULTRA #1b`):
   - `async crearAlmacenDurableOpsTipadas({ indexedDB = globalThis.indexedDB, openTimeoutMs = 2500 } = {})`: valida sesión `dueno` e instancia propia, deriva el namespace SHA-256 64-hex de `licencia + ':' + sala` con `crypto.subtle.digest` (cero licencias en texto plano en IndexedDB) y devuelve `createTypedOpsIdbStore({ indexedDB, namespace, openTimeoutMs })`.
   - `crearClienteFotosShaCertificado({ fetch: send = globalThis.fetch?.bind(globalThis), timeoutMs = 6000 } = {})`: valida instancia propia y `!document.hidden`. Si el rol actual es `'dueno'`, devuelve `createOwnerPhotoShaClient` (PUT/GET en `sala + '-fotos'`); si el rol actual es `'admin'` o `'empleado'`, devuelve `createTeamPhotoShaReader` (solo lectura GET en `sala + '-fotos'`, sin método `put`); cualquier otro rol (`contador`, `artista`, `demo`) o PIN faltante falla cerrado (`throw new Error('photo sha client unavailable')`).
   - `async abrirEscritorDeltaCatalogoCertificado(privateDoc, expectedFrozenHead, { createProvider, fetch: send = globalThis.fetch?.bind(globalThis), timeoutMs = 6000, onWriterConflict = null } = {})`: valida sesión `dueno`, instancia propia y `!document.hidden`, y delega en `openCertifiedPublicCatalogWriter` sobre `sala + '-cat'`.
2. **`docs/sync-yjs.js`** (detrás del doble switch QA OFF):
   - Expone `API.crearAlmacenDurableOpsTipadas`, `API.crearClienteFotosShaCertificado` y `API.abrirEscritorDeltaCatalogoCertificado` (con fallbacks fail-closed cuando el piloto está en OFF).
3. **Bundle determinista y sello `v0.8.08`:**
   - Recompila `docs/vendor/yparty-piloto.min.js` con `esbuild 0.28.2` (raíz), sube versión a `v0.8.08` / `f123-shell-v808` / `golden344` en `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`, regenera `docs/version-manifest.json` y actualiza el SHA pineado en `.github/workflows/qa-port2-v785-shell-seal.yml`.
4. **Tests y gate CI (`test/p0-c23-pilot-wire-photos-deltas-idb.test.cjs` + `.github/workflows/qa-port2-real-c23-pilot-wire.yml`):**
   - TDD RED → GREEN probando tanto `src/yparty-piloto.js` como el bundle real compilado `docs/vendor/yparty-piloto.min.js` (con `fake-indexeddb` real) y `docs/sync-yjs.js`.
