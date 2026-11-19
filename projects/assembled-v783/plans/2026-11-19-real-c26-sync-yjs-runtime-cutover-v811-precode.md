# PRECODE · PORT2 C26 (`v0.8.11`) — Corte Runtime en `docs/sync-yjs.js` (Coordinador C25 + Fotos SHA C18a detrás del doble switch QA OFF, USD 0,00)

- **Fecha:** 2026-11-19
- **Repositorio destino (tras merge de PR #820 `v0.8.10`):** `jfcarpiopuntocom/friendly-123`
- **Gasto nuevo autorizado:** `USD 0,00`; cambios Cloudflare/R2: **ninguno** (acata `ORDEN JFC · R2/Cloudflare CERO GASTOS`, `41d1642b-67f3-8156-a1be-eabf03acf607`).
- **Disciplina:** Ponytail nivel `full` 100% del tiempo. Cero módulos nuevos `src/port2-*.mjs` (solo cerrar y conectar los módulos ya probados en Workerd y compilados en el bundle `docs/vendor/yparty-piloto.min.js`).

## 1. Objetivo y Hitos de `architecture-2-port-score.json`
Con C23 (`#816`, `v0.8.08`), C21a+C21b (`#817`, `v0.8.09`) y C25 (`#820`, `v0.8.10`), todos los módulos `src/port2-*.mjs` están ensamblados en `src/yparty-piloto.js` y compilados en `docs/vendor/yparty-piloto.min.js`.

Para cerrar los hitos de cliente pendientes en `docs/engineering/architecture-2-port-score.json` (sin tocar R2/Cloudflare):
1. **`typed-economics/production-business-dispatch` (`+3,0` pts)** y **`browser-cutover/typed-delta-and-legacy-retirement` (`+2,5` pts)**:
   - En `docs/sync-yjs.js`, cuando el doble switch QA está activo y el coordinador `API.coordinadorCorte20` ha sido activado explícitamente (`API.activarCoordinadorCorte20`), `publicarOpLocal(op)` consulta `API.coordinadorCorte20.canDispatchOnLegacy(op.opId)`:
     - Si el `opId` ya fue enganchado (`sameDoLocked: true`) o confirmado (`settled_ops` C21b) en 2.0, **nunca** se escribe en `API.opsMap` (retiro efectivo del duplicado en ruta 1.0 legado, incluso tras recargar Safari).
     - Si el coordinador está en modo `active-2.0` y se despacha un comando tipado por `API.despacharOpComercial20(comando)`, se confirma contra `-ops` SQLite y queda bloqueado irreversiblemente en `API.opsMap`.
     - Con el doble switch QA OFF (valor por defecto en `docs/sync-rollout.json`), `publicarOpLocal(op)` conserva exactamente la ruta síncrona 1.0 (`API.opsMap.set(op.opId, op)`).
2. **`photo-sha/browser-photo-cutover` (`+2,0` pts)** y **`identity-rooms/commercial-role-switch` (`+1,5` pts)**:
   - Mantener `piloto.fotoSha() === null` (para `RED ULTRA #1b` en `test/p0-yparty-ultrareview-catalog-boundaries.test.cjs`).
   - En `docs/sync-yjs.js`, conectar `API.activarClienteFotosShaCertificado()` a `piloto.crearClienteFotosShaCertificado()`, asignando `API.fotoSha` al cliente endurecido por rol (Owner `dueno` con `put` + `get`; Team `admin`/`empleado` con solo `get` read-only y `put === undefined`), que alimenta `sembrarFotosAlRelay()` y la lectura bajo demanda en `window.OCFotos.leerPorHash(hash)`.

## 2. Verificación TDD RED → GREEN
- Test focal `test/p0-c26-sync-yjs-runtime-cutover.test.cjs` probando sobre `docs/sync-yjs.js` y `docs/vendor/yparty-piloto.min.js`:
  1. Con QA OFF, `publicarOpLocal` escribe en `API.opsMap` sin tocar 2.0 y `piloto.fotoSha()` sigue siendo `null`.
  2. Con `API.coordinadorCorte20` activo, un `opId` despachado o enganchado en 2.0 (incluyendo tras reload de Safari con tombstone `settled_ops` C21b) queda bloqueado en `publicarOpLocal` y no entra a `API.opsMap`, mientras que un `opId` legado no tocado por 2.0 sí pasa en modo `failback-legacy-1.0`.
  3. Con `API.activarClienteFotosShaCertificado()`, Owner obtiene `{ role: 'owner', put, get }` y Team (`admin`/`empleado`) obtiene `{ role: 'team', get }` sin `put`.
