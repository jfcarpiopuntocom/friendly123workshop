# C56 PRECODE · corregir C53 integración A→B→A económica sin falso ACK en SAME friendly-123

**Fecha Ecuador:** 2026-11-19. **App funcional:** jfcarpiopuntocom/friendly-123. Taller: jfcarpiopuntocom/friendly123workshop como registro permanente, nunca app aparte. **Sync3 intacto**.

## Baseline y auditoría previa
- Último master C55: `b100e2a757197d02d765494a428a366b77a2007d`; source C54 `6022725cd0d30ec42f6efbe0b35dd036221a762c`; **migración 90.5/100, calidad 78.3/100, físico0/5 GO0/6**, pesos fijos100.0.
- PR #854 ya abierta, QA-only 11/11 GREEN en base antigua `7c5f6637...`. Hallazgo crítico en revisión [comentario #7030898573](https://github.com/jfcarpiopuntocom/friendly-123/pull/854#issuecomment-7030898573): después de C54 `API.canal` (viejo) ya no emite durante modo2.0, por tanto test espera incorrectamente `sentLegacy.canal:1` donde debe ser `0`; tras logout debe ser1, no2.
- Defecto de evidencia más grave: en #854 `opsMap.size===0` y `puedeDespacharOpEnLegado===false` son fences, no transacciones; falta `business-committed`, readback stock, cash, effects/receipts. El Worker real `cloudflare-yparty-worker/src/index.js` NO instala baseline sintético por flag `WS_TEST_ONLY_INTERNAL_SEED=1`; para esto QA existente usa wrapper `qa/fixtures/seeded-real-yparty-business-worker.mjs`, cuya clase sí instala stock/caja certificado sintético.
- En QA, sembrar business baseline sobre un DO `-ops` con frozen Yjs deja bloqueo deliberado `Yjs history or nonempty economic store requires controlled migration` en `src/authoritative-business-sql.mjs`. Nunca simular que ambas fuentes se reconciliaron. El fixture C49 hace skip de frozen import SOLO en `-ops` para permitir baseline sintético, y mantienes real catalog import -cat. No tocar Worker producto, R2 real ni cuentas clientes.
- QA previa de C21a/C28/C40 ya verifica 1 venta; esta nueva suite verifica **secuencia 3 operaciones comerciales** en **dos clientes sintéticos A→B→A**, ajuste + 2 ventas y reinicio/failback exacto, con estado SQL comprobado. Nunca afirmar histórico frozen1 + 3 nuevos igual4 si -ops fue omitido.

## TDD y Ponytail

1. Crear branch C56 desde master C55; nuevo test QA file `cloudflare-yparty-worker/qa/p0-c56-commercial-cold-failback-receipt-workerd.test.mjs` tomando como ORIGEN la prueba no mergeada de #854 (no tocar su rama sin reserva), y nuevo workflow `.github/workflows/qa-port2-real-c56-commercial-receipts.yml`. Plan-first workshop, contacto con owner PR #854 mediante comentario GitHub ya enviado. Tras éxito cerrar #854 duplicada sin borrar su branch.
2. **RED:** ejecutar la prueba nueva contra real `src/index.js` sin baseline, exigir 3 `business-committed` + SQL stock/cash/receipts. Debe fallar. Mantener CD/CI como evidencia antes de corregir fixture. No admitir 202/fence como ACK.
3. **GREEN QA-only:** subclase test-only del `seeded-real-yparty-business-worker.mjs` ya reutilizado en C49 (no injerto nuevo, no duplicación de componentes). Sobre `-ops`, saltar import del historial sintético y **marcar explícitamente** esa limitación; -cat sigue certificado. Verificar 3 operaciones en SQL contra apertura: 5 items, cash 500, 2 ventas total3000, ajuste stock9, B venta => expected stock8, cash3500, effects3, receipts3, deuda3000. Prueba intento de replay tras vuelta A, efecto no doble.
4. Canal primario legado C54: bajo ON 0 envíos `API.canal` viejo y 0 sombras/ops/fotos; al logout 1 emisor viejo + sombras. Probar piloto nuevo por separado. Doble switch QA necesita ambos flags. Web Lock hung debe abortar sin perder fila.
5. Probar con Workerd real SQL, auth real sintético, compilado Yjs/yparty bundle sin red externa; TDD, PR con full GitHub Actions, Cloudflare build candidate. **No cambio de runtime, no deploy QA ON, no cliente, GO0/6 físico0/5.**
6. **Métricas:** evaluar HONESTAMENTE postmerge, no atribuir 0.5 migración salvo que prueba proporcione nueva capacidad del presupuesto original que aún no estuviera acreditada. Puede justificar mejora pequeña en calidad de sync/QA (p.ej. +0.1 a +0.2) si se verifican nuevos invariantes, pero no equivale a A→B→A físico ni historia real. Mantener score official90.5/78.3 hasta prueba, merge y score-only CI.

## Contratos de dinero/Ponytail
- Nunca modificar `docs/core/ledger.js` reservado PR #841; no calificar historial Firebase HEAD comercial sin fuente independiente.
- No correr DO/R2 en cuentas reales, QA Workerd local. PIN sintético, dos dispositivos ficticios, room aislada y QA flag OFF en producción.
- Mantener responsabilidad de pruebas de negocio/datos (stock, cash, receivable, receipt) separada de transporte Yjs (opsMap y WebSocket), y mantener exactamente una escritura por opId.
