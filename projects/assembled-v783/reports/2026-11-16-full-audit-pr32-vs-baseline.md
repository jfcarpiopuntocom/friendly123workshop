# v783 — auditoría global PR #32 vs baseline (16 nov 2026)

## Identidad y procedencia

- Candidata: `jfcarpiopuntocom/friendly123workshop@f8b70e4ff9df672217d39e51bdf1ddeb94522946`, código en `projects/assembled-v783/app/` tras PR [#32](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/32).
- Base de comparación: `910affeea00dff41e7e6742242c4bf7d777228ce`, fijada en el workflow `.github/workflows/assembled-full-audit.yml`.
- Evidencia primaria: [GitHub Actions #43915515608](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43915515608), con jobs `Full app audit - candidate` (id `133468443894`) y `Full app audit - baseline` (id `133468443194`).
- Comando: `npm test`, `F123_QA_IMPORTED_MONEY=1`, Node22, dependencias bloqueadas y Chromium/WebKit oficiales; ambos jobs salieron FAIL. Los datos comerciales son sintéticos; no pruebas físicas ni producción.

| Rama | tests | pass | fail | cancelled | skipped |
| --- | ---: | ---: | ---: | ---: | ---: |
| candidate | 3196 | **3134** | **58** | 1 | 3 |
| baseline | 3148 | **3076** | **68** | 1 | 3 |

## Comparación exacta de casos fallidos

Se leyeron ambos logs y se extrajeron todas las líneas `not ok N - nombre`, eliminando solamente el ordinal `N` para comparar los nombres.

- La candidata emitió **59 entradas `not ok`**, incluyendo wrappers del test runner; el total oficial TAP es **58 tests fallidos**.
- **0 nombres fallidos exclusivos de candidata**: los 59 están presentes también en el baseline.
- El baseline emitió **69 entradas `not ok`** y 10 nombres adicionales que no aparecen como fallidos en candidata. No afirmar que los diez están arreglados sin rerun individual estable.
- Los conteos distintos de tests (3196 vs 3148), cancelación y posibles fallos ambientales implican que **el hecho de no tener nombres nuevos no prueba ausencia de toda regresión**.

### Fallos exclusivos del baseline en esta ejecución (no presentarlos como fixes certificados)

1. `Expenses compares actual monthly sales and expenses; returned sales do not inflate net`
2. `App expense month stays pending when an expense cannot be assigned a date`
3. `test/fiados-forensics-readonly-4d.test.js`
4. `Owner re-enters with 789 when the PIN authority route is not deployed (generic 404)`
5. `S4: atomic v1->v2 migration, readback, incremental append, and reload in synthetic real IndexedDB`
6. `S4 never duplicates a large customer backlog or deletes the v1 source`
7. `test/p0-v766-diario-yjs-poda.test.cjs`
8. `test/stock-journal-forensic-reconciliation.test.cjs`
9. `test/stock-journal-legacy-preflight.test.cjs`
10. `retry backoff is 3,6,12,24,48 s and stops at 5 attempts; no red banner and no notice`

## Resultado focal — no confundir con full audit

[Assembled post-merge #43915515422](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43915515422) pasó **506/506**, 0 fail/skip sobre el SHA candidato `f8b70e4f` (incluye 9 tests nuevos de abonos Dinero.js, 234 regresiones financieras previas). El gate focal **no sustituye** el `npm test` completo, que continúa rojo.

## Alcance del injerto y bloqueo de publicación

PR #32 cambió solo nuevos `cartera_abono` a adapter Dinero.js BigInt half-up existente; recibos viejos mantienen motor legacy y nuevas operaciones sellan `moneyEngine`, `montoSolicitado`, `opId`. Permisos, emisión de facts, servidor y clientes de producción intactos. Para publicar aún faltan issuer humano/ACL por rol, consumer comercial con ACK durable separado de `stored-for-application`, mapeo explícito entre `credit.payment.record(receivableId)`, `cartera_abono(clienteId)` y `cartera_aplicacion(abonoId,cargoKey,partes)`, foto hash+readback y dos ciclos PC→Safari/Opera→PC. **NO-GO**.

## Reproducción y próxima acción segura

1. GitHub Actions → `Assembled candidate full app audit (synthetic, no deploy)` → ejecución `43915515608` → comparar logs de ambos jobs.
2. Para un caso compartido, correr exactamente el test sobre candidato y baseline bajo el mismo runner limpio; conservar logs RED y diagnosticar raíz causal antes de tocar código.
3. No cambiar aserciones ni borrar fallos para elevar el porcentaje. Clasificar por familia: migración/sync antiguo, PIN/roles, SW/PWA, hosting y tests de entorno; no asumir que todos son el mismo bug.
4. Conservar en Notion el diagnóstico y preferir PRs aisladas por causa raíz. No activar clientes por porcentaje favorable.
