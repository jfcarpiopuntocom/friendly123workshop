# PRECODE · P0 Belén #6 · Alinear `_huellaPublicable()` con `_estadoParaGuardarSinFotos()` en `docs/mock-backend.js`

- **Fecha:** 2026-11-19
- **Origen:** Apéndice Adversarial de Belén (hallazgo #6) · verificado vivo en `jfcarpiopuntocom/friendly-123` `origin/master@673edca`.
- **Estado de ejecución:** PRECODE preparado — **espera a que Sol6 fusione PR #796 (`v0.8.04`)** antes de abrir rama/PR para evitar colisión de sellado de shell (`v0.8.05`).

## Bug exacto verificado en `docs/mock-backend.js`
1. Línea 1731–1732 (`_guardarEstadoLocalAhora`):
   ```js
   const crudo = JSON.stringify(_estadoParaGuardarSinFotos(vivo));
   const completo = JSON.parse(crudo);
   ```
   Cuando un producto o percha tiene `fotoHash` y `OCFotos.tieneFotoHashConfirmadoEnIdb(item.fotoHash, item.foto) === true`, `_estadoParaGuardarSinFotos(vivo)` poda el `data:image/...` redundante de `item.foto` (preservando `fotoHash` y `fotoRev`).
2. Línea 1751 (`terminar`):
   ```js
   _estadoPublicableConfirmado = completo;
   ```
   `_estadoPublicableConfirmado` queda guardado **sin** los `data:image/...` confirmados en IDB.
3. Líneas 1473–1486 (`_huellaPublicable` y `_estadoPuedePublicarse`):
   ```js
   function _huellaPublicable(estado = estadoActualExportable()) {
     const { _rev, _abCommit, ...datos } = estado;
     return JSON.stringify(datos);
   }
   ```
   Cuando hay un segundo guardado en vuelo (`_guardadoCatalogoPendiente`) o un reintento fallido sin cambios en RAM, `_estadoPuedePublicarse()` compara `_huellaPublicable()` (que lee `estadoActualExportable()` **CON** `item.foto` hidratada en RAM) contra `_huellaPublicable(_estadoPublicableConfirmado)` (**SIN** `item.foto`).
   - Resultado: **desajuste permanente** (`_estadoPuedePublicarse() === false`) aunque RAM sea idéntica al último estado confirmado en disco/IDB → falsos bloqueos de publicación y `409` en tiendas con fotos hidratadas como la de Belén.

## Cambio mínimo Ponytail
En `docs/mock-backend.js` (`_huellaPublicable`):
```js
function _huellaPublicable(estado = estadoActualExportable()) {
  const normalizado = typeof _estadoParaGuardarSinFotos === "function" ? _estadoParaGuardarSinFotos(estado) : estado;
  const { _rev, _abCommit, ...datos } = normalizado;
  return JSON.stringify(datos);
}
```

## Invariantes de seguridad (sin falsos positivos)
1. **Foto confirmada en IDB sin cambios:** `_estadoParaGuardarSinFotos(estadoActualExportable())` poda exactamente las mismas fotos que `completo` → `_estadoPuedePublicarse() === true` mientras otro guardado está en vuelo.
2. **Foto modificada en RAM (no confirmada aún en IDB):** `tieneFotoHashConfirmadoEnIdb(fotoHash, fotoNueva)` devuelve `false` → `_estadoParaGuardarSinFotos` conserva `fotoNueva` → las huellas **difieren** → `_estadoPuedePublicarse() === false` (fail-closed!).
3. **Cambio en `fotoHash`, `fotoRev` o cualquier dato de producto/percha/venta:** `_estadoParaGuardarSinFotos` nunca toca `fotoHash`/`fotoRev` ni campos de negocio → las huellas **difieren** → `_estadoPuedePublicarse() === false` (fail-closed!).
4. **Foto legada sin `fotoHash` o puente `OCFotos` no disponible / lanza error:** `_estadoParaGuardarSinFotos` devuelve `item` intacto → comportamiento fail-closed conservado.
5. **Arranque (`líneas 6191, 6340, 6737`):** `_estadoPublicableConfirmado = _huellaPublicable()` queda automáticamente normalizado también.

## Plan TDD (tras fusión de PR #796 por Sol6)
1. **RED:** `test/p0-belen-huella-publicable-sin-fotos.test.cjs` cargando `_huellaPublicable`, `_estadoPuedePublicarse` y `_estadoParaGuardarSinFotos` desde `docs/mock-backend.js` real:
   - caso 1: foto confirmada en IDB + guardado en vuelo → hoy devuelve `false` (RED), debe devolver `true` (GREEN);
   - caso 2: foto modificada en RAM (no confirmada) → debe seguir `false`;
   - caso 3: `fotoHash`/`fotoRev` cambiado o precio/stock cambiado → debe seguir `false`;
   - caso 4: fallo en `OCFotos.tieneFotoHashConfirmadoEnIdb` → debe seguir fail-closed sin lanzar.
2. **GREEN:** parche de 1 línea en `docs/mock-backend.js` + sellado `v0.8.05` (solo después de merge de #796).
3. **Métricas:** sin cambios en PORT (`81.5/100.0`), Calidad (`72.7/100.0`) ni GO (`0/6`).
