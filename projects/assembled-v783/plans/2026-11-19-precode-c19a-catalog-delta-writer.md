# PRECODE · PORT2 C19a · Escritor delta certificado y de escritor único para catálogo público `-cat`

- **Fecha:** 2026-11-19
- **Rama propuesta:** `port2/20261119-c19a-catalog-delta-writer` (base `master@195aacb`)
- **Colisiones:** **CERO** (4 archivos nuevos; NO toca `docs/*`, `src/yparty-piloto.js`, `src/port2-typed-ops-idb-store.mjs` de `#808`, ni `src/port2-photo-sha-client.mjs` de `#807`).
- **Hito PORT 2.0 que desbloquea:** `browser-cutover / typed-delta-and-legacy-retirement` (`+4.0` pts) y prepara la base para `offline-failback / verified-cross-device-downpath` (`+2.0` pts).
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema raíz (enfoque Ponytail)

En `master@195aacb`:
- Ya existe C10 (bloqueo de escritor único `cat:write` en `Tienda` DO: segundo escritor recibe `1008 Catalog writer already active`), C11 (`?frozen-proof=1` certificado en SQLite), C8 (`catalog-safe-projection.mjs` + `assertPublicCatalogTransportDoc`) y C12 (`src/port2-readonly-catalog-session.mjs`, lector público solo lectura).
- Falta el módulo cliente endurecido de **escritor único de deltas tipados** sobre `-cat` que:
  1. Verifique `?frozen-proof=1` con un ticket `cat:read` one-use y `AbortController` acotado antes de abrir WebSocket.
  2. Abra un `Y.Doc` público **vacío y aislado** (nunca el `Y.Doc` privado de Sync3) usando `AuthorizedYProvider` con ticket one-use `cat:read,cat:write` distinto al del proof.
  3. Verifique paridad exacta de vista pública contra el `expectedFrozenHead` local antes de autorizar cualquier escritura.
  4. Exponga únicamente deltas tipados y validados contra la lista blanca exacta de `catalog-safe-projection.mjs` (`product.upsert`, `product.delete`, `shelf.upsert`, `shelf.delete`), rechazando en frío cualquier campo privado (`costo`, `pin`, `cliente`, `_meta`, `fotos`, `__proto__`) sin mutar ni emitir bytes.
  5. Detecte conflictos de escritor único (`1008 Catalog writer already active`) y revocaciones cerrando limpiamente sin bucles infinitos de reconexión ni degradación silenciosa.
  6. Respete `isVisible()` (pestaña oculta bloquea apertura y nuevas escrituras).

## 2. Archivos (todos NUEVOS)

1. `src/port2-catalog-delta-writer.mjs`
2. `test/p0-c19a-catalog-delta-writer.test.cjs`
3. `cloudflare-yparty-worker/qa/p0-c19a-catalog-delta-writer-workerd.test.mjs`
4. `.github/workflows/qa-port2-real-c19a-catalog-delta-writer.yml`

## 3. Plan de verificación (TDD RED → GREEN + Workerd real)

- **RED:** `node --test test/p0-c19a-catalog-delta-writer.test.cjs` falla antes de crear `src/port2-catalog-delta-writer.mjs`.
- **GREEN unitario:** 7+ pruebas P0 cubriendo proof fail-closed, dos tickets distintos (`cat:read` proof → `cat:read,cat:write` WS), paridad de línea base, rechazo fail-closed de campos privados/prototipo, deltas quirúrgicos de pocos bytes, pestaña oculta y conflicto de escritor único `1008`.
- **GREEN Workerd real (`Miniflare` + `Tienda` DO SQLite + `authorityWorker` + `AuthorizedYProvider`):**
  - Escritor Owner abre `-cat`, aplica `product.upsert`, `shelf.upsert` y `product.delete` → lector C12 recibe los deltas en vivo.
  - Segundo escritor Owner concurrente en la misma sala `-cat` es rechazado por el DO real (`1008 Catalog writer already active`) sin corromper al escritor activo.
  - Tras reinicio en frío del DO (sin fuente histórica), el catálogo actualizado persiste íntegro en SQLite del DO (`0 R2`, `USD 0,00`).
- **CI GitHub:** 100% verde en el SHA exacto del PR.
