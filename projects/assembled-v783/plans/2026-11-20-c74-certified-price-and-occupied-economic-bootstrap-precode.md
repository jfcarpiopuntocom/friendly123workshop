# C74 PRECODE · precio certificado por venta y bootstrap económico sin historial ocupado

Fecha 2026-11-20 Ecuador. Se **PORTA la MISMA friendly-123** de arquitectura 1.0 a 2.0 mediante componentes OSS maduros; Sync3 ya es parte 2.0 y se conserva. Workshop solo registro PRECODE/QA y seguimiento persistente; injerto funcional en `jfcarpiopuntocom/friendly-123`.

**Base producto auditada**: `master@ed44d0ee7c68933e64a1c13761ab306639a7349b`, score original fijo: **transición92,0/100,0**, **calidad79,5/100,0**, calidad Business18,7/20, GO comercial0/6, físico PC Opera↔iPhone Safari/PWA0/5; flags QA OFF. **8,0 puntos PORT pendientes**: HEAD Firebase económico real2,0, Service Binding/R2 real2,0, operacional/roles/fotos/dispositivos4,0. Las pruebas de ingeniería no ganan esos 8,0.

## Origen del problema y autoridad de archivos

Fuente real C72 [PR #872 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/872), `cloudflare-yparty-worker/src/authoritative-business-sql.mjs`; YA usa `@noble/hashes@2.4.0` y verificación SHA/recibo opId, se conserva. En `reconcileCertifiedBusinessReadback`, ventas `q<0,c>0` pasan si `amountCents === effect.cash_delta_cents`, pero falta contrastar dinero `c === (-q) * certified unitPriceCents` de `state.products` SHA-verificado original. Alteración coordinada de payload, efecto, caja y SHA puede cuadrar internamente; aún puede violar precio certificado.

En `installBusinessBaseline({storage,proof})` nueva instalación, guarda `hasRows` falla cerrado ante ciertos diarios y efectos, pero omite `typed_commercial_payloads` (inbox payload huérfano) y `f123_frozen_unions` (unión Yjs previa); puede sembrar base sobre historial ya ocupado con corte causal desconocido. La [PR #873 C71](https://github.com/jfcarpiopuntocom/friendly-123/pull/873) de otra IA sugirió ambas brechas pero quedó CERRADA sin merge tras la colisión con C72; se adopta SOLO su delta independiente, sin copiar SHA propio ni reemplazar biblioteca noble. PR [#871 Yjs](https://github.com/jfcarpiopuntocom/friendly-123/pull/871), [#868 fotos](https://github.com/jfcarpiopuntocom/friendly-123/pull/868) y [#841 ledger](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) pertenecen a otras IA: NO TOCAR sus rutas ni Workerd client; titular C74 únicamente source server `authoritative-business-sql.mjs`, QA nueva y workflow propia.

## RED primero (Node22 SQLite nativo, ejecución de fuentes REALES)

Nueva `cloudflare-yparty-worker/qa/p0-c74-certified-prices-and-bootstrap.test.mjs` ejecuta `prepareBusinessBaseline/installBusinessBaseline/createBusinessSqlExecutor/createTypedCommercialLedger` verdaderos con `node:sqlite`; pruebas sintéticas sin datos cliente:
- **Control positivo** baseline 10 SKU a 1999 centavos, caja500, fiado3000; venta legítima de 2 a 3998, pago parcial1000, stock.count5 y duplicate same opId; vuelve a instalar baseline `already:true` y verifica fuente intacta.
- **RED precio** tras vender 2, cambiar `typed_commercial_payloads.payload_json.amountCents` a 4998, recalcular SHA256 legítimo usando Node test `createHash`, modificar `typed_commercial_ops.payload_hash` y `receipt_json.receiptId`, cambiar `f123_business_effects.cash_delta_cents` y caja en +1000. Aun así C72 puede dar `already:true` pues receipt/paylod/effect se reconcilian, pero **no cumplen precio certificado 2×1999**. Exigir fail closed y ninguna escritura compensatoria.
- **RED bootstrap** instalar base en SQLite con `typed_commercial_payloads` preexistente y al menos una fila (sin receipt), esperar error `controlled migration` y que `f123_business_baseline` siga vacío.
- **RED unión previa** si `f123_frozen_unions` tiene fila, aunque no haya otros opIds, rechazar instalación de baseline sin certificado de corte.
- **Control compatible** tablas recién creadas vacías pueden coexistir con instalación certificada; no rechazar solo por `sqlite_master`.

Workflow aislado `.github/workflows/qa-port2-c74-certified-economic-cutover.yml` hace `npm ci` root y Worker, test C74 RED, C72 11/11, C68 8/8, dos Workerd suites (fiados y ventas), score original100. Registro de RED real (no confundir fallo de harness con fallo fuente).

## GREEN Ponytail mínimo completo

**Un único source existente** `cloudflare-yparty-worker/src/authoritative-business-sql.mjs`:
1. Al readback de efectos ventas `q<0&&c>0`, buscar precio ORIGINAL certificado en `state.products` por SKU y exigir `BigInt(c)===BigInt(-q)*BigInt(price)`, y no aceptar overflow. **NO** cambiar validaciones/ruta caliente ventas: ya aplica precio correctamente.
2. Añadir `typed_commercial_payloads` y `f123_frozen_unions` a lista de `hasRows(sql,...)` para primer corte, sin modificar historial ni crear compensaciones. Usar SQLite ya maduro, no biblioteca nueva.
3. Preservar `@noble/hashes`, SHA256 recibos↔efectos C72, `sourceFrozenVerified`, Sync3, Yjs, roles, flags, PIN y clientes.
4. Verificar GREEN C74 y regresiones real Workerd; GitHub workflows globales exact HEAD, PR fuente merge, Cloudflare Workers Builds exact SHA master `SUCCESS`. No declarar GO por build; no writes Cloudflare configuraciones.
5. SOLO si merge fuente + pruebas exactas y evaluación de mérito distinta de C72, PRECODE + PR SCORE separada C75 para +0,1 **Business18,7→18,8/20, calidad79,5→79,6**, transición **92,0** sin puntos nuevos, GO0/6 físico0/5. Preservar rúbrica100, comparativos y pesos.

## Auditoría, rollback y transparencia

NO bajar puntuaciones por prueba synthetic fallida si source se corrige; no subir puntuación por test-only ni helper sin merge. Un único dueño por archivo. Si price test no RED genuino o Workerd falla, investigar e iterar; no merge. Registrar antes/después en workshop y Notion, con SHAs, rutas y consola de CI. Preservar screenshots/evidencia mediante logs Actions y reportes en workshop. Fuente Firebase original, R2 binding, cortes reales y ventas de Belén solo bajo certificación separada.
