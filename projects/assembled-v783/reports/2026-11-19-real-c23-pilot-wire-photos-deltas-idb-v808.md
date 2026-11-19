# Reporte real · PORT2 C23 · Cableado en `src/yparty-piloto.js` + bundle `esbuild 0.28.2` + `docs/sync-yjs.js` (`v0.8.08`) de C16b-store (IndexedDB), C18a (Fotos SHA Owner/Team) y C19a (Escritor Delta `-cat`)

- **Fecha:** 2026-11-19
- **PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/816
- **Rama:** `port2/20261119-c23-pilot-wire-photos-deltas-idb-v808`
- **Commit exacto verificado:** `c951981` (sobre `master@30a6519`)
- **Versión / Shell / Cache Generation:** `v0.8.08` / `f123-shell-v808` / `golden344`
- **Bundle SHA-256 (`esbuild 0.28.2`):** `9296d7f5142ba46e9e6c9ccd46bbe4a4b44db4e9bf5ae3112af22f90c4de12b9`
- **Estado de merge:** **46/46 CI PASS, 0 FAIL**, listo para auditoría y merge de Sol6 (no fusionado por Antigravity).
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema resuelto (enfoque Ponytail para mover la aguja `PORT / 100.0`)

En `master@30a6519` ya estaban fusionados y probados en Workerd real tres módulos clave de la Arquitectura 2.0:
1. `src/port2-typed-ops-idb-store.mjs` (`#803` + `#808`, almacén IndexedDB durable con `tx.oncomplete`, allowlist C15 y timeout Safari).
2. `src/port2-photo-sha-client.mjs` (`#809` C18a, cliente endurecido de fotos SHA con `createOwnerPhotoShaClient` PUT/GET y `createTeamPhotoShaReader` read-only GET).
3. `src/port2-catalog-delta-writer.mjs` (`#811` C19a + `#813` C22, escritor único certificado de deltas tipados en `-cat`).

Sin embargo, ninguno de los tres estaba aún importado en `src/yparty-piloto.js`, ni compilado dentro del bundle real `docs/vendor/yparty-piloto.min.js`, ni expuesto en `docs/sync-yjs.js` detrás del doble switch QA OFF. Por eso `scripts/architecture-2-port-score.cjs` no podía acreditarlos aún como capacidades ensambladas en el bundle entregado al navegador.

## 2. Archivos entregados (`+550/-18`, 10 archivos)

1. `src/yparty-piloto.js`:
   - `async crearAlmacenDurableOpsTipadas({ indexedDB, openTimeoutMs = 2500 })`: valida sesión `dueno` e instancia propia, deriva el namespace SHA-256 64-hex de `licencia + ':' + sala` mediante `crypto.subtle.digest` (cero claves de licencia en texto plano en IndexedDB) y devuelve `createTypedOpsIdbStore({ indexedDB, namespace, openTimeoutMs })`.
   - `crearClienteFotosShaCertificado({ fetch, timeoutMs = 6000 })`: valida instancia propia y pestaña visible; para `dueno` devuelve `createOwnerPhotoShaClient` (`PUT` + `GET` en `sala + '-fotos'`); para `admin` y `empleado` devuelve `createTeamPhotoShaReader` (solo lectura `GET`, `.put === undefined`); para `contador`/`artista`/`demo` o pestaña oculta falla cerrado (`photo sha client unavailable`). Conserva `fotoSha()` legado en `return null` para `RED ULTRA #1b`.
   - `async abrirEscritorDeltaCatalogoCertificado(privateDoc, expectedFrozenHead, { createProvider, fetch, timeoutMs = 6000, onWriterConflict = null })`: valida sesión `dueno`, instancia propia y pestaña visible, y delega en `openCertifiedPublicCatalogWriter` sobre `sala + '-cat'`.
2. `docs/vendor/yparty-piloto.min.js`: compilado determinísticamente con `esbuild 0.28.2` (`SHA-256 9296d7f5142ba46e9e6c9ccd46bbe4a4b44db4e9bf5ae3112af22f90c4de12b9`).
3. `docs/sync-yjs.js`: expone `API.crearAlmacenDurableOpsTipadas`, `API.crearClienteFotosShaCertificado` y `API.abrirEscritorDeltaCatalogoCertificado` detrás del doble switch QA OFF (`API.rollout && API.rollout.yparty === true`).
4. `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`, `docs/version-manifest.json`, `.github/workflows/qa-port2-v785-shell-seal.yml`: sellado `v0.8.08` / `f123-shell-v808` / `golden344` (`check-sw.sh` 7/7 OK).
5. `test/p0-c23-pilot-wire-photos-deltas-idb.test.cjs` + `.github/workflows/qa-port2-real-c23-pilot-wire.yml`: suite P0 `4/4 PASS` probando el bundle compilado real con `fake-indexeddb` + Workerd `C18a`, `C19a` y `C22`.

## 3. Evidencia verificada en el SHA exacto `c951981` — **46/46 CI PASS, 0 FAIL**

- `c23`: **PASS** (34s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44604937884/job/135846002695
- `seal`: **PASS** (19s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44604937470/job/135846000253
- `c12`: **PASS** (22s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44604937806/job/135846001708
- `c13`: **PASS** (16s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44604937643/job/135846002482
- `c16b-c17b`: **PASS** (26s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44604937970/job/135846002511
- `P0 Hotfix Gate`: **PASS** (1m46s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44604936869/job/135845996978
- `Release continuity gate`: **PASS**
- `yparty-worker`: **PASS**
- `Synthetic sync + real-browser contracts`: **PASS** (1m7s)
- `app`: **PASS** (55s)
- `belen-finance-browser`: **PASS** (1m1s)
- `belen-shelf-cas`: **PASS** (10s)
- `browser-parity`: **PASS** (57s)
- `two-tab-sales`: **PASS** (1m17s)
- Resto de los 46 checks: **TODOS PASS (0 FAIL)**.

## 4. Impacto en puntajes y costo

- En `master@30a6519` los marcadores oficiales permanecen en **PORT `81.5/100.0`**, **Calidad `74.9/100.0`**, **GO `0/6`** hasta que Sol6 fusione `#816` y `#815` y actualice el corte auditado.
- **Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.**
