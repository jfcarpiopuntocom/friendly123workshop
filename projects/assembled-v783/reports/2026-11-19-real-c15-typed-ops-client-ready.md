# 2026-11-19 · C15 APP REAL · Cliente HTTP tipado `-ops` con ACK `business-committed` y pruebas Workerd (LISTO PARA SOL6)

- **Producto:** `jfcarpiopuntocom/friendly-123`
- **PR candidata (lista para Sol6, NO fusionada):** [#795](https://github.com/jfcarpiopuntocom/friendly-123/pull/795)
- **Rama:** `port2/20261119-c15-typed-ops-client` (base `master@5daab17d24d5407f7d089b1d9d28c8a89b647319`, **CERO colisión** con C13 [#793](https://github.com/jfcarpiopuntocom/friendly-123/pull/793) y Sol6 C14 [#794](https://github.com/jfcarpiopuntocom/friendly-123/pull/794))
- **SHA HEAD verificado:** `0f8ce7f49fee4c34692a95a21d81b4247d8ff5d5`
- **Plan PRECODE:** [`2026-11-19-real-c15-typed-ops-client-precode.md`](../plans/2026-11-19-real-c15-typed-ops-client-precode.md) (`workshop/main@8971ef1`)

## Hallazgos / Known Pitfalls reales verificados
1. **Contrato real de recibo en `typed-commercial-ledger.mjs:163-168`:** el servidor emite `receiptId` (prefijo 24 hex de SHA-256 del comando canónico) + `acceptedAt` (no `payloadHash`). La primera corrida Workerd en CI lo detectó de inmediato; `src/port2-typed-ops-client.mjs` ahora recomputa y valida criptográficamente `receiptId` contra los bytes canónicos enviados.
2. **Trampa HTTP 202 (`response.ok === true`):** con `WS_BUSINESS_EXECUTOR_QA=0`, el Worker devuelve `202` + `stage: 'stored-for-application'`. El cliente ahora exige HTTP `200` + `stage === 'business-committed'` y en `202` devuelve `committed: false, stage: 'queued-not-committed', fallbackLegacy: true`.
3. **Desajuste `expense.record`:** `typed-commercial-ledger.mjs` pide `ops:expense`, pero `cloudflare-worker/ws-capability-issuer.mjs` (`CEILING`) no autoriza `ops:expense` para ningún rol → el cliente falla cerrado localmente (`unsupported-issuer-scope`) antes de gastar cuota `/ws/ticket`.
4. **Conflicto HTTP 409:** entra en cuarentena dura (`quarantine: true, retryable: false, fallbackLegacy: false`).
5. **Cloudflare QA (`friendly123-yparty-port2-canary-qa`):** faltan `WS_TYPED_ORIGIN_QA`, `WS_CATALOG_ORIGIN_QA`, `WS_FROZEN_HISTORY_SOURCE`, R2 (error 10042) y despliegue de `/ws/ticket` en `friendly123-licencias` (versión 4 nov).

## Evidencia TDD y CI exact-HEAD (`0f8ce7f`)
- **RED real:** `0/8` pass, `8/8` fail.
- **GREEN local:** `26/26` pass (`8/8` C15 + `18/18` regresión tickets/C12/bundle).
- **CI Workerd REAL (`c15`):** [run 44577242317](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44577242317) **SUCCESS (11s)** — `Tienda` DO real + `authoritative-business-sql.mjs` (202 queued ≠ committed, 200 `business-committed` para `sale.record` + `stock.adjust`, idempotencia tras cold restart del DO, 409 quarantine, 503 fail-closed).

## Métricas
- Sin cambios de score ni GO (`0/6`): `production-business-dispatch` (+3,0 pts) se acredita solo al cablear este módulo a `src/yparty-piloto.js` + bundle + `docs/sync-yjs.js`.
