# v783 — Dinero.js en abonos NUEVOS (plan y ledger Superpowers)
> **Alcance autorizado JFC**: ensamblar componentes importados sin rehacer la app; browser-first, local-first, con failback, en `friendly123workshop/projects/assembled-v783`. No deploy; pilotos intactos.
> **Fecha**: 16 noviembre 2026; base inmutable `7e4b798354371972c8bb72c8fd08381eb7cc9abc`. Rama aislada `sol/v783-credit-dinero-20261116`.

## Diseño: tres alternativas y elección fundamentada
1. Modificar `mock-backend.js` en la ruta HTTP /abonar: duplicaría reglas frente a callers de `AMG.Cartera` y arriesgaría otro escritor — descartada.
2. Modificar la función única `AMG.Cartera.registrarMovimiento` dentro del `cartera.js` existente para **nuevos abonos** usando el `window.F123MoneyImported.percentage(m,100).baseCents` importado; retornar hechos en el ledger original y sellar la regla del monto — **elegida**.
3. Usar `typed-commercial-ledger.mjs` remoto para registrar abonos: aún NO ejecuta negocio, no autoriza `ops:payment` ni tiene ACK final — prohibido encender por ahora.

### Especificación de aceptación
- Nuevo `cartera_abono` (no `cargo` ni reparto `cartera_aplicacion`) usa el adaptador Dinero.js 2.0.2/BigInt existente, half-up: 1.005→1.01 y 2.675→2.68. No crear otro motor financiero.
- Cada abono importado lleva el sello `moneyEngine:'dinero-2.0.2-half-up'` + `montoSolicitado` original, además del monto final en dos decimales. Hechos históricos sin sello no se recalculan.
- Si hay `opId` ya persistido: leer primero el hecho antes de registrar; un reintento del importe original debe devolver el mismo hecho aun si el flag `f123_dinero_qa=0` o el componente desapareció. Cambiar cliente, importe, tipo, motivo o vínculo usando `opId` existente→409, nunca segundo pago.
- Una fila legacy (sin sello) se verifica usando el redondeo legacy original tras activar Dinero; no se reescribe.
- Si el componente no está, arroja o flag explícito=0: **para nuevas operaciones** se conserva la ruta legacy local-first, SIN doble escritura ni cambiar los hechos existentes. Fallo de la escritura durable no produce éxito.
- No tocar saldo derivado, `AMG.Hechos.registrar`, `mock-backend.js`, Sync3, fotos, PIN, Yjs, PWA ni rol/issuer.
- Cambio de `cartera.js` exige regenerar solo SHA-256 exacto correspondiente en `docs/version-manifest.json`; no cambiar SW ni hashes de otros recursos.
- TDD RED→GREEN en VM navegador sintético; suite focal completa Chromium/WebKit; CI de PR en SHA exacto; auditar `npm test` heredado sin atribuir errores baseline a nueva funcionalidad.

## Pasos (superpowers:executing-plans + test-driven-development)
- [ ] 1. Crear `app/test/p0-credit-payment-money-imported.test.cjs` usando `test/helpers/browser.cjs`, `cartera.js` y proveedor `money-imported.min.js`. RED: cantidad histórica/rollback, dinero half-up para pagos nuevos, mismo opId tras desactivar adaptador, 409 a cambio de intención, fallo durable 503 sin hecho, deuda tipo cargo intacta.
- [ ] 2. Ejecutar CI sintética RED con el test nuevo, verificar que FALLA por behavior y no por setup. Conservar ID de CI y detalles.
- [ ] 3. Implementar mínimo en `app/docs/cartera.js`: función de normalización para abonos nuevos; dedupe según sello, monto original e historia, sin nuevo storage ni transport. Evitar normalizar antes de buscar el opId existente.
- [ ] 4. CI GREEN en commit exacto; reparar regresiones sin modificar la intención ni ocultar errores. Correr focos existentes de fiados, dinero, roles, ventas.
- [ ] 5. Actualizar `app/docs/version-manifest.json` con SHA-256 real leído en CI; verificar suites de hashes; workflow pre-merge y pruebas integradas. Crear PR de revisión.
- [ ] 6. Actualizar Notion con RED/GREEN/SHA/diff/NO-GO. Sin deploy a clientes; merge únicamente si validación y revisión finales son verdes.

## Review Focus
1. **opId duplicado con rollback0 o sin adaptador**: debe devolver mismo hecho y no cobrar dos veces.
2. **opId de otra persona/tipo/importe**: 409 y cero hechos extra.
3. **Hechos históricos sin sello**: no cambiar ni reinterpretar.
4. **Abono vs cargo de venta**: no cambiar saldos de fiado por mutar el cálculo de una venta.
5. **Fallo del importador o persistencia**: fallback legacy o error durable según el caso, nunca ACK falso.

## Rulings
- Sólo abonos, nunca `fiar` ni `aplicarAbono`, para mantener exactamente el contrato del ledger de deuda derivada.
- La compatibilidad entre versiones queda limitada por presencia de `montoSolicitado` en hechos nuevos; equipos con JS histórico podrían responder 409 al reintentar un importe con half-up distinto, pero nunca escribir otro movimiento bajo el mismo `opId`. Esto debe ensayarse físicamente antes de producción.
