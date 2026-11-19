# Reporte · PORT2 C16a · Reconciliador acotado `same-do-only` para comandos económicos `-ops`

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios en Cloudflare/R2:** NINGUNO (inspección R2 exclusivamente `GET` read-only: `r2Enabled=true`, `0 buckets`, 6 flags QA OFF).
- **PR producto (`jfcarpiopuntocom/friendly-123`):** [#798](https://github.com/jfcarpiopuntocom/friendly-123/pull/798)
- **Rama:** `port2/20261119-c16a-typed-ops-reconciler` (3 archivos nuevos; CERO colisión con `#796` y `#797`; `#795` ya fusionada por Sol6 en `master@aee5858`)
- **HEAD exacto verificado en CI:** `dd0d946f3a5a996f65022872a01ed17f5a9b5f33` (`dd0d946`)
- **PRECODE:** [`projects/assembled-v783/plans/2026-11-19-real-c16a-typed-ops-reconciler.md`](../plans/2026-11-19-real-c16a-typed-ops-reconciler.md) (`9ff2193`)
- **Reserva Notion:** `41d1642b-67f3-8143-817d-d6548c55a31c` (Liberada, lista para fusión de Sol6)

## Qué entrega (`src/port2-typed-ops-reconciler.mjs`)
- **Latch irreversible `same-do-only` por `opId`:** tras `202`, `200 stored-for-application`, timeout, `5xx` o excepción de red, jamás autoriza volver al libro legado (`fallbackLegacy: false`), incluso si un reintento posterior recibe `auth-denied` o `precondition-denied`.
- **Failback legado solo antes de tocar red:** un fallo previo al envío en primer intento sin latch previo permite failback limpio sin encolar.
- **Single-flight estricto por `opId` + `opid-payload-mismatch`:** incluso cuando coincide un timer de reintento con `submit` o `reconcileNow`, nunca se emiten dos POST simultáneos para el mismo `opId`, y se rechaza en cerrado si llega otro monto/producto con el mismo `opId`.
- **Límites estrictos anti-tormenta (`maxAttempts`, `maxPending`, backoff exponencial):** acota reintentos y capacidad de cola (incluidas ráfagas concurrentes iniciales) para proteger cuota/límites gratis y rate limits de `/ws/ticket`.
- **Cuarentena terminal `409`, Safari/BFCache y privacidad:** pausa timers al ocultarse sin perder la cola, sobrevive recargas, jamás guarda PINs ni tokens Bearer.

## Evidencia verificada (RED → GREEN → CI GitHub)
- **RED local:** `test/p0-c16a-typed-ops-reconciler.test.cjs` 0/10 antes de crear el módulo.
- **GREEN local:** 12/12 pruebas PASS (168 ms) + `node --check` OK.
- **GitHub Actions CI en HEAD exacto `dd0d946`:** **11/11 PASS, 0 FAIL** (`CodeRabbit` skipping):
  - `c16a` PASS (`44583850956`, 17 s)
  - `P0 Hotfix Gate` PASS (`44583850725`), `Release continuity gate` PASS (`44583850666`)
  - `Synthetic sync + real-browser contracts` PASS (`44583850769`), `two-tab-sales` PASS (`44583850728`)
  - `hex-boundary`, `integrated`, `mixed-shell`, `private-health`, `twice`, `Workers Builds` PASS

## Métricas
- **PORT 2.0:** intacto en `81.5/100.0` · **Calidad:** `72.7/100.0` · **GO comercial:** `0/6` (se acreditará en C16b al cablear C15 + C16a en `src/yparty-piloto.js` + bundle sellado).
