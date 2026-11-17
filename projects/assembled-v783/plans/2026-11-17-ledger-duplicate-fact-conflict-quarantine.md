# P0 · Libro contable real: mismo ID, dos hechos divergentes no pueden ganar por orden JSON

**17 nov 2026, Ecuador. PLAN ANTES DE CODE.** Base candidata privada `jfcarpiopuntocom/friendly-123-injertos@d17e5bc259929b13a466360f5937ac9e52ee950f` PR9. Nueva rama propuesta `fix/ledger-duplicate-conflict-qa-20261117`. Only `docs/core/ledger.js`, nuevo `test/p0-ledger-conflicting-sale-facts.test.cjs`, nuevo workflow `.github/workflows/qa-ledger-conflict-quarantine.yml`, **sin aplicación comercial, sin PR12/13, sin despliegue**.

## Código preexistente y causa

`docs/core/ledger.js` es proyector puro de doble entrada, ya usado en `test/ledger-v1.test.js`. La función `dedupe(list,keyFn)` de v1 elige el **menor JSON** para el mismo `venta.id`, `ajuste.id`, `gasto.id` y `cartera.opId/id`, sin un error de conflicto: converge pese a orden desigual, pero dos hechos con la misma identidad y dinero distinto podrían cambiar silenciosamente la contabilidad. Pagos tienen `payoutConflicts` y evidencia, ventas no. No es un backend comercial en línea; si la vista ignora `errors`, el problema sigue aunque se reporte.

MDD JFC (31 oct) preserva ledger causal, idempotencia y forense; no autoriza migrar el backend comercial. La PR13 actual acaba de reproducir que YParty `ops:sale` permite alterar un mismo `opId` de 2500 a 1 centavo. No inventar que el código productivo usa la misma Y.Map; separar el límite de transporte del comportamiento del proyector `docs/core/ledger.js`.

## TDD y aceptación

1. Crear este plan en workshop y reserva en Notion ANTES de modificar fuentes; verificar ausencia de otra reserva del archivo. Nueva rama privada desde PR9 SHA especificado. 
2. TEST primero en `test/p0-ledger-conflicting-sale-facts.test.cjs` importando **módulo real** `../docs/core/ledger.js`: (a) dos ventas `id=s1` idénticas no duplican ingresos ni reportan conflicto, (b) dos ventas `id=s1` con precio 25.00 versus 0.01 independientemente del orden NO pueden producir un asiento de ingreso/stock arbitrariamente elegido **sin error** y deben quedar en cuarentena contable, (c) pagos/ajustes/fiado con IDs iguales y payload distinto deben ser reportados sin destruir hechos no controvertidos, (d) una venta genuina y otro evento distinto no afectado conservan su asiento y la suma Debe-Haber cero, (e) las correcciones lícitas necesitan hecho de reverso/nuevo id, jamás modificar opId previo. Capturar RED verdadero antes de editar módulo.
3. Fijar comportamiento: `dedupe` en todas las categorías relevantes detecta **más de un JSON distinto bajo la misma clave**, los marca en `errors` con `factKind/factId` y no los incluye en el proyector; conserva registros originales en la entrada para forensics, nunca borra snapshots ni reescribe ventas. Repeticiones byte-idénticas pasan. Usar error estable, no incluir PII ni payload. No tocar `payouts` que tienen su propia política forense ya.
4. CI Node22 ejecuta nueva suite y `test/ledger-v1.test.js` con logs TAP y SHA; no merge a producción. Se analiza contrato real antes de cambiar para evitar romper casos legítimos.
5. Esto **no arregla** el write path ni el outbox o los consumidores contables de `errors`; no GO hasta validación del commit typed append-only por rol/opId, UI de cuarentena y pruebas físicas, reservas PR12 respetadas.

**Ética y seguridad:** sólo pruebas sintéticas; fuentes originales quedan intactas hasta RED. No se modifica el Worker YParty, PIN central, foto, clientes, producción ni PWA. Backlog WCAG próximo release es P2, no interfiere. Documentar todos los SHA CI en workshop STATUS y Notion.