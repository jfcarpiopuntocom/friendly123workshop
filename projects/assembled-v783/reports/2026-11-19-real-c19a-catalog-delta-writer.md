# Reporte real · PORT2 C19a · Escritor delta certificado y de escritor único para catálogo público `-cat` (Workerd DO SQLite)

- **Fecha:** 2026-11-19
- **PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/811
- **Rama:** `port2/20261119-c19a-catalog-delta-writer`
- **Commit exacto verificado:** `beb8d03` (sobre `master@8bdbf32`)
- **Estado de merge:** 14/14 CI PASS, listo para auditoría y merge de Sol6 (0 colisiones con C20 de Sol6; no fusionado por Antigravity).
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema resuelto (enfoque Ponytail)

Hasta `master@8bdbf32`:
- El Worker real (`cloudflare-yparty-worker/src/index.js`) y `Tienda` DO ya implementaban el bloqueo de escritor único C10 (`1008 Catalog writer already active`), la prueba certificada de HEAD C11 (`?frozen-proof=1`), la lista blanca canónica C8 (`catalog-safe-projection.mjs` + `assertPublicCatalogTransportDoc`) y el proveedor autenticado C9 (`AuthorizedYProvider`), además del lector solo lectura C12 (`src/port2-readonly-catalog-session.mjs`).
- Faltaba el módulo cliente endurecido de **escritor único de deltas tipados** sobre `-cat` (`src/port2-catalog-delta-writer.mjs`) para publicar cambios quirúrgicos de productos y perchas sin exponer jamás el `Y.Doc` privado de Sync3, sin reenviar snapshots completos y sin abrir bucles de reconexión ante conflicto de escritor único (`1008`).

## 2. Archivos entregados (4 archivos nuevos, 0 colisiones)

1. `src/port2-catalog-delta-writer.mjs`:
   - Verifica primero `?frozen-proof=1` con un ticket one-use `cat:read` (`catalogReadOnly: true`) y `AbortController` acotado (`200..12000 ms`).
   - Solicita un segundo ticket one-use distinto `cat:read,cat:write` y abre un `Y.Doc` público **vacío y aislado** mediante `AuthorizedYProvider`.
   - Materializa únicamente las raíces públicas permitidas (`productos`, `ubicaciones`) tras el cold-join Yjs antes de ejecutar `assertPublicCatalogTransportDoc` y verificar paridad exacta de vista contra la proyección local del `expectedFrozenHead`.
   - `applyDelta(delta)` acepta exclusivamente deltas tipados (`product.upsert`, `product.delete`, `shelf.upsert`, `shelf.delete`) validados en un `Y.Doc` temporal con `assertPublicCatalogTransportDoc` antes de tocar `publicDoc`: cualquier campo privado (`costo`, `pin`, `cliente`, `fotos`, `_meta`) o clave de prototipo (`__proto__`, `constructor`, `prototype`) lanza `TypeError` con **0 bytes** mutados o emitidos.
   - Ante cierre `1008` (`Catalog writer already active` o revocación) o `authorization-error`, desactiva y cierra el escritor limpiamente sin bucle de reconexión y notifica `onWriterConflict`.
   - Respeta `isVisible()` tanto antes de abrir (0 peticiones de red si la pestaña está oculta) como en cada `applyDelta()`.
2. `test/p0-c19a-catalog-delta-writer.test.cjs`: 8 pruebas unitarias P0 (con fallback a `docs/vendor/yjs-bundle.min.js` cuando los gates de raíz corren sin `cloudflare-yparty-worker/node_modules`).
3. `cloudflare-yparty-worker/qa/p0-c19a-catalog-delta-writer-workerd.test.mjs`: prueba real en **Miniflare/Workerd** contra `Tienda` DO SQLite + `authorityWorker` + `AuthorizedYProvider` real:
   - Escritor Owner abre `-cat`, publica `product.upsert`, `shelf.upsert` y `product.delete` (< 512 bytes por delta) y un lector `cat:read` los recibe en vivo.
   - Intento con campo privado `costo` es rechazado con `TypeError` y nunca llega al DO ni al lector.
   - Segundo escritor certificado concurrente en la misma sala `-cat` es rechazado por el DO real (C10) sin afectar al escritor activo.
   - Reinicio en frío completo del DO (con la fuente histórica apagada) conserva todos los deltas en SQLite del DO (`0 R2`, `USD 0,00`).
4. `.github/workflows/qa-port2-real-c19a-catalog-delta-writer.yml`: gate dedicado `c19a`.

## 3. Hallazgo P0 colateral detectado gracias a Workerd real (reportado a Sol6 → C20)

Al probar contra el servidor Yjs real en Workerd, descubrimos que las raíces remotas de un `Y.Doc` recién sincronizado llegan como `AbstractType` sin tipar hasta la primera llamada a `doc.getMap(...)`, provocando que `assertPublicCatalogTransportDoc` lance `invalid source map` en `openCertifiedReadOnlyPublicCatalog` (C12, cuyas pruebas previas usaban un provider sintético que llamaba `getMap()`).
- En C19a quedó resuelto de raíz ligando `publicDoc.getMap('productos')` y `publicDoc.getMap('ubicaciones')` antes del validador.
- Reportado en la descripción del PR #811; Sol6 ya abrió la reserva **C20** (`41d1642b-67f3-81ba-8ecc-c0a1b6f3b0bd`) para aplicar el mismo fix en C12 con prueba Workerd real.

## 4. Evidencia verificada en el SHA exacto `beb8d03` — **14/14 CI PASS, 0 FAIL**

- `c19a`: **PASS** (31s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598720070/job/135823984352
- `yparty-worker`: **PASS** (2m0s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719769/job/135823984028
- `P0 Hotfix Gate`: **PASS** (1m19s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719824/job/135824031656
- `Release continuity gate`: **PASS** (1m15s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719572/job/135824033243
- `Synthetic sync + real-browser contracts (no customer data)`: **PASS** (57s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719692/job/135824033371
- `app`: **PASS** (53s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719769/job/135823985130
- `gate-d-real-app`: **PASS** (44s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719587/job/135823982308
- `hex-boundary`: **PASS** (33s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719896/job/135823983922
- `two-tab-sales`: **PASS** (1m17s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44598719780/job/135823983471
- `twice`: **PASS** (15s)
- `private-health`: **PASS** (14s)
- `integrated`: **PASS** (9s)
- `mixed-shell`: **PASS** (6s)
- `Workers Builds: friendly-123`: **PASS**

## 5. Estado de puntajes y costo

- En `master@8bdbf32` (tras `#810`): **PORT `81.5/100.0`**, **Calidad `74.6/100.0` (`+0.5`)**, **GO `0/6`**.
- **Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.**
