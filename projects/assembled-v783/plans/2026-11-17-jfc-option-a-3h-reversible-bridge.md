# JFC Decision A · bridge reversible de 3 horas — single owner, no new PR — 17 Nov 2026

## Decision and freeze
User explicitly selected Option A (Linus minimum usable reversible bridge), superseding an all-or-nothing full 2.0 launch as a prerequisite to testing. Three sequential slots: 0-30 min freeze/consolidate; 30-90 min protect sales and resumes; 90-150 min store-level QA-only flag and physical acceptance; 150-180 min reversible rollback. These are work boxes, not a promise of asynchronous delivery.
Port full architecture metric and six frozen gates remain tracked (no moving goalposts): on workshop main 36.0/100, 0/6, architectural quality 67.0/100 combined candidate. Bridge QA readiness is a separate decision, not a new score/gate. Never claim all six certified for limited bridge.

## Consolidated immutable checkpoints
- PR #93 (photo SHA browser) merged as main 8d06da099b063e48f21893b5826e954c0722de80, pre-merge 14/14 CI GREEN at 048b3d2.
- PR #94 (Team photos signed read only) merged as main cb82e69ddd15b09c9f33e795eb76dcacf00e5f18, Workerd 12/12 44206238712.
- PR #95 (v2 atomic IndexedDB without Web Locks, legacy v1 preserved) merged as main e50ee2ed9cd573ca30725299465df71c30cf529d, prior SHA 7ab0f61 12/12 workflows GREEN.
- PR #90 and PR #96 closed as duplicates/red approaches, no deletion of their original evidence. Production friendly-123/master SHA 45757cac5d9268402049c0fba90cccdece150ac6 untouched. GitHub Pages on workshop may deploy test assets automatically; that is not user production or QA flag activation.

## Step 2, owner sales and fast fallback (implementation NOW, plan first)
Source app/src/yparty-piloto.js and its served generated docs/vendor/yparty-piloto.min.js are one deliverable. **One-line routing policy**: only `cat` may open new read-only-safe secure WebSocket; all `ops` (money/sales) and `fotos` Yjs use proven legacy encrypted relay until a genuine SQL business executor exists. Photo SHA HTTP uses own separate bridge. Existing doc.local Yjs and outbox never discarded.
Authorization failure is not a successful sync: subscribe to `authorization-error` from AuthorizedYProvider. Destroy stale socket, retain doc/outbox and invoke legacy relay. Reduce fallback timeout 30s to <=7.5s for catalog new transport, and preserve existing `visibilitychange` / `pageshow.persisted` handlers in sync-yjs.js that pause and resume all three channels. For non-owner & invalid Owner PIN, fallback unchanged.
TDD: existing source-extracted pilot test must flip from two providers cat+ops to exactly one cat + ops legacy; explicit test that an Owner ops channel NEVER allocates new provider and invokes legacy fallback. Built vendored bundle test checks real browser-executed code has same policy. Test simulated `authorization-error` and timeout fallback, no duplicate providers or lost local doc; check persisted queue by independent tests.

## Step 3 and 4 — guardrails
Store-level opt-in QA only: do not flip a global flag. Catalog/photos via 2.0 only for Owner and where signed+SHA; Team private Yjs remains denied. Money always old relay until typed executor business-committed. No migration all stores (D remains for full port). Do not enable on user shop or pilot customer before physical QA.
Run with real iPhone Safari and Android Chrome: sale, photo, network outage/restoration, app background/foreground, device cold join and EXACT opId/cash/stock. User must provide or perform physical devices; synthetic CI is not proof. Final switch OFF→legacy with no missing money/fotos→ON and compare receipts, before any production go. If physical verification cannot be done, remain QA-only no production deploy.

## Rollback
Disable per-store QA flag, continue encrypted legacy transports and local durable outbox, no deletion/migration; check old and new counts/receipts/opIds. Revert only new workshop source/served bundle commits if CI fails. Quality and port metrics scored strictly on tested evidence, no penalty for safe limited bridge.


## Discovered integration trap: fallback was global, not per-channel (no moving goalposts)
Actual app/docs/sync-yjs.js `usarRelayHabitual()` and `volverAlPiloto()` switch BOTH `API.canal` and `API.opsCanal`; `canalesPiloto=[catalog,ops]` and money goes into the read-only new WS. A pilot-level one-liner that calls `usarRelayHabitual()` on `ops` would also turn catalog back to legacy, violating Option A's hybrid read path. This was found immediately after source+served vendor changes; not credited as working until closed.
Minimal complete change in the SAME original bridge, no new PR: create always-legacy `API.opsCanal` even when catalog pilot is active; `canalesPiloto` contains only the catalog; legacy ops object is reused and never paused during catalog failback/rejoin. Catalog fallback may create only a legacy catalog transport. Keep historical entire pre-pilot fallback when pilot flag off. Use existing same encrypted Y.Doc/IDB/outbox for ops, no ledger writes via new WS.
TDD behavioral test executes extracted *actual* sync-yjs.js control functions with mocked `crearCanal` and pilot, verifies: catalog new + ops legacy simultaneously, ops object identity constant across catalog fallback and return, money updates reach ops legacy without duplicates, and both functions preserve serialized IDB. Old code must fail this test. Existing browser/authority and published-bundle tests must pass afterward.
Do not advertise 2.0 catalog usable until both source and served compiled vendor + hybrid manager pass, with backend flag OFF for customers. This is precisely within user-approved step 2, not a new gate.
