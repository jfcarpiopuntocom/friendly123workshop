# Reporte · P0 Belén CAS end-to-end (`expectedFotoHash`/`expectedFotoRev`) + ACK estricto en `vista-perchas.js` (v0.8.04)

- **Fecha:** 2026-11-19
- **PR producto (`jfcarpiopuntocom/friendly-123`):** [#796](https://github.com/jfcarpiopuntocom/friendly-123/pull/796)
- **Rama:** `fix/p0-belen-vista-perchas-cas-v804` (rebasada sobre `master@673edca` con #793 C13 y #794 C14 ya fusionadas)
- **HEAD exacto verificado en CI:** `167736a8ab3464df7484701ffc5d22b83f1c867d` (`167736a`)
- **Sellado de shell:** `v0.8.04` · `f123-shell-v804` · `golden340`
- **PRECODE:** [`projects/assembled-v783/plans/2026-11-19-belen-p0-vista-perchas-cas-e2e.md`](../plans/2026-11-19-belen-p0-vista-perchas-cas-e2e.md)
- **Reserva Notion:** `41d1642b-67f3-81cc-8fca-d50d12b26adf` (Liberada, lista para fusión de Sol6; reemplaza y supera al borrador obsoleto #779)

## Problema cerrado (Apéndice Adversarial Belén #3 y #5)
1. **CAS A→B→C desconectado en los 3 escritores de `docs/vista-perchas.js`:** el backend `docs/mock-backend.js` ya soportaba `expectedFotoHash` y `expectedFotoRev` en `PUT /api/ubicaciones/:id` con rechazo `409 foto-pointer-conflicto`, pero ninguno de los 3 escritores en `docs/vista-perchas.js` (`recuperarFotosPerchas`, `inputFoto`, `[data-vault-restore]`) enviaba esos guardas, permitiendo sobrescribir silenciosamente una foto más reciente de otro dispositivo.
2. **Restauración desde bóveda sin ACK estricto ni guardia de cuaderno:** `[data-vault-restore]` podía reportar restauración exitosa aunque el `PUT` fallara o aunque el usuario hubiera cambiado de cuaderno mientras la operación estaba en vuelo.

## Cambio mínimo aplicado (enfoque Ponytail)
- `docs/vista-perchas.js`:
  - Helper `_casEsperadoFotoPercha(percha)` y lectura coherente del puntero observado antes del `PUT`.
  - Envío explícito de `expectedFotoHash` y `expectedFotoRev` en `recuperarFotosPerchas`, `inputFoto` y `[data-vault-restore]`.
  - Manejo explícito de conflicto `409` (`foto-pointer-conflicto`) sin pisar la versión ganadora y refrescando el estado local.
  - Verificación estricta `!rr || rr.ok !== true || !mismoCuadernoRestore()` en `[data-vault-restore]`.
- `test/p0-belen-vista-perchas-cas-e2e.test.cjs`: nueva batería RED→GREEN con los 3 escritores y carrera A→B→C.
- `test/perchas-photo-selfheal-v446.test.js`: actualizadas 2 aserciones heredadas v446 que esperaban `PUT` sin campos CAS para exigir ahora `{ fotoHash, expectedFotoHash: null, expectedFotoRev: null }`.
- `.github/workflows/p0-belen-vista-perchas-cas.yml`: workflow dedicado `belen-shelf-cas`.
- Sellado `v0.8.04` (`docs/sw.js`, `docs/version.json`, `docs/dashboard.html`, `docs/version-manifest.json`).

## Evidencia verificada (RED → GREEN → CI GitHub)
- **RED local inicial:** 0/3 (fallo real antes de parchear `docs/vista-perchas.js`).
- **GREEN local:** 23/23 pruebas Node (`p0-belen-vista-perchas-cas-e2e.test.cjs` + regresiones de punteros de foto) + `bash scripts/check-sw.sh` 7/7 OK.
- **GitHub Actions CI en HEAD exacto `167736a`:** **27/27 PASS, 0 FAIL** (`CodeRabbit` skipping):
  - `belen-shelf-cas` PASS (`44580031006`)
  - `Release continuity gate` PASS (`44580030809`)
  - `P0 Hotfix Gate` PASS (`44580030563`)
  - `belen-finance-browser` PASS (`44580030740`)
  - `photo-pointer-ack` PASS (`44580031059`) & `shelf-photo-pointer-ack` PASS (`44580029456`)
  - `seal` PASS (`44580030794`) & `verify-twice` PASS (`44580030692`)
  - `yparty-worker` PASS (`44580030160`) & `app` PASS (`44580030160`)
  - `c13` PASS (`44580030071`), `browser-parity` PASS (`44580029849`), `two-tab-sales` PASS (`44580029378`), `handoff-30x` PASS (`44580030994`)

## Alcance e integridad de métricas
- **NO** modifica `docs/sync-rollout.json` (sigue OFF), **NO** toca flags Cloudflare QA, **NO** toca datos reales de Belén ni de clientes.
- **Score PORT 2.0:** intacto en `81.5/100.0` · **Calidad:** `72.7/100.0` · **GO comercial:** `0/6` (este es un P0 separado de integridad de fotos de Belén, no infla métricas del port).
