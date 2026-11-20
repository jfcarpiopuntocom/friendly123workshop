# C79 · SHA de gastos y pagos cliente 202 +1 Security, misma friendly-123 92,0/79,8

**20-nov-2026 Ecuador.** SE PORTA LA **MISMA app** `jfcarpiopuntocom/friendly-123` de arquitectura1.0 a2.0 ensamblando injertos OSS maduros, preservando Sync3 (ya 2.0). `friendly123workshop` SOLO es QA/PRECODE/registro, no una app alternativa. Producto oficial **`master@4fe426e17ea2868b0d9d3b07a91d1a8962bb9f99`**, [PR funcional C78 #879 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/879) y [PR evaluación C79 #880 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/880). QA flags OFF. GO comercial0/6, físico PC Opera↔iPhone Safari/PWA0/5.

## Doble métrica original100, con decimal y crédito no duplicado

| Indicador, rúbrica original100 fija | C77 antes | C79 oficial | Delta |
| --- | ---: | ---: | ---: |
| **Transición de la MISMA app 1.0→2.0** | 92,0/100,0 | **92,0/100,0** | 0,0 |
| **Calidad arquitectónica** | 79,7/100,0 | **79,8/100,0** | +0,1 |
| Security | 10,9/15,0 | **11,0/15,0** | +0,1 |
| Business | 18,9/20,0 | **18,9/20,0** | 0,0 |
| Durabilidad | 18,6/20,0 | **18,6/20,0** | 0,0 |
| Comercial GO | 0/6 | **0/6** | 0 |
| Físico PC Opera↔Safari/PWA iPhone | 0/5 | **0/5** | 0 |

Presupuesto de **TRANSICIÓN con 8,0 puntos NO ganados**: HEAD Firebase económico REAL e independiente2,0, R2 Service Binding REAL2,0, operación/roles/fotos/failback físico4,0. NI pruebas sintéticas native SQLite/Workerd NI Cloudflare Build acreditan cliente real o GO.

## Fuente C78: root cause real, RED→GREEN + madura biblioteca OSS

[PRECODE C78 escrito antes de editar fuente/QA](../plans/2026-11-20-c78-pending-expense-customer-payment-sha-precode.md) y [Notion bitácora](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94), [reporte fuente C78](2026-11-20-c78-queued-expense-customer-202-canonical-sha-red-green-merged.md).
- `cloudflare-yparty-worker/src/typed-commercial-ledger.mjs` soporta cinco `KINDS` y YA almacena payload canónico y SHA para `expense.record` y `credit.customer.payment.record` en receipts `stored-for-application` 202. Esas operaciones no son pagos/aplicaciones monetarias confirmadas; el SQL executor en esta ruta no registra efectos económicos para ellas.
- La reentrada anterior en `authoritative-business-sql.mjs::verifyTypedBusinessEffects` verificaba SHA y JSON canónico de venta, stock y abono fiado, pero para ambos tipos staged ejecutaba `if(!contract)...continue` ANTES del SHA. Un gasto202 con importe cambiado, pago cliente202 con `clienteId` cambiado conservando SHA anterior, o kind desconocido sintético podían recibir falso `already:true`.
- **RED verdadero [Actions44758958830](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44758958830)** Node22 `node:sqlite` NATIVO con módulos fuente `prepareBusinessBaseline/installBusinessBaseline/createTypedCommercialLedger/createBusinessSqlExecutor` REALES: **3/6 PASS, 3/6 FAIL**, todos los tres negativos fallaron por `Missing expected exception`. Controles positivos 202 genuinos de gasto y pago cliente sin efecto, venta200+fiado parcial, venta202 genuina y aislamiento entre licencias pasaron.
- **Ponytail fuente mínima** única `cloudflare-yparty-worker/src/authoritative-business-sql.mjs`, contrato `expense.record:{detail:'categoryId',quantity:false,queuedOnly:true}` y `credit.customer.payment.record:{detail:'clienteId',quantity:false,queuedOnly:true}`. Reutiliza **`@noble/hashes@2.4.0` OSS** ya fijado con tarball SHA512 y validación SHA256/canonical existentes para los cinco kinds; `if(!contract)deny()` impide desconocidos, customerPayment comprueba opId + amount>0, `queuedOnly` no permite efectos ni confirmación 200. No se ha implementado criptografía propia ni segundo escritor.
- **GREEN fuente [Actions44759148908](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44759148908)** source HEAD `a6beab3e8a5c6046824c6776bfffa804c6f01e9e`: **C78 6/6, C76 6/6, C74 5/5, C72 11/11, C68 8/8** Native SQLite real, **Workerd2/2 pagos +2/2 ventas/caja**, CLI rubric original100 PASS, **16/16 GH Actions globales SUCCESS** incluidos release-control, P0, Chromium/WebKit two-tab, real Tienda Gate D, binding QA dry-run.
- **[C78 PR #879 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/879)** product `master@2980aa59f3345b757a9e504465c54fd6b703987d`, confirmado GitHub source readback. **Cloudflare Workers Builds GET read-only real account**, script `friendly-123`, branch master, SHA exacta `2980aa59f3345b757a9e504465c54fd6b703987d` **SUCCESS**, UUID `8540651c-9dfc-4d52-ae59-aa46377e44d3`. No config Cloudflare/R2 ni datos cliente escritos.

## C79 SCORE independiente: RED de métrica, GREEN, merge exacto

[PRECODE C79 antes de cambiar score](../plans/2026-11-20-c79-c78-queued-expense-customer-sha-security79p8-precode.md), [PR #880](https://github.com/jfcarpiopuntocom/friendly-123/pull/880).
- **RED correcto [Actions44760069769](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44760069769)** test-only SHA `8372dc2766bb5768f1029b2f47a01084804b9180`: `79.7 !== 79.8`, JSON aún antiguo79,7 aunque código C78 ya MERGED; falla verdadera de puntuación, no negocio ni harness.
- **GREEN score [Actions44760471325](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44760471325)** HEAD `d0f58b12d7f4c6bb2c2e5c3bd1e3a2a9547da366`, validador CLI exacto `{"port":92,"quality":79.8,"qualityBefore":79.7,"qualityDelta":0.1,"go":"0/6"}`, C30 PASS, subregresiones de score 4/4. **11/11 GH Actions full HEAD GREEN**, release-control, P0, Chrome/WebKit. Cambios EXCLUSIVOS cuatro rutas `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`, `docs/engineering/architecture-2-port-score.md`. Seguridad10,9→11,0/15, Business18,9 sin incremento, previous business18,9, Security previous10,9, sum previous dimensiones exactamente79,7. Validador exige source C78 + casos negativos RED, pin SHA fuente merged `2980aa59...` y GO/port originales inmutables.
- **[PR score #880 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/880)** producto `master@4fe426e17ea2868b0d9d3b07a91d1a8962bb9f99`. GitHub releyó ambos JSON EXACT ese SHA: `port92,max100,pending8,GO0/6`; `quality79,8,max100,previous79,7,previousSum79,7,Security11,0/15,Business18,9/20,Physical0`. **Cloudflare Workers Builds API GET real**, script friendly-123 master SHA exacta `4fe426e17ea2868b0d9d3b07a91d1a8962bb9f99`, outcome **SUCCESS**, UUID `8bcbe7d6-7f94-40b0-ba81-1a3fbff38954`. Worker Build no prueba cutover físico.

## Auditoría de bloqueos reales y trabajo de otras IA

**Cloudflare GET real, en esta sesión:** cuenta R2 **0 buckets**, QA Worker `friendly123-yparty-port2-canary-qa` tiene Service Binding `WS_AUTHORITY→friendly123-licencias`, NO tiene **`WS_FROZEN_HISTORY_SOURCE`** ni ningún R2 binding. Estas fuentes impiden acreditar el HEAD Firebase real2,0 y R22,0. No crear bucket, sin autorización para datos económicos originales y sin alterar licencias ni activar QA switches.

Reservas de otras IA preservadas: [PR #871](https://github.com/jfcarpiopuntocom/friendly-123/pull/871) unión Yjs, [PR #868](https://github.com/jfcarpiopuntocom/friendly-123/pull/868) fotos SHA, [PR #841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) ledger. Ninguna ruta reservada fue editada. Tarea siguiente que SÍ gana puntos TRANSICIÓN: obtener certificación independiente y completa del HEAD económico REAL de Firebase (opIds, dinero, stock, fiados, vector Yjs), preparar fuente R2 immutable+Service Binding QA real, luego ejecutar dos ciclos físicos PC Opera→iPhone Safari/PWA→PC A→B→A y contrastar negocio/cuaderno. Mantener NO-GO comercial hasta eso.
