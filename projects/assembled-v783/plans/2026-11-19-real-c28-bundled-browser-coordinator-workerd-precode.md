# PRECODE · PORT2 C28 — Prueba Workerd SQLite Real de Punta a Punta del Bundle Compilado (`docs/vendor/yparty-piloto.min.js`: `crearCoordinadorCorte20` + Delta `-cat` + Venta `-ops` + Foto SHA Owner→Team + `pagehide`/Reload Safari, USD 0,00)

- **Fecha:** 2026-11-19
- **Rama:** `port2/20261119-c28-bundled-browser-coordinator-workerd` (base `master@ac77da0`; **CERO colisión** con PR `#822` ni con archivos de score)
- **Archivos exclusivos (2 archivos nuevos):**
  1. `cloudflare-yparty-worker/qa/p0-c28-bundled-browser-coordinator-workerd.test.mjs`
  2. `.github/workflows/qa-port2-real-c28-bundled-browser-workerd.yml`
- **Gasto nuevo autorizado:** `USD 0,00`; cambios Cloudflare/R2: **ninguno**.

## 1. Por qué cierra la evidencia Workerd del ensamblaje en navegador
En C25 (`#820`), `test/p0-c25-browser-coordinator-factory.test.cjs` probó el bundle compilado `docs/vendor/yparty-piloto.min.js` (`crearCoordinadorCorte20`) contra un `fetchImpl` sintético en `node:vm`.
C28 ejecuta el **bundle real compilado `docs/vendor/yparty-piloto.min.js`** (`window.F123YPartyPilot`) dentro de contextos `node:vm` de navegador con `fake-indexeddb` real contra una instancia **Workerd real (`Miniflare` con Durable Objects SQLite `-cat`, `-ops`, `-fotos` + `authorityWorker` central real + WebSocket `ws` real)** a través de 2 dispositivos:
1. **Dispositivo A (VM navegador Owner PC):** instancia `pilotA = window.F123YPartyPilot(roomId, LICENSE)`, ejecuta `coordA = await pilotA.crearCoordinadorCorte20(privateDocA, HEAD, { indexedDB: idbA, createProvider })` y `await coordA.activate20()`, certificando `?frozen-proof=1` (C11) y tomando el lock single-writer C10 por WebSocket real contra `Tienda` DO `-cat`.
2. **Delta `-cat` escritor → lector frío entre VMs del bundle real:** Dispositivo A aplica `coordA.applyCatalogDelta({ kind: 'product.upsert', product: ... })` que viaja por WebSocket real al DO `-cat` SQLite; Dispositivo B (segunda VM ejecutando el bundle real `docs/vendor/yparty-piloto.min.js`) ejecuta `pilotB.leerCatalogoPublicoCertificado(docB, HEAD, { createProvider })` y recibe el producto nuevo sin ningún campo privado (`_meta`).
3. **Venta tipada `-ops` SQLite + tombstone C21b `settled_ops`:** Dispositivo A ejecuta `await coordA.submitCommercial(sale)` desde el bundle real hacia `-ops` DO SQLite (`committed: true`, `stock: 5 -> 4`, `cash: 500 -> 2000`), grabando el tombstone atómico en `settled_ops` (IDB v2).
4. **Fotos SHA Owner `PUT` → Team (`empleado`) `GET` en `-fotos` SQLite real:** Dispositivo A sube un PNG por `await pilotA.crearClienteFotosShaCertificado().put(photoSha, dataUrl)` al DO `-fotos` SQLite; Dispositivo B en rol `empleado` (Team read-only, `put === undefined`) obtiene ticket one-use `fotos:read` del `authorityWorker` central real y descarga/verifica el PNG exacto por `await pilotB.crearClienteFotosShaCertificado().get(photoSha)`.
5. **`pagehide` + Reload de Safari + Reinicio en frío de Workerd SQLite:** Dispositivo A dispara `pagehide` (liberando el lock C10 en `-cat` en Workerd real), recarga Safari sobre el mismo `idbA` (`reloadedPilotA.crearCoordinadorCorte20`), verifica que `canDispatchOnLegacy(sale.opId) === false` (`assertLegacyAllowed` rechaza `latched-same-do-only`), y tras reiniciar Workerd en frío sobre el mismo directorio SQLite (`--persist-to`), `-ops` y `-fotos` conservan intactos la venta única y los bytes de la foto.
