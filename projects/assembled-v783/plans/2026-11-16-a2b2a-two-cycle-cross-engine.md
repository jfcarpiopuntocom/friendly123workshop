# v783 · Two-cycle A→B→A native Chromium/WebKit local-first convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task, with Superpowers systematic debugging and Ponytail minimal reuse. Commit plan BEFORE test code and do not skip RED evidence.

**Goal:** Exercise two successive synthetic PC-like Chromium ↔ phone-like WebKit sales/reconnection cycles across **separate browser profiles** with the same synthetic license, preserving four unique receipts and exact physical inventory after durable reload. Prevent shipping an untested dual-device regression. This test is NOT physical iPhone QA nor provider end-to-end certification.

**Architecture:** Reuse existing `test/helpers/e2e-app.cjs` `startServer/openDevice/enterAs/installPump/pump` to serve the **exact assembled `app/docs`** from localhost with outbound HTTP/WebSocket denied. Two distinct Playwright browser engines create genuinely separate IndexedDB stores; the Yjs `doc.update` pump moves serialized updates directly, bypassing real transport. The success criterion is both devices observe the same already-persisted sale IDs and stock after two cycles A→B→A with at least one cold browser page restart. It proves local Yjs projection/replay, **not relay durability, authentication or real PIN**.

**Tech Stack:** Node22 `node:test`, Playwright Chromium+WebKit installed from `package-lock.json`, native IndexedDB, existing Yjs importer/pump, production-network guard; no new modules/dependencies.

