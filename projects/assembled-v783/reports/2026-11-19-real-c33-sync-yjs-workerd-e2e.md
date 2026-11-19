# VERIFICATION REPORT · PORT2 C33 — Prueba E2E Workerd SQLite real de `docs/sync-yjs.js` C31 (`USD 0.00`)

- **PR:** `jfcarpiopuntocom/friendly-123#828` (`port2/20261119-c33-sync-yjs-workerd-e2e`, commit `ac358e4`, base `master@f569de0`)
- **Archivos:** [`cloudflare-yparty-worker/qa/p0-c33-sync-yjs-cutover-workerd.test.mjs`](../../friendly-123/blob/master/cloudflare-yparty-worker/qa/p0-c33-sync-yjs-cutover-workerd.test.mjs), `.github/workflows/qa-port2-real-c33-sync-yjs-workerd.yml` (cero cambios en producto ni bundle).
- **Presupuesto Cloudflare/R2:** `USD 0.00` (Miniflare/Workerd local, cero despliegues, cero escrituras R2).

## Qué demuestra de punta a punta en Workerd SQLite real
1. **Corte comercial en `docs/sync-yjs.js` (`publicarOpLocal` + `API.activarCorte20Runtime`):**
   - Activa `API.activarCorte20Runtime` contra `Tienda` DO `-cat` (`?frozen-proof=1` + single-writer C10).
   - Despacha `venta`, `ajuste` y `abono` vía `publicarOpLocal` hacia `-ops` DO SQLite (`stock: 5 → 7`, `cash: 500 → 3000`, `debt: 3000 → 2000`, `effects: 3`, `receipts: 3`), dejando **`API.opsMap.size === 0`** y bloqueando replay en 1.0 incluso tras reload Safari (`C29` + `C21b`).
2. **Corte de fotos SHA sin sombra legada (`sembrarFotosAlRelay` + `API.corteFotosShaActivo === true`):**
   - Owner `dueno` ejecuta `sembrarFotosAlRelay()` extraído de `docs/sync-yjs.js`: sube PNG a `-fotos` DO SQLite, registra `{sha, bytes, tipo}` en `API.fotosRefs` y deja **`API.fotosMap.size === 0`**.
3. **Cambio de rol comercial (`API.cambiarRolComercial20` + `_instalarLectorFotoShaBajoDemanda`):**
   - Team `empleado` (IDB vacía, sin PIN Owner) cambia a `empleado` (`modoCorte20Activo === false`, `fotoSha.put === undefined`) y recupera el PNG exacto vía `window.OCFotos.leerPorHash(photoSha)` desde `-fotos` DO SQLite tras reinicio en frío de Workerd.
4. **Local:** `node --test cloudflare-yparty-worker/qa/p0-c33-sync-yjs-cutover-workerd.test.mjs` **1/1 PASS (2.64 s)**.
