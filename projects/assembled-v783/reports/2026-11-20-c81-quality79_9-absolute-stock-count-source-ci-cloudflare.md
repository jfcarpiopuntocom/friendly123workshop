# C81 · misma friendly-123: transición92,0 / calidad79,9 tras recuento físico N original

**20-nov-2026 Ecuador.** Se PORTA **LA MISMA app** `jfcarpiopuntocom/friendly-123` desde arquitectura1.0 a2.0 con injertos OSS ya maduros, **Sync3 YA es2.0 y se conserva**, workshop solo PRECODE, QA y evidencia durable. **Producto canónico `master@76044973a5b3168140396fe932cb61d8b8ee27e5`**, [PR C80 funcional #881 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/881) y [PR C81 puntuación #882 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/882), ambos con Cloudflare Workers Builds SHA EXACTA SUCCESS.

## Doble métrica /100 con un decimal y denominador original fijo

| Métrica o evidencia | C79 antes | C81 verificada | Delta |
| --- | ---: | ---: | ---: |
| **Transición MISMA friendly-123 1.0→2.0** | 92,0/100,0 | **92,0/100,0** | 0,0 |
| **Calidad arquitectónica** | 79,8/100,0 | **79,9/100,0** | +0,1 |
| Business | 18,9/20,0 | **19,0/20,0** | +0,1 |
| Security | 11,0/15,0 | **11,0/15,0** | 0,0 |
| Durability | 18,6/20,0 | **18,6/20,0** | 0,0 |
| GO comercial | 0/6 | **0/6** | 0 |
| Prueba física PC Opera↔iPhone Safari/PWA | 0/5 | **0/5** | 0 |

El JSON oficial del producto `master@76044973a5b3168140396fe932cb61d8b8ee27e5` se releyó: `port.score=92,max100,pending8,commercialGo.certifiedGates=0`; `quality.score=79.9,max100,comparison.previousScore=79.8`, `sum(dimensions.previous)=79.8` (redondeo flotante), Business19,0/20, Security11,0/15, Physical0/5. **No crédito de transición por CI/Workerd**, porque no se ha verificado el HEAD Firebase original ni R2 binding ni PC↔iPhone físico.

## C80 fuente real / PR #881: RED↔GREEN y cuidado por compatibilidad de auditoría

[PRECODE C80 antes de código](../plans/2026-11-20-c80-absolute-physical-count-ledger-causal-readback-precode.md); [reporte C80 source separado](2026-11-20-c80-absolute-count-rowid-causal-source-red-green-merged.md). Un `stock.adjust` de recuento físico registra la cantidad ABSOLUTA N en payload+SHA del receipt y SQL inserta delta=N−stockAnterior. Reentrada C72→C79 validaba receipt SHA y suma de deltas para el saldo FINAL sin cotejar N original opId; un recuento registrado como5 desde baseline10 podía falsificarse a delta−4 y stock6 sin alterar SHA ni dinero, devolviendo falso `already:true`.

**RED verdadero [Actions44763936393](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44763936393)**, ledger y source producción verdaderos, Node22 `node:sqlite` NATIVO: **4/7 PASS y 3/7 FAIL por Missing expected exception** (count físico5 adulterado como6, count entre ventas adulterado con saldo final consistente, count original0 alterado a1). Controles compra/fiado/202 pendientes, dos recuentos con opIds en orden lexicográfico INVERSO de aplicación y count no-op delta0 PASS. 
**Primera fuente GREEN focal [Actions44764234653](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44764234653)** 7/7 C80 y Workerd, pero falló validador histórico por cambiar firma `verifyTypedBusinessEffects(sql,license,effects)`; se conservó la firma y contratos anteriores, no se fusionó esta candidata.
**GREEN final [Actions44764713480](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44764713480)** source HEAD `f74cac4040e364d2b173217514cf828fe303acdf`: C80 **7/7**, C78 **6/6**, C76 **6/6**, C74 **5/5**, C72 **11/11**, C68 **8/8** sobre SQLite REAL, **Workerd pagos/roles2/2 + ventas/caja2/2**, score original100 CLI y tests PASS. **17/17 GH Actions globales SUCCESS** del HEAD fuente (Gate D Workerd, Chromium/WebKit dos pestañas, P0, release-control, S3). **[PR #881 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/881)** producto `master@52dd4b6f7d854387a578cc53a8be9c761ffc8105`. **Cloudflare Workers Builds GET real** branch master SHA EXACTO `52dd4b6f7d854387a578cc53a8be9c761ffc8105`, outcome `success`, UUID `39f2a22c-5fbc-4bd4-8ed5-8bb75e5da2ec`. Sin Cloudflare settings writes.

**Ponytail mínimo** fuente solo `cloudflare-yparty-worker/src/authoritative-business-sql.mjs`: SQL efectos `ORDER BY rowid` en readback (testigo de orden local de inserción, NO firma causal externa Firebase); `verifyTypedBusinessEffects(sql,license,effects)` con SU firma original y `@noble/hashes@2.4.0` devuelve mapa de `opId→cantidad ABSOLUTA N` de recibos SHA canónicos de `stock.adjust`; reconciliador original reconstruye saldo desde apertura certificado por inserción y rechaza si `stockAnterior+delta!==N` o stock intermedio negativo. Cero writes/compensación en cold reopen; hot path sales/count, Sync3, PIN, roles, fotos, clientes, Cloudflare switches intactos. No nueva dependencia ni segundo escritor.

## C81 puntuación separada / PR #882: RED→GREEN→MERGED CF exact

[PRECODE C81 escrito ANTES de score](../plans/2026-11-20-c81-c80-physical-absolute-count-quality79p9-precode.md). **RED test-only [Actions44765801150](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44765801150)** SHA `e69d19d0129e130f6448ea9964e1af0ddd8bea4d`: `79.8 !==79.9`, exacto JSON viejo y código fuente C80 ya fusionado; no fallo negocio/harness. **GREEN [Actions44766237798](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44766237798)** score HEAD `2f9142b778194a0937418f84b8af0d9821aa46ae`: CLI `{"port":92,"quality":79.9,"qualityBefore":79.8,"qualityDelta":0.1,"go":"0/6"}`, tests C30 pass y cuatro subtests, **11/11 GitHub workflows globales** mismo HEAD SUCCESS (release-control, P0, browser Chromium/WebKit, C12/C13/C30). Solo cuatro archivos scoring: `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`, `docs/engineering/architecture-2-port-score.md` con source SHA C80 real, test negativos C80, previous dims sum79.8 y 100 fijo. `docs/engineering/architecture-2-port-score.json` NO cambió.
**[PR #882 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/882)** producto `master@76044973a5b3168140396fe932cb61d8b8ee27e5`. **Cloudflare Workers Builds API GET real**, branch master SHA EXACTO `76044973a5b3168140396fe932cb61d8b8ee27e5` `success`, UUID `3082792a-58df-4317-a8aa-c7bf857a02cd`. El build es prueba de compilación Cloudflare, NO GO comercial ni prueba física.

## Próximas puertas operativas y coordinaciones

**Cloudflare GET REAL de esta sesión:** cuenta R2 **0 buckets**, Worker QA `friendly123-yparty-port2-canary-qa` posee `WS_AUTHORITY→friendly123-licencias` pero NO posee Service Binding `WS_FROZEN_HISTORY_SOURCE` ni binding R2. Por tanto **faltan 8,0 puntos de TRANSICIÓN**: Firebase HEAD económico original REAL e independiente2,0, R2 Service Binding REAL2,0, operativo/roles/fotos/failback físico4,0. No inventar contenido, no crear buckets cobrándole al usuario y no activar flags QA sin datos originales certificados. Dos ciclos PC Opera→iPhone Safari/PWA→PC×2 aún no ejecutados en dispositivos reales; GO0/6, físico0/5.

Reservas otras IA **intactas**: [PR #871 unión Yjs](https://github.com/jfcarpiopuntocom/friendly-123/pull/871), [PR #868 fotos](https://github.com/jfcarpiopuntocom/friendly-123/pull/868), [PR #841 ledger](https://github.com/jfcarpiopuntocom/friendly-123/pull/841). Nadie ha mezclado workshop con producto ni contado tests sintéticos como prueba real de Belén.
