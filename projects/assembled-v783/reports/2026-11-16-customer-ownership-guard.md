# v783 · Guardia de pertenencia cliente/licencia para inbox comercial (sin deploy)

## Contexto y hallazgo

- Base inmutable: `friendly123workshop@4992e1b0e0382b043f91c82816ba5423d2a94da1` (PR #35).
- Nueva frontera `credit.customer.payment.record` contiene `clienteId` y el `opId` real `customer-payment:<UUID>`, pero el nombre de IndexedDB de `app/docs/hechos.js` es `f123_hechos_db` y el namespace de `aislamiento.js` es `f123`, ambos a nivel de **aplicación**, no licencia.
- Por tanto la lectura de hechos del navegador y un ID sintácticamente correcto no prueban que el cliente pertenezca a la licencia. No puede habilitarse la escritura en inbox sin una autoridad independiente en el servidor.

## TDD y cambio mínimo

En `relay/injertos/yparty-worker/src/typed-commercial-ledger.mjs`, el constructor `createTypedCommercialLedger({sql,transactionSync,authorize,authorizeCustomer,clock})` acepta un proveedor **server-only** de pertenencia. Exclusivamente para `credit.customer.payment.record`, después de autenticar licencia/scope/principal y antes de cualquier lectura SQL, exige `authorizeCustomer({license,clienteId,principal}) === true`:
- proveedor ausente o que arroja → 503 `customer-authority-unavailable` y cero SQL;
- pertenencia denegada o valor no booleano → 403 `customer-not-authorized` y cero SQL;
- permitido → comportamiento tipado existente, `stored-for-application`, idempotencia por opId y conflictos 409;
- revocación exige comprobación **en cada reintento**, incluso si la fila ya existía, para no filtrar el recibo histórico.

`sale.record`, `expense.record` y `credit.payment.record(receivableId)` no necesitan este nuevo proveedor ni cambian sus bytes. Ningún campo libre de navegador se interpreta como rol/ACL. El único proveedor añadido se encuentra en la fixture Workerd **test-only**, con pertenencia del cliente sintético `client_1`. **No existe proveedor productivo aún** y `ws-capability-issuer.mjs` continúa sin permitir `ops:payment` a ningún rol; por tanto el nuevo tipo permanece inoperativo fuera de QA.

### Evidencia verificable

- [RED #43922740037](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43922740037) — 29/34 PASS, **5 FAIL funcionales** por chequeo de pertenencia ausente; no un fallo de fixture.
- [GREEN parcial #43922910599](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43922910599) — dos tests antiguos esperaban 409 por cambio de cliente aunque ahora se protege la existencia del recibo con 403 previo a SQL; un caso usaba identidad distinta a la fixture. Se ajustaron solo las expectativas y la fixture, sin desactivar comprobaciones; colisión con **dos clientes autorizados** sigue 409.
- [Workerd intermedio #43923082564](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43923082564) — 34/34 JS PASS; Workerd recibía 503 al faltar el proveedor QA, como manda el contrato fail-closed.
- [GREEN final focal #43923299893](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43923299893) — **40/40 PASS** (34 JS inbox, 1 Workerd SQLite real/reinicio/recibo y 5 pruebas locales de proyección).
- [Assembled QA amplia #43923299883](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43923299883) — **pendiente de resultado definitivo al escribir este párrafo**. Verificar log del head exacto antes de promover.

## Revisión de límites

- Este guard **no** es una base de datos de clientes, autoridad humana por persona, ejecutor de ventas ni ACK financiero. La implementación de un lector trusted de titularidad `clienteId ↔ license` con cambios/revocaciones verificables sigue pendiente.
- La transacción SQLite guarda el inbox, no ejecuta cartera; no afirmar transacción distribuida IndexedDB ↔ Cloudflare DO.
- No se alteraron datos cliente, claves PIN, `mock-backend.js`, `cartera.js`, Workbox/PWA, canal `ops`, la política de issuer ni la app publicada.
- No desactivar el callback para hacer pasar tests de producto: sin proveedor real **denegación 503** es la respuesta segura.
- `npm test` completo histórico permanece rojo en baseline y candidata. En ejecución post-PR35 [#43921531982](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43921531982) candidata 3138/3201 PASS, 59 FAIL, 1 cancel, 3 skipped; baseline 3078/3148 PASS, 66 FAIL, 1 cancel, 3 skipped. Comparación por nombres muestra un fallo exclusivo candidato en esa corrida: `retry backoff is 3,6,12,24,48 s and stops at 5 attempts; no red banner and no notice`. **No atribuirlo a este guard** sin reproducción; investigar la intermitencia. No GO comercial.