**Spec:** [MDD-approved local-first/forensic #5](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac), project [AGENTS.md](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/AGENTS.md), and [START-HERE](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/START-HERE.md). User's strict north: same license/PIN→same business and inventory/ventas/dinero/fotos/offline convergence, A→B→A twice in <10 s physically. THIS lab isolates stock+sales, not the full commercial gate or speed of internet.

## Global constraints
- Immutable starting main `368f81b21a2a664be54a3c23fdf8008fb9f4e96d` after PR #66 and STATUS checkpoint; branch `qa/20261116-a2b2a-two-cycle-cross-engine` isolated from concurrently running [PR #67](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/67) full 3K native audit. Never alter that PR or source runtime.
- No real customers, records, PINs, photos, usernames, or network. Fixed synthetic license `F123-SYNTHETIC-AUDIT-ONLY` and purely synthetic product.
- No changes to `app/docs`, PWA, SW, Workbox, YServer, issuer, relay or production; no new fixture engine or data store. Reuse existing `test/helpers/e2e-app.cjs` unchanged if feasible.
- Do not claim physical Safari/PWA convergence. This helper spoofs Owner/Admin and injects Yjs updates without production transport, so it deliberately does not verify human authority or network.
- If true functional RED is observed, preserve it in Actions, diagnose at source with competing merge, never bypass by fake stock reset or broad retry. No release.

## Review focus / likely failure modes
- Sales duplicate on reconnect, e.g., same `opId` counted twice or one receipt disappears.
- Stock PN lost because catalog snapshot overtakes causal movement and replays stale stock.
- B cannot read A product because prior catalog Yjs seed was not durably committed.
- A cold reload from IndexedDB restores stale stock and overwrites B after merge.
- Asynchronous Yjs projection publication not yet durable when test checks state; avoid treating a fixture race as product failure.

## Task 1 — create minimum real-browser two-cycle regression (RED or GREEN honestly)
- [ ] Read `test/helpers/e2e-app.cjs`, `test/p0-stale-fichas-browser.test.cjs`, `test/sync-latencia-dos-aparatos-v599.test.cjs`, `qa/browser/browser-first-commercial.test.cjs` first (already inspected); keep existing helpers intact.
- [ ] Create ONLY `projects/assembled-v783/app/test/p0-a2b2a-chromium-webkit-stock-sales.test.cjs` with one test, Node22 timeout 180s. Start localhost server, Chromium browser A (desktop 1280×800), WebKit browser B (phone viewport), both separate contexts same synthetic license, attach pageerror collectors. Enter synthetic Owner A and Admin B (role shortcut acknowledged limitation).
- [ ] A creates initial product with 8 items. Wait for Yjs local durable seed; use `installPump([A,B])` for full state join, then `pump(A,B)`. B must see same product ID/8 units; any failed initial join is a real RED that requires diagnosis, not test deletion.
- [ ] Two ordered cycles: A sells one with distinct explicit `opId`, pump A→B; B must see A's receipt once and stock minus 1. B sells one with distinct explicit `opId`, pump B→A; A and B must each see all receipts exactly once and identical stock 8−2×cycle. Cold-reload both pages **in their existing browser contexts**; re-enter test role and perform full-state catch-up (no extra server); revalidate receipts/stock and absence of ghost. Repeat cycle 2.
- [ ] For correctness include at least one failed/duplicate replay of a sale opId with same payload, and confirm original `ventaId` and stock unchanged after Yjs catchup, if current app accepts explicit opId. Don't confuse retry with a new sale.
- [ ] After every write, verify `/api/ventas/todas` + `/api/productos` and after reload verify durable readback. No asserts on simulated network latency; report boundary.
- [ ] Execute in CI with the real assets and both browsers, preserve actual failure stacks. No code change to app until RED cause isolated and approved.

## Task 2 — minimal no-deploy native CI
- [ ] New workflow `.github/workflows/v783-a2b2a-two-cycle-cross-engine.yml` uses locked npm, official Chromium+WebKit, `node --require test/helpers/sin-red-produccion.cjs --test`, full original test (no filters) and archived SHA/TAP exit. Run as draft PR; no production network.
- [ ] If RED, classify as Yjs seed/readback/timing/stock merge/authority, no false assertion that transport is live. If GREEN, add synthetic test to reusable regression map, compare integrated 585 (will increase only if included in integrated runner) and close only QA gate, not customer GO.
- [ ] Update Notion living handoff, main `STATUS` only after merge and cross-check branch/main; leave original PR67 audit independent. Do not claim physical GO.
- [ ] All code, plans, logs and actual SHA in workshop before 5h stop. No files only in local session.

## Next separate task outside this branch
Real two physical A→B→A cycles in PC Opera and iPhone 16 Pro Safari/PWA with same license/PIN, remote ACK and photos/financials remain **mandatory** before deploy; no remote business backend P2 without separate explicit approval.


## Observed native RED #1 — initial seed boundary, before any sale (preserve)
[Actions run 43995967052](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43995967052), exact head `dab0ae54df49173a0a0f1d2e739a55eb5dd49777`, **1 test, 0 PASS, 1 FAIL**, 0 skip, 17.3s. Error `initial full-state join: browsers did not converge through the Yjs test pump; {"A":{"stock":8,"receipts":[]},"B":{"receipts":[]}}`. Thus initial A's product existed in durable local store and had 8 units; B had **no product** after Yjs full-state test pump. No sales attempted; this is NOT evidence of lost sale/stock, and not real hardware or relay. The artifact preserves exact SHA/TAP and original failure.

**Source root-cause hypothesis, not yet proven:** Existing `app/docs/sync-yjs.js::conectarStore` registers `oc-catalogo-cambiado` event handler `pedirSeed`, which defers `sembrar()` to `setTimeout(...,0)`. `installPump([A,B])` captures `Y.encodeStateAsUpdate(OCYjs.doc)` immediately after `OCSync.confirmarCatalogoDurable()` in current test; local durable ACK is NOT proof that this *asynchronously scheduled* Yjs map publication completed. Existing `sync-latencia-dos-aparatos-v599.test.cjs` waits for source Yjs seed before full doc exchange, but uses arbitrary 1500ms delay. Prefer evidence-based wait for exact *product ID* existing in A's actual `OCYjs.mapas.productos` map, followed by normal existing `installPump`; no 1.5s sleep, no fake inventory, no manipulation of source app or stock. This strengthens the gate: IF product never enters source Yjs, fail explicitly at publication boundary. If B remains empty AFTER source Yjs exists, diagnose B's `API._store.aplicar`, `canal.recuperando`, catalog and role authorization with read-only diagnostics; no reduction of assertions. This is minimal test-only change and no claimed production fix.

**Ruling:** Add one `A.page.waitForFunction(id => Boolean(window.OCYjs?._store && window.OCYjs?.mapas?.productos?.has(String(id))), productId, {timeout:12000})` before `installPump`, retaining all initial join/receipt/PN/cold-readback requirements. Run exact native CI again; on RED continue causal forensic before any app changes.


## Observed native RED #2 — real YDoc seed confirmed, B business projection still missing
[CI 43996476244](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43996476244), head `d616f2a93c6e6281d9e6c0b4687c442723ead036`, 1 test / 1 FAIL, about 8.5s. The new `A.page.waitForFunction(id=>OCYjs.mapas.productos.has(id))` boundary COMPLETED (no timeout), so product was indeed seeded into source Y.Doc A. Yet after existing `installPump([A,B])` full-state exchange and subsequent `pump()`, B business readback still had NO product: `initial full-state join ... {"A":{"stock":8,"receipts":[]},"B":{"receipts":[]}}`. This disproves the hypothesis that *only* premature source Y.Doc capture caused this RED; do not present that timing as a fix or claim local convergence.

**Next diagnostic step before any runtime changes**: instrument the test ONLY, on failure, to report synthetic-safe booleans and counts for both A/B: A/B `OCYjs.mapas.productos.has(productId)`; count of Yjs map keys, `OCYjs._store` existence, `OCYjs.estado`, `OCYjs.canal.recuperando`, `canal.headAcceso`, `OCSync.catalogoPropio().productos` count and same product existence, latest `__aplicarErr` from helper; optionally `OCYjs._diag().recuperacionLocalPendiente` boolean. Do not log actual PIN, key, license, product financial details or full state. If B YDoc lacks product, failure at pump/CRDT; if YDoc has it but B catalog lacks it, failure at projection authority/recovery/merge. Compare `B.OCYjs._store.aplicar` output and actual `OCSync.aplicarCatalogo` preconditions in source, without modifying business runtime. Keep all red assertions intact. Third CI run with full evidence will choose exact next root-cause branch. No arbitrary stock reset, fake API receipts, or bypass of genuine access check.
