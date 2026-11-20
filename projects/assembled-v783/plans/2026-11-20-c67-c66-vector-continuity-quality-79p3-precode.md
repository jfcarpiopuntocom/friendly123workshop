# C67 PRECODE · evaluar de forma acotada continuidad de vector Yjs C66 en calidad arquitectónica

**Fecha:** 20 nov 2026 (Ecuador), MISMA app `jfcarpiopuntocom/friendly-123` 1.0→2.0 y Sync3 conservado. Workshop solo PRECODE/tests/registro, no app alternativa. Los scores actuales **previos a C67** son **92,0/100,0 transición y 79,2/100,0 calidad**, con GO comercial0/6, físico PC↔iPhone0/5, rúbricas originales100.0 fijas. La calidad ya reconoció C64 +0,1 en durabilidad; C67 no duplicará ese mérito.

## Fuente real verificada ANTES de acreditar

- [C66 PR #866 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/866), código funcional de producto `master@a46da3753ec23ecee2606f5ed206fe4c6ba10f25`.
- **RED real** [GitHub Actions run 44735648192](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44735648192), test source-executed contra `openExistingStore` + import real + SQLite nativo de Node22 + Yjs, positivo PASS / negativo FAIL por `true !== false`: se aceptaba `documento_bloques` sintácticamente correcto pero SIN el reloj del escritor original.
- **GREEN** [Actions 44736130197](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44736130197) contra head final `cee89827c5f62a08fddd069f8769410447db5736`: C66 **6/6 nativo SQLite** (control importe Yjs, compaction legítima, sustitución, pérdida/corrupción de certificado, legacy sin vector, borrado legítimo), importador original 9/9, C64 3/3, Tienda/Workerd 5/5 y CLI score original100 PASS. Total **15/15 GH workflows verdes**, incluidos producto QA, auth, stock, Sync3, release-control y dos-tab Chromium/WebKit.
- **Cloudflare Workers Builds, GET cuenta REAL**: script `friendly-123`, rama master, exact merge SHA `a46da3753ec23ecee2606f5ed206fe4c6ba10f25`, `build_outcome:success`, build UUID `b091735c-0cc5-4351-9c29-f5894c836544`. No escritura Cloudflare.
- C66 injertó **Yjs nativo** `encodeStateVector`, `decodeStateVector`, `encodeStateVectorFromUpdate`, vector compacto guardado en la MISMA transacción SQLite del certificado y bloques originales, comparación de relojes sobre snapshot+journal. No retrocede relojes por borrados legítimos. La dominancia causal es garantía **necesaria**, no hash íntegro de cada campo/evento, ni prueba Firebase REAL, ni validación GO.
- El histórico Yjs -ops posee baseline independiente `opId→payload` de C14, C66 no lo sustituye.

## Cambio mínimo de score — TDD real

1. Escribir **primero test RED** `test/p0-architecture-2-port-score.test.cjs`, exigir transición92,0, calidad **79,3**, anterior79,2, delta+0,1, durabilidad 18,6/20 desde18,5 y fuente C66 real + tests negativos fuente nativa. JSON aún79,2 provoca RED legítimo. Ejecutar GH Actions del head de test-only (no calificar un harness fallido como RED).
2. GREEN cambiar `docs/engineering/architecture-2-quality-score.json`: calidad 79,2→**79,3/100,0**, `durability`18,5→**18,6/20,0**, previous18,5, comparison previous79,2; evidencia exacta PR #866 y `lastAuditedProductSha=a46da375...`. Mantener los otros seis ejes de calidad sin cambios, peso suma100, physical0.
3. Actualizar assertions C66 del validador `scripts/architecture-2-port-score.cjs` sin reponderar hitos del PORT: **92,0/100,0 continúa**, Firebase HEAD real 2,0 PENDING, R2 real binding2,0 PENDING, otras puertas4,0, GO0/6. Comprobar código real `src/frozen-vector-baseline.mjs`, transacción importadora y tests C66 RED/positivos/negativos. No crear hitos nuevos ni crédito adicional por añadir workflow.
4. `docs/engineering/architecture-2-port-score.md`: agregar resumen C67, mantener documentos históricos anteriores.
5. Correr validadores, GitHub CI integral SHA final, revisar diffs y reservas, merge sólo verde y Cloudflare Build del SHA exacto final. Persistir Notion + workshop informe con SHA y GO. Cualquier prueba rota impide merge.

**Archivos en propiedad exclusiva C67:** `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`, `docs/engineering/architecture-2-port-score.md`. No tocar fuentes funcionales C66, `docs/core/ledger.js` PR #841 (reservado otra IA), Sync3, PIN, negocios, Cloudflare/R2 ni flags QA. Sin activar producción ni operaciones reales.
