# Reporte · PORT2 C16b + C17b · Cableado de despachador económico tipado y tickets Team en `yparty-piloto` + bundle + `sync-yjs` (`v0.8.06`)

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios Cloudflare/R2:** NINGUNO (`0 buckets`, 6 flags QA OFF, `sync-rollout.json` OFF).
- **PR producto (`jfcarpiopuntocom/friendly-123`):** [#805](https://github.com/jfcarpiopuntocom/friendly-123/pull/805)
- **Rama:** `port2/20261119-c16b-c17b-pilot-wire-v806` (rebasada sobre `master@f5f400d`; CERO colisión con el endurecimiento de Sol6 sobre `src/port2-typed-ops-idb-store.mjs`)
- **HEAD exacto verificado en CI:** `e9f48d1`
- **Sellado de shell:** `v0.8.06` · `f123-shell-v806` · `golden342`
- **SHA-256 exacto del bundle compilado (`esbuild 0.28.2`):** `03e0a9de053841c3f8afcfd4723063f7577ae340ea42e91d019cd1767775224b`
- **PRECODE:** [`projects/assembled-v783/plans/2026-11-19-real-c16b-c17b-yparty-piloto-browser-wire.md`](../plans/2026-11-19-real-c16b-c17b-yparty-piloto-browser-wire.md) (`c02bec8`)
- **Reserva Notion:** `41d1642b-67f3-81d3-9a3d-d62d67c3c60e` (Liberada, lista para fusión de Sol6)

## Qué entrega
1. **`src/yparty-piloto.js` + `docs/vendor/yparty-piloto.min.js` (determinista con `esbuild 0.28.2`):**
   - `crearDespachadorComercialTipado({ store, ... })` (**C16b**): une C15 (`dispatchTypedCommercialCommand`) + C16a (`createTypedOpsReconciler`), exige un `store` durable inyectado (cero RAM volátil; compatible 100% con `src/port2-typed-ops-idb-store.mjs`), pausa/reanuda en `visibilitychange` y `pageshow.persisted` (BFCache), y limpia listeners en `destroy()`.
   - `solicitarTicketComercialEquipo(scope, ...)` (**C17b**): une C17a (`createTeamTicketParams`) con credenciales transitorias en RAM (`OCAuth.rolActual()` + `OCSecure.leerPinQueAbre().team`), emitiendo tickets one-use de un solo scope HTTP para `admin` (`ops:sale`/`ops:adjust`/`ops:payment`/`fotos:read`) y `empleado` (`ops:sale`/`ops:payment`/`fotos:read`), rechazando con 0 red `empleado`+`ops:adjust`, `contador`/`artista`/`demo`, salas Yjs crudas, `fotos:write` y pestaña oculta.
2. **`docs/sync-yjs.js`:** expone `API.crearDespachadorComercialTipado` y `API.solicitarTicketComercialEquipo` detrás del doble switch QA (apagado por defecto en `docs/sync-rollout.json`). Tráfico comercial real 100% intacto.
3. **Sellado y verificación:** `v0.8.06` / `f123-shell-v806` / `golden342` + `.github/workflows/qa-port2-v785-shell-seal.yml` actualizado al nuevo SHA del bundle + workflow dedicado `qa-port2-real-c16b-c17b-pilot-wire.yml`.

## Evidencia verificada (RED → GREEN → CI GitHub)
- **RED local:** `test/p0-c16b-c17b-browser-pilot-wire.test.cjs` 0/6 antes del parche.
- **GREEN local:** **32/32 pruebas PASS** (C16b+C17b sobre bundle compilado real + C12 + C13 + tickets + built-bundle + port-score) + `check-sw.sh` 7/7 OK.
- **GitHub Actions CI en HEAD exacto `e9f48d1`:** **44/44 PASS, 0 FAIL** (`CodeRabbit` skipping), incluidos `c16b-c17b` (build determinista + Workerd C15+C17a), `c12`, `c13`, `seal`, `verify-twice`, `P0 Hotfix Gate`, `Release continuity gate`, `yparty-worker`, `belen-finance-browser`, `belen-shelf-cas`, `browser-parity`, `preack-crash`, `two-tab-sales`, `handoff-30x`, `isolated-original-contracts`, `P2P mirror`.

## Métricas
- **PORT 2.0:** `81.5/100.0` · **Calidad:** `74.1/100.0` · **GO comercial:** `0/6` (no se tocó `docs/engineering/*score*` en esta PR para que Sol6 audite y acredite el salto de `production-business-dispatch` +3.0 y `commercial-role-switch` +1.5 tras el merge).
