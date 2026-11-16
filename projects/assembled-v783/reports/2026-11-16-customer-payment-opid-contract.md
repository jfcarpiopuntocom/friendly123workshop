# v783 — pago de cliente: hecho local → inbox tipado, sin falso ACK

**Fecha:** 16 noviembre 2026. **Baseline:** `friendly123workshop/main@0fef969ddfd704d034f26bd61eb63a0b147d10b7`. **Rama:** `sol/v783-customer-payment-contract-20261116`.

## Hallazgos causales (código real)

1. `app/docs/plan-pagos-ui.js` genera `customer-payment:<UUID>` para cada intención de abono, persiste esa referencia antes de enviar la petición y usa `customer-allocation:<UUID>` para una operación posterior **distinta** de asignación de dinero.
2. `app/docs/cartera.js` guarda `cartera_abono` con `clienteId`, `monto`, `motivo`, `opId` y opcionalmente `moneyEngine`/`montoSolicitado` de Dinero.js.
3. El inbox remoto `src/typed-commercial-ledger.mjs` solo conocía `credit.payment.record(receivableId)` y rechazaba `:` en `opId`; el pago real no podía enviarse sin cambiar el ID o confundir deuda/cliente.

## Injertos realizados (NO activos en producción)

- Tipo **aditivo** `credit.customer.payment.record` con `clienteId` explícito, `amountCents` entero positivo y `opId` literal `customer-payment:UUID`. La lista de caracteres seguros ampliada es específica de este tipo; venta/gastos/`credit.payment.record(receivableId)` mantienen la validación anterior. Conserva `ops:payment` sujeto a autorización server-side; el issuer de clientes no lo habilita.
- `app/src/credit-payment-command.mjs::creditPaymentCommandFromDurableFact({license,opId,readPersistedFacts})` recibe una función de lectura **real de `AMG.Hechos.todos()`**, aguarda su respuesta y proyecta exclusivamente el `cartera_abono` persistido. No toma amount ni cliente de un formulario, no recalcula medio centavo ni crea hecho nuevo. Sin hecho, duplicado, tipo incorrecto, centavos imprecisos, documento corrupto o lectura fallida → error, cero comando. No envía PIN, motivos, perfiles, rol ni datos de contacto.
- Preserva estrictamente `cartera_aplicacion` como acto diferente: ninguna asignación FIFO, ajuste automático ni sinónimo entre `receivableId` y `clienteId`. No se cambió ningún `index.html`, Service Worker, `cartera.js`, `mock-backend.js`, `hechos.js` ni relay desplegado.
- El recibo SQLite sigue **`stored-for-application`, NO `business-committed`**. No hay consumidor comercial conectado; no puede computarse GO de clientes, ni usarse `ops:payment` hasta issuer humano y pruebas real-device.

## RED→GREEN observado en Actions

- **RED validación:** [CI #43919194697](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43919194697), 24/28 pasan, **4 fallan funcionalmente** (se esperaba 200 con `customer-payment:<UUID>` y tipo nuevo, se recibió 400). Las negaciones ya existentes conservaron su comportamiento.
- **GREEN preliminar servidor:** [#43919348818](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43919348818), 28/28 JS, 1/1 Workerd; el job total falló porque el test nuevo del proyector aún no existía.
- **RED del proyector:** [#43919532744](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43919532744), 4/5 fallos esperados por módulo aún ausente; 28/28 JS + 1/1 Workerd seguían verdes.
- **Fallo intermedio de test (no producción):** [#43919718600](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43919718600) confirmó 4/5 clientes y localizó aserción de input de test mal formada (array en vez de objeto); se corrigió sin relajar aserciones.
- **GREEN funcional de cliente:** [#43919874378](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43919874378), 28/28 de inbox, 1/1 Workerd y 5/5 proyección = **34/34**.
- **RED ampliado en Workerd:** [#43920078344](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43920078344), el nuevo pago SÍ estaba guardado pero el endpoint **test-only** `/test-payload` seguía leyendo el `opId` fijo de una venta. Se corrigió exclusivamente esa fixture con whitelist de dos IDs sintéticos, nunca endpoint de producto.
- **GREEN focal final:** [#43920270798](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43920270798), **34/34 PASS, 0 FAIL, 0 SKIP** en SHA `0e026851e3a6a6b0ee1cae9db9abef1dae65cc7d`. Real Workerd SQLite conserva los bytes canónicos después de reiniciar DO, colisión 409, revocación 403, sin falso ACK.
- **Integración general actual:** [#43920363291](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43920363291), ejecución iniciada sobre SHA `30b186e420c7fab85f5688e6b1fb244709650d21` con los nuevos tests insertados en la suite; no dar éxito anticipado. `npm test` full histórico permanece ROJO con fallos también en baseline.

## Próxima frontera / NO-GO

Sin ejecución autorizada en servidor que aplique operación exactamente una vez a negocio, haga readback y emita ACK `business-committed` por opId, **no activar ningún transporte ni escribir en producción**. El código del proyector se puede integrar detrás de la futura cola/outbox durable sin tocar dinero local hoy. Faltan roles humanos, scopes efectivos, filtrado de Yjs por rol, fotos reales SHA/readback y dos rondas físicas PC→Safari/Opera→PC.

**Seguridad:** el emisor desde navegador puede proponer un comando, pero no puede dar fe por sí mismo de licencia, rol o persistencia remota; eso corresponde al issuer y consumidor. Las pruebas usan solamente valores sintéticos. Códigos de prueba no se despliegan.
