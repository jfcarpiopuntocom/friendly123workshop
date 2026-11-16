# P0 · category batch must not ACK without a durable local copy
Date: 2026-11-16 (Ecuador)
Branch: fix/20261116-category-batch-durability
Base: a8b351ad2f97c0bbc3600357b618c1b4ef1d003c

## Observed source, distinct from PR #41
- In app/docs/mock-backend.js, POST /api/categorias/cambiar validates input, then immediately mutates all affected products' `categoria` and `rev`, appends `edicion-categoria`, notifies `avisarCatalogoCambiado()`, and returns HTTP success.
- Unlike PR #39's rack POST, this path has NO explicit `await guardarEstadoLocal(true)`; the generic `_fetchInterno` finally schedules best-effort persistence.
- Thus a 200 can be sent even if both IndexedDB and the A/B fallback reject saving. That is a source-grounded bug hypothesis; test before implementing.
- Separate active PR #41 modifies the same large mock-backend.js for rack PUT; DO NOT edit/merge each other's branch or lose the POST quota/CAS fix.

## Test FIRST (Superpowers)
1. In an isolated synthetic browser, create a rack + product in category A. Force both `OCEstadoIDB.guardarConRevision/guardar` and A/B localStorage journal writes to fail with QuotaExceededError.
2. Call POST /api/categorias/cambiar A→B. Expect non-2xx `CATEGORY_STORAGE_QUOTA`, and old category A still visible (no leaked provisional state/Yjs event). Restore storage and retry: expect success and ONE durable category B after cold reopen. Repeat Chromium + WebKit.
3. Confirm RED on exact source SHA with GitHub Actions and no-production-network guard. Record raw logs and test counts. Never weaken assertions or introduce sleeps just to pass.

## Minimum runtime fix (Ponytail full)
- Reuse the existing `guardarEstadoLocal(true)`, `debePersistir=false`, strict error classifier and rollback convention from rack POST. No new library, framework or serializer.
- Validate before mutation; hold catalog announcement until after durable commit.
- Capture only touched product category/rev, appended movement tail and stamp. If strict save fails, roll back only if every touched product still has this edit's revision and the movement tail is unchanged. If concurrent changes make rollback ambiguous, retain evidence and block unsafe future writes rather than deleting peer facts.
- Treat quota 507 separately from recoverable 503; don't auto-replay a batch rewrite on stale state. A failed update is never success.
- Validate existing category rename, category deletion, rack POST, stock, credit/expenses and 585-target integrated suite.

## Gates and handoff
- New RED regression first; apply runtime patch only when RED confirmed. Then browser GREEN and adjacent suite; compare full audit with same SHA. Archive CI exact SHA and failure list.
- All work stays in friendly123workshop. Existing production, issuer, customers and stored notebooks untouched. NO-GO for client deployment or merging until gates and concurrent PR reconciliation.
