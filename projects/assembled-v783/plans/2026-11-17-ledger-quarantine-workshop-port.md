# 2026-11-17 · Port contable P0 a friendly123workshop (NO DEPLOY)

## Procedencia y base
- Fuente aprobada para reutilización técnica: [injertos PR #14 DRAFT](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/14), head `5cc50a5c7ec54e2110190d0d218773d53c84de0e`. RED `44071653968` 22/26, GREEN `44072113973` y `44072127790` 29/29 ×2 (en **repositorio fuente**, no en este port).
- Destino workshop `main`, rama `port/20261117-ledger-conflict-quarantine`; reserva [Notion](https://app.notion.com/p/41b1642b67f38127b11bc899388a7fe2).
- Base observada: `app/docs/core/ledger.js` con `dedupe` que escoge menor JSON para misma identidad. Port mínimo aditivo del módulo puro y test, sin Worker ni cliente, ni cambios en producción. Plan guardado ANTES de pruebas/código del port.

## Objetivo
Misma `venta.id`, `ajuste.id`, `gasto.id` o `cartera.opId/id` con contenidos canónicos *distintos*: impedir que la proyección elija arbitrariamente dinero; omitir temporalmente solo el ID en conflicto y reportar `errors[{factKind,factId,motivo}]` sin datos personales. Duplicados idénticos siguen idempotentes independientemente del orden de propiedades. Conservar hechos independientes y doble entrada.

## Secuencia TDD
1. Incluir test real `app/test/p0-ledger-conflicting-sale-facts.test.cjs` desde PR14 SIN modificar assertions. Crear workflow raíz específico con Node22 y `node --test` de `app/test/ledger-v1.test.js` y test nuevo. Confirmar RED en branch con runtime original y documentar SHA; si CI no ejecuta, no fingir RED.
2. Portar solo el diff validado de `docs/core/ledger.js` de la PR14 a `app/docs/core/ledger.js` workshop, verificando que no se pierde ninguna modificación ajena y que no se altera API pública.
3. Reejecutar GREEN focal exacta; auditar diff, `git` SHA y resultado del workflow. Revisar mínimo regresiones cercanas/integradas antes de fusionar. NO fusión automática.
4. Registrar evidencias y pendientes en Notion y `STATUS.md` después de certificar estado (si se cambia STATUS, observar trabajo paralelo y no sobreescribirlo).

## Gates y límites
- Baseline `ledger-v1` + 9 nuevos casos: mínimo 29/29 PASS, 0 fallos/skip. `errors` debe indicar conflicto; la UI futura **no debe presentar balances parciales como definitivos**.
- Esta capa es de **lectura/proyección**: no autoriza emisión de ventas ni corrige el P0 YParty `ops:sale`/opId mutable observado por PR13.
- No tocar `yparty-worker` reservado por PR12, ni `sync-yjs.js`, `sync-outbox.js`, `avanzado-extra.js`, ni datos reales, ni PINs, ni proveedor/flag. Browser-first; PWA diferida.
- Sin GO hasta firma central Owner/Team, commit inmutable tipado `opId`, coldjoin real y 2 ciclos físicos Opera PC ↔ Safari iPhone ↔ PC de stock/ventas/fotos/dinero/acceso. Reversión sencilla: cerrar PR aislada sin merge.
