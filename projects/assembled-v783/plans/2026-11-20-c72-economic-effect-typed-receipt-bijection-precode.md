# C72 PRECODE · conciliación bilateral efecto económico ↔ recibo tipado business-committed

**20-nov-2026 Ecuador.** Se PORTA la MISMA `jfcarpiopuntocom/friendly-123` de arquitectura1.0→2.0 ensamblando componentes maduros; Sync3 ya es2.0 y permanece. Producto real `jfcarpiopuntocom/friendly-123`; workshop solo planes, pruebas QA y registro. Baseline producto `master@8b83e1cbe0cc039d555a845641cfe1482ca46d01`, **transición92,0/100,0**, **calidad79,4/100,0**, original100 invariable, GO comercial0/6, físico Opera PC↔Safari/PWA iPhone0/5. Aún sin verdadero HEAD económico Firebase2,0, Service Binding R2 real2,0 ni 4,0 operacionales/físicos. QA OFF.

## Reservas y precedencia

Respetar [#871 C70](https://github.com/jfcarpiopuntocom/friendly-123/pull/871) otra IA en `cloudflare-yparty-worker/src/merge-frozen-into-existing.mjs` y sus tests; [#868 fotos](https://github.com/jfcarpiopuntocom/friendly-123/pull/868) en `docs/vista-perchas.js` y `docs/sync-yjs.js`; [#841 ledger](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) `docs/core/ledger.js` reservado. **Sólo** `cloudflare-yparty-worker/src/authoritative-business-sql.mjs`, QA nueva `qa/p0-c72-economic-effect-receipt-reconcile.test.mjs`, fixture nativa previa C68 `qa/p0-c68-economic-reopen-certified-effects.test.mjs`, y workflow C72 bajo propiedad de este trabajo. No editar `typed-commercial-ledger.mjs` si no imprescindible, ni runtime/UI/PIN/Sync3/fotos/servicios Cloudflare.

## Causa raíz desde master real

C68 fuente fusionada [#869](https://github.com/jfcarpiopuntocom/friendly-123/pull/869) + puntuación [#870](https://github.com/jfcarpiopuntocom/friendly-123/pull/870) corrigieron falso `already:true` al comparar stock/caja/fiados con `f123_business_effects` por `opId`, pero el reintento **no coteja esos efectos con `typed_commercial_ops` ni `typed_commercial_payloads`**. Un efecto fabricado con saldo SQL ajustado puede cuadrar y recibir `already:true` aunque NO exista el recibo tipado; inversamente una venta `business-committed` podría conservar recibo mientras se eliminó tanto su efecto como las alteraciones financieras. El contrato del servidor ya realiza escritura atómica del efecto, la carga útil canónica y el receipt mediante `createTypedCommercialLedger` en la MISMA transacción DO, por lo cual falta verificar de forma read-only esta invariante cruzada al reabrir.

## RED antes de source (source-executed REAL SQLite, no mocks contables)

Crear test QA nuevo que importa las fuentes reales `prepareBusinessBaseline`, `installBusinessBaseline`, `createBusinessSqlExecutor`, `createTypedCommercialLedger` y usa `DatabaseSync` SQLite nativo con `transactionSync`. Baseline ficticio SHA del propio QA (NO HEAD Firebase real), 1 SKU y 1 fiado:
- control sano: `sale.record` 2×1999, `credit.payment.record` abono1000, `stock.adjust` recuento; `ledger.submit` da `stage=business-committed`, reintento fuente `already:true`, duplicado mismo opId no añade efecto.
- rechazar efecto económico sin `typed_commercial_ops` correspondiente;
- rechazar `typed_commercial_payloads` perdido para efecto confirmado;
- rechazar receipt `stored-for-application` (202) si conserva efecto económico;
- rechazar venta receipt `business-committed` cuyo efecto SQL y cambios stock/caja fueron retirados juntos;
- rechazar monto de efecto/caja alterados conjuntamente y divergentes de comando canónico, aun si C68 cuadra;
- rechazar receipt cuyo `kind`, `license`, `opId`, `receiptId` contradicen su payload;
- permitir receipt 202 SIN efecto genuino como intención pendiente y sin ingresos.
**RED real** GitHub Actions sobre source intacto; distinguir falla de harness de verdadera falta de rechazo.

## GREEN mínimo completo

En `reconcileCertifiedBusinessReadback` (solo rama `if(old)` de instalación/reentrada), leer filas de `typed_commercial_ops` y `typed_commercial_payloads` del mismo `license` en **la MISMA transacción SQLite**, verificar `receipt_json` parseable, `opId`, `kind`, `stage`, `receiptId === payload_hash.slice(0,24)`, payload canónico con claves permitidas; exigir bijección entre **efectos** y **recibos business-committed** de kinds con ejecutor real (`sale.record`, `stock.adjust`, `credit.payment.record`). Relacionar los deltas semánticamente (sale stock -quantity y cash +amount, fiado q0 cash +amount, recuento cash0 y delta físicamente permitido por tipo +SKU; **la cantidad absoluta de recuento exacta no puede deducirse sin orden temporal**, no fingir garantía). Los receipt en cola `stored-for-application` sin efecto son válidos; con efecto se rechazan. No generar ajustes, no borrar histórico, no entregar ACK si falta row, no tocar camino caliente de venta. Rechazar ausencia de tablas con efectos, y permitir baseline sin actividad/receipt.
**Límite explícito:** sin SHA256 síncrono del `payload_json` en Workerd, igualdad semántica + sello `payload_hash/receiptId` no demuestra autenticidad criptográfica de SQL manipulado coordinadamente; SHA verdadero se produjo al confirmar en ledger. No alegar prueba de Firebase HEAD real ni recibos firmados.

Actualizar QA antigua C68 para emitir operaciones por `createTypedCommercialLedger` **en lugar de llamar directamente al ejecutor sin receipt**: preservar sus negativos y positivos; no alterar ruta viva. Correr fuente C72 + C68 nativas, Workerd fiados y venta, Score CLI original100, GitHub workflows completos exact HEAD y Cloudflare Builds GET SHA merge SUCCESS.

## Métricas, aceptación y evidencia

PRECODE workshop + Notion **antes** de edits. PR funcional fuente separada, GREEN, CI, merge y Cloudflare SHA exacto. **No sumar puntos PORT** (92,0), porque Firebase HEAD / R2 / físico NO ocurren; quality79,4 hasta score PR separado tras fuente fusionada. Si la rúbrica quality admite +0,1 Business18,6→18,7/20 por confianza source-backed distinta de C68, hacer PR score posterior RED→GREEN y final CI; si prueba no alcanza, permanecer79,4. GO0/6, físico0/5. Auditoría antes de merge y reporte en workshop; nunca inventar una migración distinta de la misma friendly-123.
