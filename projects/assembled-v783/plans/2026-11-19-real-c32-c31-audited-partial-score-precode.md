# PRECODE C32 — reconocer crédito parcial C31 en la app REAL (19-nov-2026)

## Alcance, definición y evidencia previa
- Producto único: `jfcarpiopuntocom/friendly-123`; workshop es solo bitácora/planes.
- Base de producto ya fusionada: `master@07fada25fd9c6b3ee92d13752fb8497881bce12c`, [PR #826](https://github.com/jfcarpiopuntocom/friendly-123/pull/826), HEAD `0748c78461c31d191fa6ef4175a97d19f3846e2d`.
- C31 aporta en `docs/sync-yjs.js` el enrutamiento condicional del `oc-op-local` venta/ajuste/abono a `API.despacharOpComercialCertificada` cuando `API.modoCorte20Activo === true`; son tests exact-source con VM compilado + fake-indexeddb. Los 51 checks de CI de C31 se comunicaron PASS. No es despacho productivo activado, y no equivale a A→B→A físico.
- Score master antes de C32: PORT 84,0/100, calidad 75,8/100; GO 0/6, SHA assessed C29. Sync3 es el primer injerto 2.0, fuera del denominador pendiente.
- Rama reservada propuesta: `port2/20261119-c32-c31-audited-partial-score`. Ediciones limitadas a `docs/engineering/architecture-2-port-score.json`, `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`; workflow existente. No tocar runtime, Worker, Sync3, fotos, R2, Cloudflare ni datos reales; USD 0,00.

## Microhito elegido, presupuesto FIJO
- Preservar los 100,0 puntos y todos los grupos: desdoblar el saldo `browser-cutover/typed-delta-and-legacy-retirement` de **2,0** puntos no acreditados en:
  1. `qa-gated-typed-commercial-route-c31`: **0,5** punto, `done:true`, código real `docs/sync-yjs.js`, test `test/p0-c31-runtime-commercial-photo-role-cutover.test.cjs`, bundle C25 v810 intacto, manifest v813 SHA verificado.
  2. `typed-delta-and-legacy-retirement`: **1,5** puntos, `done:false`. Exige tránsito/retirada real 1.0 y pruebas físicas/certificación comercial, NO ganados por bandera QA.
- Score esperado PORT **84,5/100,0** (+0,5, delta baseline 16,0). Calidad **75,8/100,0** (sin crédito artificial: QA no acredita fiabilidad física). GO **0/6**.
- Anclar todas las URLs de milestones acreditados al commit C31 merge `07fada25fd9c6b3ee92d13752fb8497881bce12c`, y `assessedProductSha` en AMBOS JSON al mismo SHA.
- No repartir puntos por fotos ni rol C31 todavía: test foto-shadow solo asegura presencia de tokens, no E2E; no introducir calidad sin prueba.

## TDD real — orden
1. Cambiar test de score para exigir 84,5, portDelta 16,0, calidad 75,8, GO 0/6 y los subhitos 0,5+1,5. Ejecutarlo en rama ANTES de cambiar JSON/script y capturar fallo RED.
2. Cambiar JSON y validación del CLI: misma suma 100,0 y fuente real. Validar `publicarOpLocal`, `API.traducirOpLegadoAComando20`, `API.despacharOpComercialCertificada`, `API.modoCorte20Activo === true`, presencia exacta de C31 test y v0.8.13, checksum manifest de `docs/sync-yjs.js`. Conservar validaciones C29.
3. GREEN: `node --test test/p0-architecture-2-port-score.test.cjs`, `node scripts/architecture-2-port-score.cjs --json`, `node --test test/p0-c31-runtime-commercial-photo-role-cutover.test.cjs`; CI de branch con SHA final. No declarar GO ni hacer deploy.
4. PR en producto, merge solo después de green y ausencia de colisiones, actualizar Notion con SHA real y distinción merge/QA/comercial, workshop reporte posterior.

## Riesgos y reglas
- Nunca recontar puntuación por documentación, cantidad de PRs o helpers del workshop; fiscalizar SHA del producto.
- El enrutamiento ocurre tras acción local, asíncrono. Antes de habilitar QA/comercial deberá probarse ack visual y crash/reload/reintento, más carrera multipestaña TOCTOU, rol Team, S3/Safari y A→B→A ×2.
- No alegar que 84,5 significa 84,5% de clientes migrados. GO 0/6 sigue.
