# PRECODE PORT2 C34 — puente de ventas reales hacia comando tipado sin doble contabilidad
Fecha: 2026-11-19 Ecuador.

## Alcance exacto
Producto: `jfcarpiopuntocom/friendly-123`. Workshop solo plans/checkpoints. Base inicial `master@f569de099d6044688fe82750ba5cc54f43b8b788`, PORT 84,5/100,0 y calidad 75,8/100,0, GO comercial 0/6. Sync3 sigue siendo injerto 2.0.
El agente C33 tiene reserva exclusiva para archivos nuevos `cloudflare-yparty-worker/qa/p0-c33-sync-yjs-cutover-workerd.test.mjs` y workflow; C34 no los toca.

## Hallazgo exacto en producto
- `docs/mock-backend.js` confirma venta local con `guardarEstadoLocal(true,true)`, luego emite `_opVenta={productoId:p.id,delta:-cant}` a `emitirOpStock("venta",_opVenta,true)`.
- `docs/sync-realtime.js` crea `op={opId:uuidCorto(),tipo,payload,...}` y lanza `oc-op-local`.
- `docs/sync-yjs.js` C31 `_traducirOpLegadoAComando20` requiere `payload.cantidad` y `payload.amountCents` (o total/precioVenta). Como la venta real solo emite delta, devuelve null; por ello la ruta comercial C31 NO hace submit tipado para esta operación real.
- `cloudflare-yparty-worker/src/authoritative-business-sql.mjs` exige precio de apertura certificado y stock suficiente, y suma amountCents a caja. Fiados, cortesías, precios especiales, ventas con faltantes y compras parciales no deben representarse falsamente como cobros de contado.
- Reproducir RED en el test exact-source antes de tocar `mock-backend`. Debe fallar traducción de venta normal o carecer campos, y pasar rechazando las modalidades no representables.

## Intervención Ponytail propuesta (nunca inventar saldo)
1. ÚNICO código funcional permitido: `docs/mock-backend.js`, en la emisión estrictamente posterior al commit local de venta (bloque `_opVenta`). Añadir únicamente metadatos para traducir una **venta de precio certificado exacto**, dinero completo y no fiado/cortesía. Conservar `productoId`/`delta` sin alteración, `opId` de emisor existente, orden de guardado y flujo de 1.0.
2. En venta no representable exactamente (fiado, cortesía, pago parcial, precio especial) dejar mensaje legacy sin `cantidad` ni `amountCents`; C31 deberá devolver null y NO inventar comando económico. No modificar contrato de backend Workerd.
3. Agregar test nuevo `test/p0-c34-real-sale-envelope-contract.test.cjs` que lea bloques exactos de `mock-backend.js` y `sync-yjs.js`, ejecutando la conversión en VM; no facade copiada. Pruebas normales + negativos (fiado/cortesía/parcial/descuento/centavos inválidos, valor exacto/moneda/stock).
4. Regenerar sello versión/manifest con herramientas oficiales; solo si gate reproducible, preservar PWA y usar v0.8.14 incremental. Test release + CI antes de fusionar.
5. No convertir este hook en autoridad económica ni cambiar UX de Confirm Sale: el ACK del DO y el doble escritor siguen pendientes de pruebas físicas y de la migración del histórico. Ningún punto nuevo hasta auditoría independiente con SHA y rúbrica fija.

## Archivos C34 exclusivos
`docs/mock-backend.js`; nuevo `test/p0-c34-real-sale-envelope-contract.test.cjs`; nuevo workflow C34 si hace falta; sellado `docs/version.json`, `docs/version-manifest.json`, `docs/sw.js`, `docs/dashboard.html`; no `docs/sync-yjs.js`, no score files, no C33 QA, no Worker, no Cloudflare, no R2.
Cualquier reserva nueva en dichos archivos detiene la edición y exige reconciliar; zero spend USD0.00.

## GO/rollback
PR primero en rama `port2/20261119-c34-real-sale-typed-envelope`, tests RED→GREEN, 0 datos reales, QA OFF y fuente exacta. En fallo: dejar draft y conservar hallazgo, no merge. Sin permiso comercial ni desplegar tienda de Belén. Sigue GO0/6.
