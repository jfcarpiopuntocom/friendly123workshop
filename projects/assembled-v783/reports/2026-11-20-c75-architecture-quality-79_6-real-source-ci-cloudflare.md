# C75 · calidad 79,6/100 · misma friendly-123 1.0→2.0, original100 preservado

**Fecha:** viernes 20-nov-2026, Ecuador. Se PORTA la **MISMA aplicación** `jfcarpiopuntocom/friendly-123` de arquitectura1.0→2.0 por injertos ya maduros. Sync3 YA es2.0 y permanece. `friendly123workshop` solo QA/PRECODE/evidencia, NO otro producto. **Fuente canónica de producto: `master@e428ba67fdfea4636b70b4c858ac8511c65f1a3c`**, [PR #876 score MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/876) y [PR #875 source MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/875).

## Doble métrica independiente /100, sin mover presupuesto

| Indicador, rúbrica original fija | Antes C73 | Ahora C75 | Delta |
| --- | ---: | ---: | ---: |
| **Transición misma friendly-123 1.0→2.0** | 92,0/100,0 | **92,0/100,0** | 0,0 |
| **Calidad arquitectónica** | 79,5/100,0 | **79,6/100,0** | +0,1 |
| Calidad Business | 18,7/20,0 | **18,8/20,0** | +0,1 |
| Calidad Durabilidad | 18,6/20,0 | **18,6/20,0** | 0,0 |
| GO comercial | 0/6 | **0/6** | 0 |
| Física PC Opera↔iPhone Safari/PWA | 0/5 | **0/5** | 0 |

**Ocho puntos de transición sin acreditar:** verdadero Firebase HEAD económico real2,0, Cloudflare R2 Service Binding real2,0, operación/roles/fotos/failback físico4,0. No confundir sintético CI/Workerd con GO de cliente. QA OFF. El puntaje business+0,1 refleja una causa raíz distinta del previo C72: recobrar precio original congelado y bloquear primer corte sobre historia previa.

## Fuente C74 integrada en MISMA aplicación: RED→GREEN genuino

[PRECODE C74 antes de tocar fuente/QA](../plans/2026-11-20-c74-certified-price-and-occupied-economic-bootstrap-precode.md), también Notion, PR [#875 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/875), fuente product **`master@45d54fbdec1fb07fbca52f090c2abcc75528c040`**.
- **Dos causas:** (1) C72 verifica payload, digest, receipt `business-committed`, opId y saldo económico, pero una venta podía falsificarse con un `payload+efecto+caja+hash` internamente coherentes de **4998 centavos** cuando los datos de SKU congelados independientemente certificaban **2 unidades ×1999 =3998 centavos**; (2) nueva `installBusinessBaseline` admitía un certificado al haber contenido previo en `typed_commercial_payloads` o `f123_frozen_unions` sin cortar causalmente la historia.
- **Primer intento harness no acreditado:** [Actions44749545420](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44749545420) falló en parseo del test: `await proof()` dentro de callback síncrono `assert.throws`. Reparación en QA-only `420d80cf289430a3f3a132a0f4b117cbf8a9304f`; nunca llamar aquello RED de producto.
- **RED verdadero** [Actions44749696133](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44749696133), módulos fuente VERDADEROS `prepareBusinessBaseline/installBusinessBaseline/createBusinessSqlExecutor/createTypedCommercialLedger` y `node:sqlite` NATIVO Node22, **2/5 PASS, 3/5 FAIL** por `Missing expected exception`, exactamente precio y dos bootstrap huérfanos. Controles positivos de venta legítima+abono parcial/recuento/opId y tablas vacías PASS.
- **Cambio mínimo Ponytail** SOLO `cloudflare-yparty-worker/src/authoritative-business-sql.mjs`, branch source `76e9f9969d46f8df0f81905ad7a7826f86d6f307`: lectura `certifiedPrices` desde `state.products` SHA-verificado originalmente y `BigInt(c)===BigInt(-q)*certifiedPrices.get(effect.product_id)` para venta `q<0&&c>0`, en reentrada read-only. Añadir `typed_commercial_payloads` y `f123_frozen_unions` a guard `hasRows` de primer certificado. Nada de ajustes a valor fijo; no tocar hot path venta, Sync3, PIN, cliente, `@noble/hashes` OSS, payload/receipts originales.
- **GREEN final** [Actions44749881266](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44749881266): **5/5 C74 Native SQLite**, **11/11 C72 SHA**, **8/8 C68 stock/caja/fiados**, **2/2 Workerd cobros/fiados**, **2/2 Workerd venta/caja**, score CLI original100 PASS. **14/14 GitHub workflows HEAD final SUCCESS**, incluyendo release-control, Gate D Workerd y Chromium/WebKit 2 pestañas.
- **GitHub y Cloudflare reales:** [PR #875 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/875), source merged `45d54fbdec1fb07fbca52f090c2abcc75528c040`; Cloudflare Workers Builds GET script `friendly-123`, branch `master`, **SHA EXACTA** `45d54fbdec1fb07fbca52f090c2abcc75528c040` outcome `SUCCESS`, UUID `d4c8a595-0ef2-4b26-8788-7966307703fa`. Sin writes Cloudflare settings, R2, usuarios o negocio comercial.

## C75 scoring en PR separada, TDD real y Cloudflare exact

- [PRECODE C75 previo a test y score](../plans/2026-11-20-c75-c74-quality-79p6-source-evidence-precode.md); [PR score #876](https://github.com/jfcarpiopuntocom/friendly-123/pull/876).
- **RED score-only** [Actions44750692067](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44750692067) test-only SHA `be659ee4250f2ec6d0d7c738f5d3942ec62101e1`, `quality79.5 !==79.6` frente a JSON anterior; no error de negocio ni harness.
- **GREEN real** [Actions44751086617](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44751086617) HEAD `6df2b963d0071a51463996c9da12a885c2af7726`, CLI `{"port":92,"quality":79.6,"qualityBefore":79.5,"qualityDelta":0.1,"go":"0/6"}`, tests score PASS. **11/11 GitHub workflows head score SUCCESS** incluidos C12/C13/C30, release-control, P0 browser Chromium/WebKit. Score update exclusivo cuatro archivos `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`, `docs/engineering/architecture-2-port-score.md`: Business18,7→18,8, calidad total79,5→79,6; `quality.comparison.previousScore=79.5` y SUMA de `dimensions.previous` exacta79,5, otros ejes y pesos originales intactos. Validador pines de guard fuente C74 test nativo RED.
- **[PR #876 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/876)** en `friendly-123/master@e428ba67fdfea4636b70b4c858ac8511c65f1a3c`. Dos JSON scorecards LEÍDOS directamente en ese SHA: port92,max100,pending8,GO0/6; quality79,6,max100,prev79,5,prev dimensional sum79,5,Business18,8/20,Durability18,6/20,physical0. **Cloudflare Workers Builds API GET cuenta real** branch master SHA EXACTA `e428ba67fdfea4636b70b4c858ac8511c65f1a3c`, outcome **SUCCESS** UUID `00744f6d-dfd4-4b85-8cf3-d232cccf019f`. Build verificado no prueba deploy/activación 2.0 clientes.

## Bloqueos reales / coordinación IA

**Cloudflare read-only real en esta sesión:** R2 buckets de la cuenta = **0**; Worker QA `friendly123-yparty-port2-canary-qa` tiene binding `WS_AUTHORITY` servicio `friendly123-licencias` pero **NO** binding `WS_FROZEN_HISTORY_SOURCE` ni R2 binding. Faltan fuente de congelación auténtica y Service Binding antes de ganar 2,0+2,0 puntos; no se ha creado bucket/binding ni incurrido en nuevos recursos facturables.

No se tocaron rutas ocupadas por otras IA: [PR #871](https://github.com/jfcarpiopuntocom/friendly-123/pull/871) unión Yjs Gate D4/D5, [PR #868](https://github.com/jfcarpiopuntocom/friendly-123/pull/868) fotos SHA, [#841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) ledger. [PR #873](https://github.com/jfcarpiopuntocom/friendly-123/pull/873) C71 cerrada sin merge no sustituyó C72 ni SHA de biblioteca madura. Notion guarda plan/RED/GREEN/cierre.

**Próxima acción con puntos PORT:** HEAD económico Firebase ORIGINAL independiente y completo (opIds, stock, dinero, fiados, fotos, vector Yjs), R2 source Service Binding QA real, y pruebas físicas PC Opera→iPhone Safari/PWA→PC×2. Mantener NO-GO y los 8,0 puntos sin reclamar.
