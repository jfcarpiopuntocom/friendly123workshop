# Gate A · cobro autorizado Owner/Admin/Team · cierre de tres capas (18 nov 2026)

## Punto de partida y alcance cerrado
- Orden vigente JFC: Owner, Admin y Team registran cobros y abonos a fiado; solo Owner/Admin ajustan stock. Fuente: https://app.notion.com/p/41b1642b67f381fbab5cf45ac55aabd3
- Rama aislada `chatgpt/20261118-gate-a-payment-roles`, base exacta PR #113 `e867eeeb399a8ddaf33269d221a0e02e9471a4b0`; PR #113 sigue perteneciendo a Claude/Opus. `friendly123workshop` almacena código y evidencia persistentes. Sin afectar LIVE.
- Modelo operativo congelado: calidad 67.0/100, port 41.0/100 y 0/6 gates certificados. Este parche no mueve la puntuación: el router `src/index.js` aún debe cablear `authorizeReceivable` y `applyBusiness` con baseline real.
- Tres archivos fuente: `app/cloudflare-worker/ws-capability-issuer.mjs`, `relay/injertos/yparty-worker/src/ws-authority-client.js`, `relay/injertos/yparty-worker/src/authoritative-business-sql.mjs`. Pruebas: issuer test, SQL Workerd test; no tocar `src/index.js`, `yparty-piloto.js`, `sync-yjs.js`, fotos ni licencias reales.

## Contrato exacto
1. El ceiling issuer permite `ops:payment` al dueño y, con grants explícitos vigentes, a Admin y Team. No conceder `ops:adjust` a Team ni permitir `ops:read` por esta acción; rol declarado en cliente nunca es autoridad.
2. El verificador del relay acepta exclusivamente `ops:payment` por canal `-ops`, solo ticket con ese scope y solo principal Team/Admin verificado centralmente; ningún WebSocket raw-Yjs.
3. El ejecutor SQL `credit.payment.record` aplica 1..saldo en centavos para Owner/Admin/Team autorizados con scope `ops:payment`, `opId` único y recibo `business-committed` tras la misma transacción del saldo/caja. Rechazar principal ajeno, falta de scope, fiado ausente/exceso, overflow y ticket revocado.
4. Preservar `stock.adjust` solamente Owner/Admin y `sale.record` existentes. El test viejo que esperaba denegar cobro a Team se corrige a **ticket revocado**, manteniendo cobertura de rechazo de identidad inválida.

## Ponytail / pruebas
- TDD: añadir primero aserciones que fallen con la fuente actual (nuevo test de scopes/relay, test Workerd de cobros por Team/Admin); no cambiar ni desactivar gates ni cuotas. Verificar RED exacto con CI; después modificar solo esas tres fuentes, CI GREEN exact-HEAD en los tests focales, lectura GitHub del commit.
- Si CI carece de harness/preparación, registrar fallo como test/infra sin atribuir cambio comercial. Pasar al dueño de `src/index.js` evidencia del contrato para su cableado de una sola pieza con autoridad de receivable real.
- Gate A sigue NO-GO hasta ruta del router y migración/autoridad/datos reales. Sin Customer Payment automático: `credit.customer.payment.record(clienteId)` es contrato distinto de `credit.payment.record(receivableId)`.
