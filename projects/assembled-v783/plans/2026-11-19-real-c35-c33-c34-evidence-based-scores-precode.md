# PRECODE C35 — auditoría de crédito real del puente C34 + E2E C33, puntuación fija

Fecha 19 nov 2026 Ecuador. **No escribir JSON de score hasta que C34 esté fusionado con green**.

## Contexto y base
- App real `jfcarpiopuntocom/friendly-123`, Sync3 ya injerto 2.0 y conservado; workshop no suma.
- C33 [#828](https://github.com/jfcarpiopuntocom/friendly-123/pull/828) merge `2fc84affdd00563e43d2f71e142d211eeefa6d99` 11/11 workflows GREEN, Workerd SQLite real + fuente sync-yjs + bundle: 3 receipts, stock/cash/debt, foto SHA Owner PUT/Team GET, no shadow, opId fence across synthetic reload/A→B→A.
- C34 [#829](https://github.com/jfcarpiopuntocom/friendly-123/pull/829) RED original `cantidad/amountCents undefined`, GREEN 3/3 exact-source. Mínimo cambio `docs/mock-backend.js`: para venta ya guardada localmente en efectivo completo a precio de lista con stock no negativo, anexa `cantidad` y `amountCents` al mismo evento `venta` viejo. C31 con switch QA ON ahora sí puede traducirlo a `sale.record`. Sin lugar para fiado, cortesías, descuentos, transferencias, faltantes ni cobro parcial. No hay cutover comercial activo. Requiere merge final C34 y verificar su CI, shell y SHA.
- Score anterior fijo: PORT 84,5/100,0; calidad 75,8/100,0; GO 0/6.

## Crédito propuesto, pequeño y verificable
- Únicamente si C34 está en master, separar el milestone pendiente `typed-economics/production-business-dispatch` de 3.0 en:
  - NUEVO `real-cash-sale-envelope-c34`: 0,5 DONE, fuente `docs/mock-backend.js` + `docs/sync-yjs.js` C31 + test exact-source GREEN, SHA probado.
  - REMANENTE `production-business-dispatch`: 2,5 UNDONE. Exige recibos DO visuales, dinero integrado al UI, retirar doble escritor y pruebas reales A→B→A x2. No dar más.
- PORT esperado **85,0/100,0** (+0,5 de verdad), presupuesto de 100.0 invariable, Sync3 fuera pendiente.
- Calidad: sumar conservador **+0,2** en dimensión `business`, tras nuevo test de contrato de venta real con C33 verdadero Workerd, manteniendo resto dimensiones (incluidas physical 0), para **76,0/100,0**. Si audit no sustenta, mantener 75,8.
- GO **0/6** y permisos producción intactos. No puntos por el workshop ni por la mera cantidad de tests.

## Trabajo Ponytail sin colisiones
1. Antes del score, reservar en Notion solo `docs/engineering/architecture-2-port-score.json`, `architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`; no tocar runtime ni Cloudflare/R2. Branch `port2/20261119-c35-c33-c34-audited-score` del master después de C34.
2. RED: test de score exige PORT 85,0, calidad 76,0, budget split, `GO0/6` y SHA c34 merge. Registrar log CI con fallo antiguo.
3. GREEN: JSONs con fuente/evidencia anclada al commit c34 en master, script que verifica la fuente `_opVenta.cantidad/amountCents`, términos exactos del guard y test C34; protege v814, manifesto hash, reserva pendiente. No tocar otros weights/scores. `node scripts/architecture-2-port-score.cjs --json`; CI 0 FAIL.
4. Merge solo tras CI, actualizar Notion/bitácora con SHA y explicación de score limitado, informe workshop. Costo 0 USD. C35 no puede convertirse en excusa para rediseñar la app.
