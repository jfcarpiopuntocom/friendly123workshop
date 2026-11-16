# Test repair: failed business rename must use one authoritative synthetic namespace
Date: 2026-11-16. Branch test/20261116-rename-fixture-canonical, based on main c6fb947efb3611fd831fc90a2f0ba8dd8021411d.

## Source/real failure
Full historical native Chromium/WebKit audit [43965240844](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43965240844): 3220 total, 3162 pass, 54 fail, 3 skip, 1 cancel. Case `failed business rename keeps the old identity and informs the owner` (test/ui-integrity-v341.test.js around 253) failed: expected `Original fixture business`, actual `VERSIÓN DE PRUEBAS`.
Read actual UI source `src/app/app-inline-01.js` (also built `docs/app-inline-01.min.js`). `oc-negocio-actualizado` first paints event name and then schedules `cargarNombre()`, which asks GET `/api/instancia` for the *canonical actual namespace*. Test only monkeypatches `OCTienda.nombreActivo` and emits fake event, while the real backend fixture still says `VERSIÓN DE PRUEBAS`. That inconsistent fixture causes legitimate canonical reload to replace its unsupported invented label after restoring monkeypatch. Test does not establish a real product bug.

## Exact minimal correction (Ponytail full / Superpowers)
1. Preserve original test failure. Patch **test fixture only**, not runtime: install synthetic fetch interceptor **before** emitting the event, let GET `/api/instancia` return the synthetic authoritative `nombreNegocio: 'Original fixture business'`; preserve existing POST `/api/instancia/nombre` 503 rejection. All other fetches pass through unchanged. Ensure test checks saved name and visible error after rejected POST, not a stale transient label.
2. Retain all original test assertions. Run exact original browser case through Playwright Chromium and WebKit with no-production network guard and CI logs. If it still fails, investigate asynchronous event ordering and do NOT weaken assertion.
3. No product code, business data, credentials, changes to sync or storage. Do not touch concurrent rack toggle PR #52. Main latest may move; reconcile before merge.
4. Once green, choose workshop-only integration as test cleanup. Full historical still NO-GO until 54 failures triaged; keep physical PC↔iPhone Safari/PWA two A→B→A cycles mandatory.
