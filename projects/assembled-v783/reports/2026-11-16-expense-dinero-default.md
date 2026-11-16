# v783 · Dinero.js importado en gastos nuevos y ediciones — CI y failback

**Fecha:** 16-nov-2026 (Ecuador). **Fuente de verdad:** `jfcarpiopuntocom/friendly123workshop/projects/assembled-v783/`.

**Cierre verificable:** [PR #30](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/30) **MERGED** a `main`; commit de integración [`4fa5d69b01c624b9f84e8b48c2c9c58128f1d5a2`](https://github.com/jfcarpiopuntocom/friendly123workshop/commit/4fa5d69b01c624b9f84e8b48c2c9c58128f1d5a2). La CI de la PR [Actions #43903314957](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43903314957) corresponde al head exacto `ef6857ffc97ae42b89ce32f9f1867a98d3885e6c` y **491/491 PASS, cero FAIL/SKIP**; no presenta GO comercial ni físico.

## Implementación real; no se duplicaron injertos

El adaptador existente `src/money-imported.js` utiliza **Dinero.js 2.0.2/BigInt** y expone `window.F123MoneyImported.percentage(...).baseCents`. En `app/docs/mock-backend.js` se añadió una única función mínima `_montoGastoEnCentavos(v)` que usa `percentage(v,100).baseCents / 100` para **solo**:
- `POST /api/gastos`, nuevos gastos;
- `PATCH /api/gastos/:id`, cambio explícito del monto.

La lógica de venta, repartos de comisiones, stock, Yjs, Team, Worker, foto, cash/transfer y el límite de persistencia `_payoutDurable` NO cambiaron. El registro actual de gastos y el outbox mantienen su mismo formato. **Ni el vendor importado ni Workbox/PWA fueron reescritos.**

Casos: USD1.005 a 1.01 y USD2.675 a 2.68, half-up, sin colas binarias. Gastos históricos ya registrados no se recalculan por habilitar la biblioteca. **Failback** explícito `f123_dinero_qa=0`: vuelve a `Number.toFixed(2)` para nuevos gastos y ediciones; si el componente falta o lanza excepción, usa la misma ruta de respaldo, sin crear movimientos dobles. Montos no positivos, no finitos o no admisibles son rechazados ANTES del commit; roles existentes intactos. Es una modificación de cálculo en la edición nueva, no migración histórica.

### Evidencia TDD y CI

1. [RED legítimo #43901189170](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43901189170): **2/5 PASS**, exactamente 3 diferencias de creación/edición/historia nueva, antes del fix. Un RED previo por `Cannot find module 'playwright'` fue **error de montaje del runner**, NO bug de dinero; se solucionó con `npm ci`.
2. [GREEN #43901548117](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43901548117): **5/5 PASS**.
3. Dos tests nuevos añadidos: falta/excepción del componente sin duplicar gasto y rechazo de montos inválidos. **En CI ampliada** una fixture global precargaba Dinero con `F123_QA_IMPORTED_MONEY=1`; los dos tests de «ausente» fallaron porque el adapter no se retiró del VM (5/7). Se corrigió **solo el aislamiento del test** mediante `vm.runInContext('window.F123MoneyImported = undefined',w)` más aserción `typeof`, sin rebajar la semántica ni el código comercial.
4. [GREEN de gastos, regresiones e integridad #43903303997](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43903303997): **7/7** nuevos + **10/10** anteriores de gastos/recibos/roles/Yjs/fotos + **2/2** originales de integridad.
5. [CI integral focal exacta #43903314957](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43903314957): **491/491 PASS** = 105 autoridad/Team, 8 browser, 5 doble pestaña, 22 cancelación/fiado/stock, 28 dinero/comisiones, 234 financiero importado, 7 gastos nuevos, 1 asignación de gasto desde Chromium, 33 fotos/backup, 21 roles/IDB y 27 relay/issuer/SQL. **0 FAIL, 0 SKIP.** Chromium y WebKit del runner instalados oficialmente. Sin datos reales ni red hacia el negocio.
6. `docs/version-manifest.json` actualizado **solo para el hash** `./mock-backend.js = sha256-040b1eb68c7a4e214a995d8f4b8cf75c30b1424844da8973f50a8d935b7d3f1f`, determinado por SHA del backend exacto en [CI #43901707125](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43901707125); shell `sw.js` no alterado, porque PWA se pospuso.

## Gates abiertos, NO-GO de publicación comercial

- El inbox `typed-commercial-ledger` solo da `stored-for-application`; NO se conecta todavía a la transacción comercial exact-once stock+dinero ni a su ACK posterior.
- La proyección Yjs por allowlist aún NO está enlazada a salas employee read-only y servidor con emisor humano real. No dar acceso a Y.Doc privado con PIN, costos, clientes y dinero.
- El issuer actual no concede `ops:expense` ni `ops:payment`; mantener **fail closed**, nunca abrir para pasar fixtures.
- Fotos remotas necesitan persistencia de bytes originales con SHA/readback/ACK real.
- Falta aceptación **física** 2 rondas PC → Safari/Opera → PC, misma licencia, PIN y roles, con convergencia/latencia y recuperación.
- La **auditoría global `npm test` histórica continúa RED** con numerosos fallos compartidos por candidato y baseline; 491 pruebas focales no equivalen al paquete completo ni a activación del piloto.
- No publicar ni tocar `friendly-123` producción, IDB/PIN de clientes, PWA o datos reales en esta fase.

**Siguiente paso coordinado:** Codex/Claude/Sol deben leer este informe, `START-HERE.md` y `STATUS.md` antes de tocar la candidata. Todos los cambios se hacen en **este mismo repo**, componentes de Codex preservados. Priorizar ejecutor comercial idempotente y ACK durable real antes de activar canales remotos.
