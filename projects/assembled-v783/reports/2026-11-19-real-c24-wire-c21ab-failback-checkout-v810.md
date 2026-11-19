# Reporte real · PORT2 C24 · Cableado del coordinador C21a+C21b (`port2-cross-device-failback.mjs`) y valla anti-duplicación `publicarOpLocal` en `src/yparty-piloto.js` + bundle `esbuild 0.28.2` + `docs/sync-yjs.js` (`v0.8.10`)

- **Fecha:** 2026-11-19
- **PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/819
- **Rama:** `port2/20261119-c24-wire-c21ab-failback-checkout-v810`
- **Commit exacto verificado:** `4ef84f4` (sobre `master@10f6004`, 0 colisiones con `#818` de Sol6)
- **Versión / Shell / Cache Generation:** `v0.8.10` / `f123-shell-v810` / `golden346`
- **Bundle SHA-256 (`esbuild 0.28.2`):** `3e1feeeb0822df79fc7b4ba2337d963baf9999a54d8cbc1e3d8ad1db483d0c09`
- **Estado de merge:** **46/46 CI PASS, 0 FAIL**, listo para auditoría y merge de Sol6 (no fusionado por Antigravity).
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema cerrado (enfoque Ponytail — 0 módulos `src/port2-*.mjs` sin ensamblar)

En `master@10f6004` (`v0.8.09`, commit `afc3526`), la nota de lanzamiento dejaba registrado el último eslabón pendiente:
> *"Incluye el componente C21a de failback en src, pendiente de conexión al checkout comercial."*

Con este PR (`v0.8.10`), **todos** los módulos `src/port2-*.mjs` del repositorio quedan importados en `src/yparty-piloto.js`, compilados en el bundle real del navegador `docs/vendor/yparty-piloto.min.js` y conectados en `docs/sync-yjs.js` (incluyendo la valla anti-duplicación sobre `publicarOpLocal` respaldada por `pending_ops` + las lápidas atómicas `settled_ops` de C21b en IndexedDB v2).

## 2. Archivos entregados (`+251/-18`, 10 archivos, 0 archivos sueltos nuevos)

1. `src/yparty-piloto.js`:
   - Importa en una sola línea `import {createVerifiedCrossDeviceFailbackCoordinator} from './port2-cross-device-failback.mjs';`.
   - Expone `async crearCoordinadorCorteYFailback({ store, indexedDB, openTimeoutMs = 2500, privateDoc, expectedFrozenHead, modoCatalogo = 'escritor', createProvider, fetch, timeoutMs = 6000, maxAttempts = 5, maxPending = 64, baseDelayMs = 800, maxDelayMs = 15000, onSettled = null, onModeChange = null })`:
     - Usa el `store` inyectado o crea el almacén durable IndexedDB v2 mediante `await this.crearAlmacenDurableOpsTipadas({ indexedDB, openTimeoutMs })` (`pending_ops` + `settled_ops` tombstones de C21b).
     - Construye el reconciliador comercial tipado mediante `this.crearDespachadorComercialTipado({ store: durableStore, ... })`.
     - Conecta `openCatalogSession` a `abrirEscritorDeltaCatalogoCertificado` (o `leerCatalogoPublicoCertificado` cuando `modoCatalogo === 'lector'`).
     - En `visibilitychange` (`document.hidden === true`) y `pageshow.persisted` (Safari BFCache), ejecuta `failbackToLegacy('tab-hidden' | 'bfcache-persisted')` liberando de inmediato cualquier lock C10 de `-cat` en el Durable Object mientras preserva intactos los `opId`s pendientes y las lápidas `settled_ops`.
2. `docs/sync-yjs.js`:
   - Expone `API.crearCoordinadorCorteYFailback`, `API.despacharOpComercialCertificada` y `API.puedeDespacharOpEnLegado` detrás del doble switch QA OFF (`API.rollout && API.rollout.yparty === true`).
   - En `publicarOpLocal(op)`: cuando `API.coordinadorCorteYFailback` es `null` (por defecto en OFF), mantiene sin cambios la ruta síncrona actual (`if (!API.opsMap.get(op.opId)) API.opsMap.set(op.opId, op)`). Cuando `API.coordinadorCorteYFailback` está activo, consulta `canDispatchOnLegacy(op.opId)` y **bloquea** la publicación en `API.opsMap` (legacy 1.0) de cualquier `opId` enganchado en `pending_ops` o confirmado en `settled_ops` (incluso tras recargar Safari).
3. `docs/vendor/yparty-piloto.min.js`, `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`, `docs/version-manifest.json`, `.github/workflows/qa-port2-v785-shell-seal.yml`: sellado `v0.8.10` / `f123-shell-v810` / `golden346` (`check-sw.sh` 7/7 OK).
4. `test/p0-c23-pilot-wire-photos-deltas-idb.test.cjs` + `.github/workflows/qa-port2-real-c23-pilot-wire.yml`: ampliado a **5/5 PASS** (incluyendo prueba del bundle compilado real con `fake-indexeddb` verificando que el tombstone `settled_ops` de C21b bloquea el reenvío por legacy tras recargar Safari) + suite Workerd `p0-c21a-cross-device-failback-workerd.test.mjs`.

## 3. Evidencia verificada en el SHA exacto `4ef84f4` — **46/46 CI PASS, 0 FAIL**

- `c23` (incluyendo C24 + Workerd C18a/C19a/C21a/C22): **PASS** (39s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44611679555/job/135869643069
- `seal`: **PASS** (18s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44611679626/job/135869643724
- `P0 Hotfix Gate`: **PASS**
- `Release continuity gate`: **PASS**
- `Synthetic sync + real-browser contracts`: **PASS**
- `yparty-worker`: **PASS**
- Resto de los 46 checks: **TODOS PASS (0 FAIL)**.

## 4. Impacto en puntajes y costo

- Con `#818` de Sol6 (12/12 CI PASS sobre `master@10f6004`), el marcador auditado sube de **PORT `81.5 → 83.0/100.0` (`+1.5`)** y **Calidad `74.9 → 75.4/100.0` (`+0.5`)**, **GO `0/6`**.
- Una vez que Sol6 fusione `#818` y `#819` (`v0.8.10`), queda también ensamblado en el bundle y en `docs/sync-yjs.js` el coordinador `offline-failback / verified-cross-device-downpath` (`+2.0` pts).
- **Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.**
