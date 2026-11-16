# Dinero.js — injerto monetario browser-first

**Estado:** pendiente de trasladar el código real v783; este directorio es el único lugar del adaptador reutilizable. No afirmar instalación hasta que existan archivos revisados y CI sobre SHA de workshop.

Contrato: centavos enteros y redondeos deterministas; venta, crédito, pago parcial, comisión, reembolso, gasto, reconciliación y liquidación no pueden duplicarse por reintentos/recargas. Conservar identidad `opId` y valores previos, sin convertir montos a `number` inseguro en transporte.

Prueba de aceptación en `apps/friendly-123/` y `qa/browser/`: 19,99 de deuda - 5,99 de abono = 14,00; 2,34 gasto intacto; comisión transferida se marca una vez, no vuelve a descontar stock. Sin tocar producción ni service worker.
