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

## Executed RED→GREEN evidence and checkpoint (16 November, 21:43 UTC)
- First browser run [43961288263](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43961288263) was invalid **fixture RED**, missing required product barcode; corrected commit `9975b065`. Never count this as product RED.
- Actual source-grounded RED at [43961709081](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43961709081), exact test-source checkout: **Chromium and WebKit each got HTTP 200 instead of required 507, 0 PASS/2 FAIL/0 SKIP**. Before status assertion both IndexedDB and A/B failure-injection assertions were satisfied. Root cause: batch returns success without strict local ACK.
- Minimal runtime fix `6676d6cb3c53e153d01eff0a369d692082faa50a`: use `guardarEstadoLocal(true)` before Yjs announcement; on failure restore only the affected products' prior `categoria` and `rev` plus its own movement tail if uncontested; otherwise fail closed rather than erasing peer edits. Distinguish quota 507 from unconfirmed 503.
- First real-browser GREEN [43962123515](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43962123515): **2/2 PASS/0 FAIL/0 SKIP** on Chromium/WebKit; rack POST quotas and two-tab CAS also **4/4 PASS** [43962123500](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43962123500).
- Release manifest now matches exact `mock-backend.js` SHA256 **d413ae729512204b8229b722536b5dd6612b4a1c82acf6f7b71ebc3175268e53**; independently computed original main SHA256 **56d4f48ad1a564aa683945a5b2d9fc26bca679dcc52d1e7007d9751057ab15c1** agrees with existing manifest. Commit `cf17d911`.
- Final workflow commit `417d94a9` also verifies manifest with Node crypto and executes three adjacent category behaviors (batch, rename, delete). Latest run [43962699508](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43962699508) **still in progress** at checkpoint.
- Imported-money manifest QA [43962699393](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43962699393) **SUCCESS**. Other integrated runs pending.
- Separate latest integrated authority QA failure [43960371269](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43960371269): revoked recipient observed **1 forbidden awareness frame** after a socket closes, 26 PASS/1 FAIL in relay block. This is a **security NO-GO**, unrelated to category patch; no relaxation, no production.
- Explicit coordination comment added to in-flight [PR #41](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/41) to preserve both rack PUT prevalidation and this batch strict-ACK change when integrating the large shared `mock-backend.js`.

### Next exact action
1. Read 43962699508 and same SHA integrated, credit, rack jobs; distinguish skips, failures and source SHA. If new red, diagnose fixture versus product and repair conservatively.
2. Revalidate full historical audit after category patch; compare to preexisting full RED and baseline, do not require preexisting broken legacy tests to be hidden.
3. Only merge to **workshop main** after category and adjacent gates are GREEN and reconcile #41; do NOT publish customer production. Next P0 separate PR: real relay revoke awareness frame, deterministic RED, Workerd authority send-boundary fix, repeated native tests, prevent remote data leak.
