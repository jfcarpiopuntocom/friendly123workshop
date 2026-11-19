# C30 PRECODE · puntuación reproducible del corte parcial C27+C29 · 19-nov-2026

## Estado verificado (NO estimado)
Producto `jfcarpiopuntocom/friendly-123/master@39ce4fd97219f0a811e7abb6d22f99a9de42f3fd`, tras [C27 PR #822](https://github.com/jfcarpiopuntocom/friendly-123/pull/822) y [C29 PR #823](https://github.com/jfcarpiopuntocom/friendly-123/pull/823) ambos fusionados. C29 RED 1/4 (3 fallos) [Actions #44621153142](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44621153142), GREEN 4/4 prueba de fuente exacta y **48/48 checks generales** en SHA `3b3b95a72b75831f82480f7b84491e9375bb7616`. C27 47 success + 1 skipped CodeRabbit. No cliente físico, todas QA flags OFF, GO comercial 0/6. Prior snapshot PORT 83.5/100 quality 75.6/100, assessor pinned to older C25 `6b59f66`.

## Créditos con rubrica fija sin mover 100 ni GO
El bloque `browser-cutover/typed-delta-and-legacy-retirement` tiene 2.5 puntos NO acreditados. C27 introduce una verdadera valla en `publicarOpLocal` para las operaciones marcadas por 2.0, y C29 hace que el filtro use tombstones de C21b en IndexedDB incluso antes de crear coordinador tras Safari reload. Esto es **producto real, ruta de publicación real**, QA-gated OFF, prueba RED→GREEN focal y controles globales. Como cambio mínimo de rúbrica, dividir los 2.5 **sin aumentar categoría**:
- 0.5 `preinit-legacy-opid-fence-c27-c29`, DONE, exact sha proof `docs/sync-yjs.js`, test fuente exacta y manifest v812; scope only pilot.
- 2.0 `typed-delta-and-legacy-retirement`, NOT DONE, requiere flujo comercial y reducción del viejo transporte en uso; no inventar.
Sum remains browser-cutover 10.0 /100 and overall fixed 100.0. PORT prospective 84.0/100, incremento +0.5 auditado; si revisión contradice esta distinción, mantener 83.5 y registrar por qué.

## Calidad
Durability +0.2 (17.8→18.0 out of 20) por bloqueo irreversible de duplicación después de recarga **antes** del init, no por tests duplicados. Quality prospective 75.8/100. Seguridad, fotos, físico no cambian. GO 0/6. Reviewer must distinguish QA test from rollout or actual customer PC/iPhone.

## Operaciones
- Edit ONLY `docs/engineering/architecture-2-port-score.json`, `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs` plus `test/p0-architecture-2-port-score.test.cjs` if needed. No shell, src, vendor, Worker, Cloudflare/R2 or reserved Gemini C28.
- Pin all current DONE evidence to exact reviewed C29 master commit so score validator checks source ancestry; update `assessedProductSha` both.
- New regression in existing score script verifies literal C29 durable fence source, exactly 0.5 split, source manifest hash and existence of RED→GREEN test.
- Run score CI and 100-point total, compare prior snapshot. GitHub checks exact SHA before merge. Preserve history; no inflated GO.
- Cost USD 0.00, no R2 writes/deploy.
