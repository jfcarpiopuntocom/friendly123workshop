# Reporte · P0 Belén #6 · Alinear `_huellaPublicable()` con `_estadoParaGuardarSinFotos()` (`v0.8.05`)

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios Cloudflare/R2:** NINGUNO.
- **PR producto (`jfcarpiopuntocom/friendly-123`):** [#801](https://github.com/jfcarpiopuntocom/friendly-123/pull/801)
- **Rama:** `fix/p0-belen-huella-publicable-v805` (base `master@e2281fb` tras fusión de `#796` `v0.8.04` y `#798` C16a; CERO colisión con `#799` ni `#800`)
- **HEAD exacto verificado en CI:** `dcbb1ab`
- **Sellado de shell:** `v0.8.05` · `f123-shell-v805` · `golden341`
- **PRECODE:** [`projects/assembled-v783/plans/2026-11-19-belen-p0-huella-publicable-sin-fotos.md`](../plans/2026-11-19-belen-p0-huella-publicable-sin-fotos.md) (`f475efd`)
- **Reserva Notion:** `41d1642b-67f3-817e-9d32-d7469d6019f6` (Liberada, lista para fusión de Sol6)

## Problema cerrado y cambio mínimo Ponytail
- En `docs/mock-backend.js:1731-1751`, `_estadoPublicableConfirmado` guarda `completo` ya podado por `_estadoParaGuardarSinFotos(vivo)`, pero `_huellaPublicable()` (`docs/mock-backend.js:1473`) serializaba `estadoActualExportable()` **con** los `data:image/...` hidratados en RAM, provocando desajuste permanente (`_estadoPuedePublicarse() === false` / `409`) durante guardados en vuelo en tiendas con fotos confirmadas en IDB.
- Fix de 1 línea en `_huellaPublicable()`: normalizar `estado` con `_estadoParaGuardarSinFotos(estado)` antes de `JSON.stringify`, conservando fail-closed total ante fotos editadas no confirmadas en IDB, cambios de stock/`fotoHash`/`fotoRev` o fallos del puente `OCFotos`.

## Evidencia verificada (RED → GREEN → CI GitHub)
- **RED local:** `test/p0-belen-huella-publicable-sin-fotos.test.cjs` 3/4 pass, 1/4 fail (`false !== true`).
- **GREEN local:** 4/4 PASS + `p0-belen-photo-snapshot-quota-real-source` 7/7 PASS + `p0-belen-vista-perchas-cas-e2e` 4/4 PASS + `check-sw.sh` 7/7 OK.
- **GitHub Actions CI en HEAD exacto `dcbb1ab`:** **43/43 PASS, 0 FAIL** (`CodeRabbit` skipping), incluidos `P0 Hotfix Gate`, `Release continuity gate`, `safari-browser-credit`, `native-photo-quota`, `belen-finance-browser`, `belen-shelf-cas`, `P2P mirror`, `seal`, `verify-twice` y `yparty-worker`.

## Métricas
- **PORT 2.0:** `81.5/100.0` · **Calidad:** `72.7/100.0` (pendiente merge `#800` a `74.1/100.0`) · **GO comercial:** `0/6` · `sync-rollout.json` y flags Cloudflare QA OFF.
