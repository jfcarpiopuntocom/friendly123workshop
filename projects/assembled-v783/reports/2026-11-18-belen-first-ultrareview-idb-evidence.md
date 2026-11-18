# 18 nov 2026 · Relato de ejecución Belén-first · dos P0 y un primer injerto real

## Sitio comercial
- v0.7.91 SHELL v791 master `ea6c173aa1d708cb9cbf2561044455e21c733e5a`. Safari dashboard Owner fue validado físicamente por JFC en conversación. No cambiar cliente durante esta ronda.
- YParty 2.0 flag OFF en `docs/sync-rollout.json`. No ejecutar issuer de tickets ni activar QA mientras P0 #1/#2 y E2E completos no estén certificados.
- Métricas conservadas: calidad 67.0/100 (±4 juicio), port 57/100 (0/6 GO); ver quality/PORT-STATUS.md.

## UltraReview #756: propuesta de contención en app real
- PR [#765](https://github.com/jfcarpiopuntocom/friendly-123/pull/765) DRAFT, no merge, no publicación, sobre v791.
- RED [#44383332467](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44383332467): catálogo raw Owner/finanzas llegaba al proveedor; pilot local `synced` permitía `accesoListo` antes de legado.
- GREEN [#44383742152](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44383742152): piloto rechaza raw Y.Doc (usa encrypted legacy) y requiere `canalSombra.recuperando===false` + `accesoListo()` (HEAD/causal guard).
- RED [#44383967452](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44383967452): photo SHA HTTP authenticated was still transmitting bytes without E2E.
- GREEN [#44384163782](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44384163782) `fe28314aef11b814a272b37a4335d7af67876290`: five tests including no raw YDoc, causal barrier, photo HTTP fail-close and no second writer; rollout still OFF.
- IMPORTANT: hard stop/fallback is interim containment, NOT actual encrypted-YParty implementation; no score credited. `release-control` appropriately rejects unshelled runtime; keep DRAFT, no hotfix for dormant feature until full E2E adapter + signed-off QA.

## Belén: fiados Safari localStorage cuota — primer injerto real
- User/Belén primary report (Oct24): https://app.notion.com/p/4031642b67f38194a024cea8832b105c. Active LIVE `docs/plan-pagos-ui.js` fails closed on localStorage quota, so prevents sending an unsaved payment but also cannot collect with full storage. `test/fiados-quota-cliente-4d.test.js` preserves fail-closed legacy contract.
- PR [#766](https://github.com/jfcarpiopuntocom/friendly-123/pull/766) DRAFT: `src/pago-intento-idb.mjs` creates IndexedDB atomic intent register with SHA256 business namespace, client+kind, original opId, cross-tab transaction, cold readback, replace/remove only matching opId. No current UI has been switched to it; zero customer data touched.
- RED valid replay [#44386208104](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44386208104): five tests fail on true pre-module branch because the durable IDB module doesn't exist. This is a proof of absence, not test of incorrect old payment behavior.
- GREEN [#44386022218](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44386022218) on `e26aa88ee64a8091ce006a2c99a0bbb9d08b3a63`: real fake-indexeddb transactions, five tests pass including concurrency, tenant isolation, restart, conflict and quota fail closed. No Safari physical, backend receipt, or integration test yet.
- Next wiring: `docs/plan-pagos-ui.js` prepayment allocation + generic `ocEnviarAbono` with dual-store migration and same opId across retry, avoid duplicate movement on receipt/failed allocation, browser low-storage WebKit & Chromium test; only then shell/version and physical acceptance. Source of first test is **not** proof that Belén can collect yet.

## Cold-join obstacle tied to Belén's inventory trust
- Latest LIVE release [#44380915291](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44380915291): Pages build/deploy and Chromium/WebKit smoke SUCCESS; cold-join job #135073905081 FAILURE. 166 s, 28 pull pages ~5,348 frames, 16 missing Yjs parents, no Owner meta; source still recovering with `pullMas:true`, so failure is timeout/incomplete catch-up, not proven permanent loss of business data.
- Gate next: get an authoritative **encrypted** snapshot + complete causal parents, then join cold with readback and 2× PC↔Safari physical. Source reports: https://app.notion.com/p/4031642b67f3814f9cb2fc3a5ee74e2e; original meeting notes https://app.notion.com/p/3fa1642b67f381668834c2f402c925d6.
- V579 production code already has PN-prepared-before-ACK and rollback tests `test/v579-venta-pn-ack.test.js`; do not count that old fix twice or assume the current Belén physical mismatch is resolved.

## Guardrail / next sequence
1. Finish E2E sealed client Worker adapter (raw catalog+photos never plaintext) and certified cold-join barrier; don't activate 2.0 yet.
2. First Belén direct issue: wire IDB intents safely into the existing payment + allocation workflow and test quota/crash/idempotence before promoting.
3. Then reconcile stock/beer by movement IDs and finance/Casa-artista by opIds, preserve current client history and pictures.
4. No 70% or GO claim without new audited acceptance stage and SHA.
