# C38 QA checkpoint — real 2.0 writer-cutover safety gate (19-Nov-2026, Ecuador)

## Same-app verified baseline (NOT provisional C38 credit)
- `jfcarpiopuntocom/friendly-123/master@ec60623396d1f0bf3ef0267f828484cf17029ef2`, C36/C37 MERGED. Architecture v1→v2 migration **85.5/100.0**, architecture quality **76.2/100.0**, commercial GO **0/6**. `assessedProductSha` pinned to C36 merged code `3e367eadd6b87a8143471041875decc523af3e76`. Uncredited budget 14.5.
- Sync3 is already the first 2.0 graft; not a new application or new syncing engine. Workshop only evidence/plan checkpoints.

## Source root
- `docs/sync-yjs.js` C31 `API.activarCorte20Runtime` previously arms C25 coordinator commercial mode without verifying old relay status; `publicarOpLocal` dispatches typed `sale.record` through C25/C15-C16.
- Separately, `docs/sync-realtime.js` old `OCSyncEmit` enqueues the same stock fact and sends via legacy WebSocket; `vaciarCola()` also retransmits pending old ops. C36 matching same `opId` is necessary for idempotency, but not proof that there is just one writer. No assertion of a duplicate charge at customer shops, because QA remains OFF.
- Existing `OCSync` facade already provides `estado()`, `salaActiva()`, `durabilidadPendiente()`, `onEstado()` and deliberate `desactivar()`. Existing C21a coordinator provides `failbackToLegacy`. Use these, not another transport.

## C38 progress
- [PRECODE C38](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-real-c38-legacy-relay-quiescence-gate-precode.md) commit `3bdd132ccf18acf10da0098bf0f097b54f82f703`, [Notion exclusive reservation](https://app.notion.com/p/41d1642b67f38106a0bdf075443b929a).
- [PR #833 C38](https://github.com/jfcarpiopuntocom/friendly-123/pull/833) in real product BRANCH `port2/20261119-c38-legacy-relay-quiescence`. Still DRAFT, no merge. Candidate `v0.8.16/f123-shell-v816/golden352`.
- TDD **RED actual GitHub Actions 44639189704**: 6/6 new source-executed tests fail: connected legacy writer, pending legacy outbox, unreadable old state, missing observer, old relay opens during activation or later.
- **GREEN C38 unit-only Actions 44639379335**: 6/6 tests pass after gate in `docs/sync-yjs.js`; separate C31 harness failed because workflow initially lacked `npm ci` to install fake-indexeddb, fixed in workflow.
- Cutover guard: deliberate legacy `estado==='apagado'`, no active old room, `durabilidadPendiente()===false`, `onEstado` observer; verify pre and post async `coord.activate20`, downgrade immediately on old relay reactivation via existing `coord.failbackToLegacy`; prevent employee role toggles from arming commercial mode without successful certified activation; prohibit silently treating a coord without `activate20` as activated. Does not auto-deactivate clients or erase queues.
- C33 REAL Workerd E2E initial regression: its synthetic `OCSync` facade supplies only catalog/photo helper methods but lacks old-relay status and observer. A strict guard correctly refuses absent provenance; the QA fixture and guard must be reconciled without weakening verified business-writer exclusion or faking a successful commercial ACK. Changes to E2E fixture may require additional authorization/coordination; no false GREEN. See GitHub Actions C33 run 44639765268.
- At checkpoint PR head `12df6f0afd373a23318e435d5b5b97174bd8d689`, full CI jobs still QUEUED. Gate tests now include additional negative role+missing activator cases; requirements remain strict. Official `docs/version-manifest.json` needs integrity seal corresponding to FINAL source SHA; after each source change the manifest must regenerate via `scripts/gen-manifest.js`, not accept stale earlier hash.

## Continuation (source SHA / GO contract)
1. Verify latest PR HEAD and owner reservations before any write because others are updating the SAME branch. Inspect C33 real Workerd QA regression and reconcile the old relay proof legitimately: a catalog-only helper without any old emitter cannot be treated as a live legacy socket, BUT do not silently bypass unverified old transport; retain negative C38 tests.
2. Make dedicated C38 + C31 + C33 actual Workerd SQL E2E and global workflows GREEN, source digest exact, `check-sw` and fixed score audit intact, no activation of customers.
3. Only after 100% CI success merge PR#833, verify master SHA and record Notion/report. Leave official PORT85.5/QUALITY76.2/GO0/6 until separate evidence-based fixed-budget C39 audit, if warranted.
4. Business complete dispatcher 2.0, retire legacy 1.0, Firebase frozen HEAD/R2 binding, roles/photos cutover and actual PC↔Safari iPhone A→B→A×2 are still pending. New Cloudflare/R2 spend USD0.
