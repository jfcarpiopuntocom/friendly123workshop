# C65 · Calidad arquitectónica 79,2/100,0 · MISMA friendly-123

**Fecha:** 2026-11-20 Ecuador. Arquitectura 1.0→2.0 de **la misma aplicación** `jfcarpiopuntocom/friendly-123`; Sync3 conservado. Workshop es solo laboratorio de pruebas, PRECODE y bitácora; código funcional en producto. **PR [#865 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/865)**, master SHA exacto **`d58ace2e4b0971e8bcf0a0e390845e6c3f162d8b`**. QA OFF, GO comercial 0/6, físico 0/5.

## Indicadores canónicos posteriores a merge

| Rubrica congelada | Antes (C63) | AHORA C65 | Delta |
| --- | ---: | ---: | ---: |
| Transición 1.0→2.0 de friendly-123 | 92,0/100,0 | **92,0/100,0** | 0,0 |
| Calidad arquitectónica | 79,1/100,0 | **79,2/100,0** | +0,1 |
| Durabilidad (subdimensión calidad) | 18,4/20,0 | **18,5/20,0** | +0,1 |
| GO comercial | 0/6 | 0/6 | 0 |
| PC Opera↔Safari/PWA física | 0/5 | 0/5 | 0 |

**Crédito limitado**: un control fail-closed en el injerto 2.0 para impedir que un recibo persistido de importación congelada se considere prueba de conservación de la instantánea SQL cuando falta la base, o cuando se sustituye por `documento` legado. El guard de [C64 PR #864](https://github.com/jfcarpiopuntocom/friendly-123/pull/864), fusionado a `master@ca86aa4bbe7df1d9da0293e803896edbac53380b`, exige `snapshotKind==='blocks'` dentro de `openExistingStore`. No cambia ningún dato de clientes ni escribe PIN, R2, Cloudflare settings o canales Sync3.

## Evidencia causal y pruebas

- Plan previo: [C64 PRECODE](../plans/2026-11-20-c64-frozen-base-reopen-failclosed-precode.md), [C65 PRECODE antes de score](../plans/2026-11-20-c65-c64-frozen-base-score-quality-79p2-precode.md) y [reporte técnico completo C64](2026-11-20-c64-frozen-base-red-green-merged-source.md). Bitácora Notion aprobada consultada antes de actuar.
- C64 **RED1** [44731412320](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44731412320): SQL sintético con journal Yjs válido y base `documento_bloques` ausente → falsa aceptación `true!==false` (1/2 PASS). **RED2** [44731901974](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44731901974): `documento` legado sustituto → segunda falsa aceptación (2/3 PASS). **GREEN** [44732002319](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44732002319): test source real `openExistingStore` + SQL stub 3/3 y Workerd/YParty real ON-start positivo 5/5.
- C64 fuente PR #864 fusionada con **14/14 GitHub CI** sobre `d94685ceb6058fb3df467f07c18793c21f094a2c`, Cloudflare Workers Builds success del SHA exacto C64 `ca86aa4bbe7df1d9da0293e803896edbac53380b`, UUID `b09be442-96ae-4802-a5b6-21f6256ceee3`.
- C65 TDD **RED score** [44733026923](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44733026923) ejecutó test C65 en código real antes de editar JSON y obtuvo `79.1 !== 79.2`; no fue un fallo de negocio. **GREEN** [44733304598](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44733304598) muestra CLI `{"port":92,"quality":79.2,"qualityBefore":79.1,"qualityDelta":0.1,"go":"0/6"}`, pruebas focales 0 FAIL. **11/11 workflows GitHub success** sobre head `29c9cf92219ff7f6af87aff0dbe82e1684314517`, incluidos C30/C12/C13/P0/release/concurrencia Chromium-WebKit.
- **Merge SHA exacto C65** `d58ace2e4b0971e8bcf0a0e390845e6c3f162d8b`. Cloudflare API GET a Workers Builds, script real `friendly-123`, `master`, commit SHA exacto y `build_outcome=success`, UUID `ed57ade9-c305-403a-b353-941bb3fc4731`. Verificación read-only sin mutación de bindings ni nuevos servicios. Relectura GitHub `master@d58ace2` confirma los dos JSON oficiales.
- El JSON de migración conserva `assessedProductSha` del injerto C62 `6e802e6...`, fuente exacta para hitos preexistentes. El JSON de calidad añade el pin independiente `lastAuditedProductSha=ca86aa4...` para el C64 funcional. Esta separación conserva provenance y no simula nuevo motor.

## Pendientes reales, no ganados por suites sintéticas

**8,0/100,0 de transición** incluyen Firebase HEAD económico verdadero + reconciliación causal por `opId` **2,0**, R2 real + Service Binding **2,0**, y restantes pruebas operacionales y físicas **4,0**. **GO comercial0/6, físico0/5**. No se ha demostrado que el cliente Belén ni dispositivos de tiendas reales hayan convergido. Seguir ruta de [preflight read-only Firebase HEAD/R2](2026-11-20-r2-frozen-history-real-cloudflare-readonly-preflight.md), privacidad `-cat`/ `-ops` y pruebas PC→iPhone→PC, sin crear buckets ni reescribir historial.

**Archivo reservado** `docs/core/ledger.js`: respetar [PR #841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841). No tocar aquí.
