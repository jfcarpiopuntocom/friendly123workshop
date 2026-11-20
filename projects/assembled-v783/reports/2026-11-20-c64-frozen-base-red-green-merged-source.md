# C64 · frozen base required at 2.0 SQL reopen — real app source merged

**Fecha:** 20 nov 2026 Ecuador. **Producto real:** `jfcarpiopuntocom/friendly-123` PORTANDO arquitectura 1.0→2.0 (Sync3 conservado). Workshop solo PRECODE/QA/registros.

**PR [#864](https://github.com/jfcarpiopuntocom/friendly-123/pull/864)** fusionada `master@ca86aa4bbe7df1d9da0293e803896edbac53380b`. C64 source `cloudflare-yparty-worker/src/open-existing-store.mjs`, solo guard después de `exportCompleteYpartyYjs`: un recibo `f123_frozen_imports` anterior **NO permite** `opened:true` a menos que la reconstrucción tenga `snapshotKind==='blocks'`. Es el formato canónico que realmente escribe `installFrozenImport`; `Tienda.onSave` también compacta a `documento_bloques`, borrando `documento`. Ningún movimiento se reinterpreta, restablece o sintetiza; el journal sigue intacto en caso de rechazo.

## TDD reproducido sobre código real

1. PRECODE persistente [C64 plan](../plans/2026-11-20-c64-frozen-base-reopen-failclosed-precode.md) antes de editar fuente, con reserva exclusiva `src/open-existing-store.mjs`, nuevo test y workflow; Notion actualizado.
2. Primer intento de workflow [44731304818](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44731304818) reveló harness `ERR_MODULE_NOT_FOUND: yjs`; corregido con `npm ci --prefix cloudflare-yparty-worker` SIN acreditarlo como defecto de producto.
3. **RED1** [run 44731412320](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44731412320): control real con snapshot+update de segundo escritor PASÓ, escenario `snapshotKind:none` Yjs de journal SOLO devolvió `opened:true` indebidamente (**1/2 PASS, failure `true!==false`**).
4. Primer guard `snapshotKind==='none'` pasó ambos, pero auditoría descubrió variante del mismo defecto.
5. **RED2** [run 44731901974](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44731901974): snapshot `documento` legado podía sustituir la base importada `documento_bloques` sin fail-closed (**2/3 PASS, 1 FAIL `true!==false`**). El producto real guarda un import congelado solo en `documento_bloques`, así que la exigencia correcta es exacta, no solo `none`.
6. **GREEN final** commit [d94685c](https://github.com/jfcarpiopuntocom/friendly-123/commit/d94685ceb6058fb3df467f07c18793c21f094a2c): `if(now.snapshotKind!=='blocks') throw new Error('frozen base snapshot missing after reopen')`. [run 44732002319](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44732002319): fuente real + stub SQL sintético **3/3 PASS**; mismo run **Miniflare real YParty Tienda cold join 5/5 PASS** y CLI de rúbrica original100 PASS. Todas las demás GH workflows del SHA final **14/14 SUCCESS**, incl release-control, hotfix P0, startup QA 2.0, ledger importado C14, SQLite Gate D4 y dos-tab Chromium/WebKit. No se afirma que el test negativo usó SQL Workerd real: fue `openExistingStore` real con SQL stub; el control positivo integral sí fue Workerd.
7. GitHub PR fusionada después de GH verde a SHA exacto `ca86aa4bbe7df1d9da0293e803896edbac53380b`. **Cloudflare Workers Builds GET read-only** script `friendly-123` rama `master` mismo SHA, build **success**, build UUID `b09be442-96ae-4802-a5b6-21f6256ceee3`. No se cambiaron recursos R2/Worker bindings/credenciales de clientes.

## Métricas y límites

Al fusionar C64 sin scoring extra, indicadores de producto **92,0/100,0 transición y 79,1/100,0 calidad**, rúbrica100 fija, GO0/6 y físico PC↔iPhone0/5. C64 arregla solo falsa aceptación de **formato de snapshot**: NO demuestra validez de los bytes originales tras compaction, HEAD real Firebase, dinero/stock físico completo ni credenciales. Historial Firebase HEAD auténtico **2,0/100 PENDING** y R2 real binding **2,0 PENDING**. [C65 PRECODE separado](../plans/2026-11-20-c65-c64-frozen-base-score-quality-79p2-precode.md) considera a lo sumo +0,1 *calidad ingeniería* tras fuente y build exactos; migración no gana puntos QA artificialmente.

**Reservas intactas:** `docs/core/ledger.js` PR #841, Sync3, login/PIN, data clientes, R2 y billing. No GO comercial/physical. Es la **misma app**, no un port-producto.
