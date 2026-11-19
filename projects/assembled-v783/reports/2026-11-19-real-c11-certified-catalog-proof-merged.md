# PORT 2.0 · C11 certificate for browser catalog cut · APP REAL · MERGED

Date: 2026-11-19. **Target product: `jfcarpiopuntocom/friendly-123`**, not workshop. Workshop holds this immutable audit log and plan only.

## Verified commits / tests
- [PR #791](https://github.com/jfcarpiopuntocom/friendly-123/pull/791) **MERGED**. Exact accepted head: `13ed04bf82f82b1c4f432fa9c781019cf02d80fa`. Merge / `master` verified: `1b147ad99f4fdbf6cf60d8f6a57e7f79bbe3ad4a`. All **18/18** check runs on accepted head completed SUCCESS before merge.
- [PRECODE plan](../plans/2026-11-19-real-c11-certified-cat-proof-precode.md), committed before implementation.
- [RED real Workerd #44538578828](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44538578828): HTTP GET/OPTIONS expected proof 200/preflight 204 but actual 426; 2 PASS, 3 FAIL.
- Intermediate GREEN candidate [#44539427171](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44539427171) **5/5**, after fixing SQL-hydrated Yjs map roots.
- [FINAL C11 exact SHA #44539969011](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44539969011) **5/5** on `13ed04bf`.
- [FINAL global PORT+Workerd gate #44539982849](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44539982849): `yparty-worker` **216/216 PASS, 0 skipped/fail/cancelled**; app sibling job PASS.

## What is actually integrated
- `cloudflare-yparty-worker/src/catalog-frozen-proof.mjs` is the product's server-only certificate reader.
- `cloudflare-yparty-worker/src/index.js` routes exactly `GET /parties/tienda/{room}-cat?frozen-proof=1` through Durable Object after confirmed QA flags; checks strict HTTPS Origin via `WS_CATALOG_ORIGIN_QA` including OPTIONS preflight.
- Requires fresh **Owner `cat:read` one-use bearer** in Authorization, central `WS_AUTHORITY.consume`, exact license/instance/room. No token/PIN in URL, logs or response; no content caching.
- The DO must have successfully certified its own frozen Yjs history in SQL (Gate D, `f123_frozen_imports`) and reopened snapshot+journal. Only the two public roots `productos` and `ubicaciones` can be materialized from Yjs placeholders. C9 validates their exact public field allowlist, disallowing `_meta`, money, contact roots and hidden costs.
- Response contains only `frozenHead`, state and vector SHA256, never data rows, Yjs frames, cash/stock receipts. No GET import route, no server writer change.
- The synthetic real Workerd test confirms one-use/replay deny, denial without cap, wrong-origin pre-consume rejection, safe preflight, rejection of uncertified private-root history, flag OFF and restart without a new frozen source request.

## Important causal insight for C12
Current C8 `createPublicCatalogBridge` constructs a new Y.Doc that **reauthors** sanitized rows under a fresh clientID. That is a correct privacy boundary for one-shot QA display, but publishing these structs onto an already certified frozen `-cat` room without a reader parity check risks competing Yjs writers/duplicate initialization. C10 permits one physical writer connection but does NOT solve semantic re-seeding after a certified history import. **Do not wire C8's pre-populated document directly to an active YParty provider**. First connect EMPTY read-only `-cat` Y.Doc with Owner `cat:read`, compare frozen HEAD and display state, then define a deterministic single-writer delta path (and signed/economic transaction boundary) before swapping the legacy catalog route. Keep Sync3 intact and operations typed. This is root-cause correction within existing gate, not a new acceptance gate.

## PORT score & commercial state
- Existing versioned operational score `projects/assembled-v783/quality/port-v1.json` (reviewed 2026-11-18) = **61/100** (economics20, identity16, photos7, migration10, mobile8, physical0); **0/6 GO gates certified**. C11 adds infrastructure but not an active route. No artificial score increment.
- Existing architecture quality `score-v1.json` (reviewed Nov 17) = **67/100**, confidence estimate not uptime.
- Cloudflare QA Worker as last read via connector still had 6 QA flags OFF and no `WS_FROZEN_HISTORY_SOURCE` binding nor R2; settings should be reread at cutover. `WS_CATALOG_ORIGIN_QA` must be configured for exact browser HTTPS origin; absent means browser CORS denied.
- No physical PC↔Safari A→B→A×2 and no certified actual Firebase source (prior real canary had missing parents). **Do not assert 80% operational replacement** or first-shop GO.

## Next Ponytail
1. Exact real Firebase HEAD + ancestor-complete frozen proof and R2 Service Binding (server-authoritative, no private browser upload).
2. Read-only browser public-catalog cold-join from empty Y.Doc using C11 certificate, signed cat:read and C9; prove zero private Y.Doc frames.
3. One authoritative writer cutover for catalog deltas without re-seeding, and business-committed typed -ops ACK; prove failback.
4. Physical PC Opera → iPhone Safari → PC, twice, <10s, same store/stock/cash/photos/roles.
