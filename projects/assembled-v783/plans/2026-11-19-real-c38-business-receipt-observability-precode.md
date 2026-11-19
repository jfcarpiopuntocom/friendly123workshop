# PRECODE C38 · recibo comercial 2.0 visible y fallo de envío NO silencioso (QA-first)
Fecha 2026-11-19 Ecuador. Base exacta `friendly-123/master@ec60623396d1f0bf3ef0267f828484cf17029ef2`, migración 85,5/100,0 · calidad 76,2/100,0 · GO comercial 0/6. Workshop solo plan; cualquier injerto debe fusionarse en el MISMO producto.

## Hallazgo verificado en código de producto
En `docs/sync-yjs.js` `publicarOpLocal`, rama `API.modoCorte20Activo === true`, el `submitCommercial` de C25 se ejecuta mediante `Promise.resolve().then(...)`. Si `res.fallbackLegacy === true`, intenta publicar 1.0 solo tras `puedeDespacharOpEnLegado(opId)`. En otros resultados de `submitCommercial` (**`committed`, `reconcileRequired`, `quarantine`, `durable-store-unavailable`**), el código retorna de la función sin notificar explícitamente al UI el stage ni el recibo. Toda excepción cae en `.catch(function () {})`: fallo silencioso en la capa de integración. Por otro lado `docs/mock-backend.js` ya guarda localmente antes de emitir y `src/port2-typed-ops-reconciler.mjs` ya dispone de outbox same-do-only y `onSettled`. **No crear segundo journal ni reenviar una operación ya latched a 1.0**.

## Meta Ponytail
Tener clasificación observable del resultado de `publicarOpLocal` en QA, conservando comprobante business-committed (misma licencia/opId/C15 receipt) y fallo/reconciliación no silencioso, sin alterar el estado de venta local, sin disparar un segundo movimiento, sin borrar outbox durable y sin hacer esperar el botón Confirm Sale por red. Resolver un único punto de integración, no rediseñar el motor.

## Plan antes de editar
1. Leer Notion fuente viva y reservas: `docs/sync-yjs.js` puede estar en edición por otros agentes; reservar solo si disponible y anunciar propiedad. Repo real master exacto.
2. RED en NUEVO test `test/p0-c38-business-receipt-observable.test.cjs`: ejecutar la función `publicarOpLocal` **extraída de fuente productiva** y stubs de coordinador fieles a C21a/C16a. Verificar al menos (a) `committed business-committed` produce notificación observable con `opId`/receipt una vez; (b) `reconcileRequired` o rechazo async no miente éxito ni hace fallback legacy; (c) `fallbackLegacy` solo si durable fence autoriza el mismo opId; (d) cambio de licencia/Y.Doc entre submit y resolución no publica resultados en otro notebook; (e) QA OFF conserva vía 1.0 síncrona. RED por no emitir estado y catch vacío.
3. GREEn aditivo mínimo dentro del original `docs/sync-yjs.js`: interfaz emitida para estado **solo bajo QA ON** e identificación por licencia/opId y coordinator para rechazo, clasificación estable; no exponer token/PIN/credenciales, no auto-ACK, no segundo writer ni doble UI callback; para confirmación remota usar exactamente `business-committed` validada por C15. La distinción `local saved` vs `DO committed` es central.
4. Extender pruebas existentes C31, C33 Workerd E2E y C36 exact-source; completar versión shell incremental y SHA oficial, GH CI 100% y PR separado; $0 Cloudflare/R2. Sin alterar checkout comercial ni flags actuales.
5. Solo tras merge auditar puntaje fijo; crédito máximo de 0,5 de `production-business-dispatch` 2,0 aún pendiente, calidad +0,1 si pruebas sostienen, GO 0/6. Aceptación física PC↔iPhone A→B→A×2 fuera de prueba sintética.

## Riesgos y rollback
- No interpretar `Promise rejected` como rollback económico si C16a pudo persistir en DO, no mandar por 1.0 en ese caso.
- No interpretar `committed:false` como falta de IDB ni permitir pérdida de hechos; clasificar `durable-store-unavailable` como no confirmado.
- Evitar pantallas de éxito remoto basadas en ACK local; no subir flag de cutover en tiendas. Revertir una sola PR si regression.
