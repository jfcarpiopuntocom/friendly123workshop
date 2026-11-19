# Reporte de Verificación · PORT2 C27 (`v0.8.11`) — Corte Runtime en `docs/sync-yjs.js` (Valla `publicarOpLocal` C21a/C21b + Fotos SHA por Rol, USD 0,00)

- **Fecha:** 2026-11-19
- **PR:** [`jfcarpiopuntocom/friendly-123#822`](https://github.com/jfcarpiopuntocom/friendly-123/pull/822)
- **Rama:** `port2/20261119-c27-sync-yjs-runtime-cutover-v811` (base `master@ac77da0`, `PORT 83,5/100,0`, `Calidad 75,6/100,0`, `GO 0/6`)
- **Commit HEAD:** `b82ea4cb14e313ad5503e1672f3c78d51e178454`
- **Sellado:** `v0.8.11` / `f123-shell-v811` / `golden347` (bundle `docs/vendor/yparty-piloto.min.js` intacto con SHA-256 `a45e716d95a880ca0338df1d78a433014e196813baa97294492ec846e455ccc2` de C25 `v0.8.10`)
- **Gasto nuevo autorizado:** `USD 0,00`; cambios Cloudflare/R2: **ninguno**

## 1. Cambios Mínimos y Completos (Ponytail `full`)
1. **Valla anti-duplicación C21a+C21b en `publicarOpLocal(op)` + instancia activa `API.coordinadorCorte20` (`docs/sync-yjs.js`):**
   - `API.crearCoordinadorCorte20(docPrivado, headCongelado, opc)` registra la instancia activa en `API.coordinadorCorte20` (destruyendo cualquier instancia previa si se recrea) y expone `API.despacharOpComercialCertificada(comando)` y `API.puedeDespacharOpEnLegado(opId)`.
   - En `publicarOpLocal(op)`, cuando `API.coordinadorCorte20` está activo, consulta `coordActual.canDispatchOnLegacy(op.opId)` antes de insertar en `API.opsMap`. Cualquier `opId` enganchado (`sameDoLocked: true`) o confirmado (`settled_ops` C21b) en 2.0 queda bloqueado irreversiblemente en `API.opsMap`, incluso después de un failback a `1.0` y de recargar Safari sobre el mismo IndexedDB.
   - Con el doble switch QA OFF (`API.coordinadorCorte20 === null`), `publicarOpLocal(op)` conserva intacta la ruta síncrona 1.0 (`API.opsMap.set(op.opId, op)`).
2. **Activación por rol de fotos SHA (`API.activarClienteFotosShaCertificado`) + guardia Team en `sembrarFotosAlRelay` (`docs/sync-yjs.js`):**
   - Conserva `piloto.fotoSha() === null` y `API.fotoSha === null` en el arranque por defecto (`RED ULTRA #1b` intacto).
   - `API.activarClienteFotosShaCertificado(opc)` invoca `piloto.crearClienteFotosShaCertificado(opc)` (Owner `dueno` con `{ put, get }` y scopes `fotos:write`/`fotos:read`; Team `admin`/`empleado` con solo `{ get }` read-only y scope `fotos:read`), asigna `API.fotoSha` e instala el lector bajo demanda sobre `window.OCFotos.leerPorHash`.
   - En `sembrarFotosAlRelay()`, protege `bridgeFotoInicial.put(hash, dataUrl)` con `typeof bridgeFotoInicial.put === "function"` para que los dispositivos Team read-only jamás intenten `PUT`.

## 2. Evidencia TDD RED → GREEN
- **RED:** `node --test test/p0-c27-sync-yjs-runtime-cutover.test.cjs` → `0/3 PASS` antes de cablear `docs/sync-yjs.js`.
- **GREEN:** `node --test test/p0-c27-sync-yjs-runtime-cutover.test.cjs test/p0-c25-browser-coordinator-factory.test.cjs test/p0-c23-pilot-wire-photos-deltas-idb.test.cjs test/p0-yparty-photo-sha-browser.test.cjs test/p0-yparty-ultrareview-catalog-boundaries.test.cjs test/p0-architecture-2-port-score.test.cjs` → **20/20 PASS, 0 FAIL**.
- **Shell Integrity (`check-sw.sh`):** **7/7 OK** (`f123-shell-v811` / `-golden347`).
- **Score Gate (`node scripts/architecture-2-port-score.cjs`):** `APP REAL 6b59f6667105d0366507c6f7f2d77b692e28262f | PORT 83.5/100 (+15.0 vs post-D7) | calidad 75.6/100 (+0.2) | GO 0/6`.
