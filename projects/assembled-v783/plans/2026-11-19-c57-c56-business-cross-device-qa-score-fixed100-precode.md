# C57 PRECODE (condicional) · medir C56 contra presupuesto fijo 100,0 en friendly-123

Fecha Ecuador 2026-11-19. **Misma app:** `jfcarpiopuntocom/friendly-123` 1.0→2.0 por injertos open-source; `friendly123workshop` solo bitácora/precode/evidencia; Sync3 intacto. **Baseline oficial C55** migración 90.5/100.0, calidad78.3/100.0, GO0/6, físico0/5, restante9.5. *No incrementar por expectativas.*

## Prerrequisito C56 fuente QA
- [PR #856](https://github.com/jfcarpiopuntocom/friendly-123/pull/856) debe fusionarse en REAL producto solo con 11/11 CI GREEN, SHA exacto Cloudflare SUCCESS. HEAD Workerd test Green `dda644b448542bb67c329f5e73179ce0a4a3084a`, run [Actions 44679028373](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44679028373) 1/1 PASS, 0 skip, 2.29 s: 3 business-committed sale/adjust/sale A→B→A, stock 5→4→9→8, cash500→3500cents, effects3 receipts3 debt3000, no duplicate on replay, IDB legacy fence0.
- **RED previo auténtico** [Actions 44678705439](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44678705439) detectó NO business-committed receipt en real Workerd sin synthetic baseline (contrasta con falsos verdes PR #854). QA GREEN usa exclusivamente la clase `qa/fixtures/seeded-real-yparty-business-worker.mjs` ya existente (C49), certificado sintético; omite Yjs frozen -ops en QA y mantiene frozen -cat; no pretende combinar historia real con baseline económico ficticio. C54 primary old send guard validado (0 al cortar, 1 en failback).
- #854 11 green en base anterior C54, auditada incompatible con nuevo primary guard y sin readback SQL, [review de portón](https://github.com/jfcarpiopuntocom/friendly-123/pull/854#issuecomment-7030898573); cerrar como duplicado una vez #856 fusionada.

## Rúbrica fuente y crédito limitado si se cumplen todas las pruebas
- Product `src/port2-cross-device-failback.mjs` y `docs/sync-yjs.js` YA ensamblan C21a/C25/C54, probado ahora con 3 cambios comerciales y SQLite real en dos clientes VM. No nuevo proveedor, no nueva app. Es nuevo nivel QA **money/stock** por opId.
- **Si se considera nueva capacidad genuina:** original grupo offline-failback fijo5.0, partida `verified-cross-device-downpath` pendiente1.5 se divide: NUEVA `c56-workerd-commercial-three-receipts-a-b-a-qa` 0.5 DONE (source `src/port2-cross-device-failback.mjs`; evidence blob exact merged product SHA), `verified-cross-device-downpath` **1.0 PENDING** exclusivamente dos ciclos físicos PC Opera↔iPhone Safari/PWA con fotos, dinero, PIN y desconexión. Browser partial and physical dimensions unchanged. Migración resultante **91.0/100.0**, restante9.0 (rubric100.0); *solo si el auditor valida fuente/CI exacta y no existe doble acreditación previa de ese comportamiento*.
- Calidad `sync` 15.7→**15.9/20** (+0.2 en certidumbre Workerd/retry/cash replay); resto intacto, total calidad **78.5/100.0**, `previous=78.3`, físicos 0/5, GO0/6. La etiqueta SYNTHETIC dentro test impide afirmación de comercial.
- No conceder puntos de `real-firebase-head-complete`2.5, `r2-service-binding-installed`2.0, `production-business-dispatch`0.5, ni histórico real, ni primer cliente.

## TDD score-only
1. **Esperar C56 merged** exact GH green and CF success; leer los 2 scorecards y validador en master postmerge.
2. Commit **RED primero** en `test/p0-architecture-2-port-score.test.cjs`: score91.0/78.5, before calidad78.3, pending9.0; c56 milestone0.5 DONE source real, remaining cross-device physical1.0 FALSE, exact merged SHA and weight5.0, GO0/6 físicos0.
3. **GREEN** solo `docs/engineering/architecture-2-port-score.json`, `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `docs/engineering/architecture-2-port-score.md`, todos pesos y evidencias recalcados SHA real, no abrir código runtime.
4. Comprobar CI score-only 11/11, merge, exact Cloudflare build SUCCESS y registrar Notion/workshop. Si cualquiera falla, no acreditar; distinguir test Workerd sintético y dos aparatos físicos nunca testados.

## Propietarios, seguridad y límites
- No alterar PR #841 / `docs/core/ledger.js` reservado. No tocar clientes, R2 buckets, Firebase real, PIN/roles, ni activar QA flags. PR #856 solo QA; PR C57 score-only. Fuente principal se mantiene en friendly-123.
