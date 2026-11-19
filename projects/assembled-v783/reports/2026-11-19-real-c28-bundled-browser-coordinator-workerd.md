# Reporte de Verificación · PORT2 C28 P0 — Fix `-fotos` bajo `WS_OPEN_EXISTING_QA=1` + Prueba Workerd SQLite Real del Bundle Compilado (`v0.8.11`, USD 0,00)

- **Fecha:** 2026-11-19
- **PR:** [`jfcarpiopuntocom/friendly-123#824`](https://github.com/jfcarpiopuntocom/friendly-123/pull/824)
- **Rama:** `port2/20261119-c28-bundled-browser-coordinator-workerd` (base `master@d8b7372`, **CERO colisión** con PR `#823` de Sol6 ni con archivos de score)
- **Commit HEAD:** `6ed9b837401f083133ae323835a782cc5c67210c`
- **Gasto nuevo autorizado:** `USD 0,00`; cambios Cloudflare/R2: **ninguno**

## 1. Hallazgo y Fix P0 en `cloudflare-yparty-worker/src/index.js`
Al ejercitar juntos los 3 canales (`-cat`, `-ops`, `-fotos`) en Workerd SQLite real con el bundle compilado del navegador (`docs/vendor/yparty-piloto.min.js`), se detectó que cuando `WS_OPEN_EXISTING_QA === '1'` y `WS_PHOTO_BLOBS_QA === '1'`, la sala `-fotos` (que es HTTP-only SHA-256 en SQLite y no tiene importación histórica congelada Yjs) lanzaba `Error: Gate D refuses room without QA authority` dentro de `Tienda.onStart()` -> `abrirHistorialCongeladoSiAplica()`.

- **Fix mínimo Ponytail (`cloudflare-yparty-worker/src/index.js:353-358`):**
  Si `validPilot && this.env.WS_PHOTO_BLOBS_QA === '1' && room === this.env.SALA_PILOTO + '-fotos'`, retorna limpio sin saltar ninguna validación de `-cat`, `-ops` ni salas no autorizadas.

## 2. Prueba Workerd SQLite Real de Punta a Punta del Bundle Compilado (`cloudflare-yparty-worker/qa/p0-c28-bundled-browser-coordinator-workerd.test.mjs`)
Ejecuta `docs/vendor/yparty-piloto.min.js` (`window.F123YPartyPilot`) con `fake-indexeddb` real contra `Miniflare` Workerd SQLite + `authorityWorker` central real + WebSocket `ws` real:
1. Dispositivo A (Owner) activa `crearCoordinadorCorte20` -> `activate20()` (`C11 ?frozen-proof=1` + `C10` single-writer WS en `-cat` real).
2. Dispositivo A publica delta de catálogo en `-cat` real -> Dispositivo B (segundo bundle compilado lector frío `leerCatalogoPublicoCertificado`) lo recibe sin campos privados (`_meta` ausente).
3. Dispositivo A confirma venta tipada por `coordA.submitCommercial` contra `-ops` SQLite real (`stock: 5 -> 4`, `cash: 500 -> 2000`) y graba tombstone `settled_ops` C21b en IDB v2.
4. Dispositivo A (`dueno`) sube PNG por `crearClienteFotosShaCertificado().put()` a `-fotos` SQLite real y Dispositivo B (`empleado`, read-only) descarga y verifica el SHA-256 con ticket one-use `fotos:read`.
5. `pagehide` en Dispositivo A libera el lock C10, recarga de Safari sobre el mismo IDB mantiene bloqueado el `opId` en legado (`canDispatchOnLegacy === false`), y reinicio en frío de Workerd conserva `-ops` y `-fotos` en SQLite.

## 3. Evidencia Local
- `qa/p0-c28-bundled-browser-coordinator-workerd.test.mjs`: **1/1 PASS** (`2234 ms`).
- Regresión Workerd SQLite (`p0-c18a-photo-sha-client-workerd.test.mjs`, `p0-c21a-cross-device-failback-workerd.test.mjs`, `p0-c22-public-reader-writer-interoperability-workerd.test.mjs`, `p0-secure-separate-rooms.test.mjs`): **18/18 PASS** (`15/15` en `p0-secure-separate-rooms.test.mjs`).
