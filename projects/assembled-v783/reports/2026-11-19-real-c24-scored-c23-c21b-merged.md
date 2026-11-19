# C24 final · v809 audited score in real friendly-123, 19-Nov-2026

The SAME product friendly-123 is being ported from architecture 1.0 to modular architecture 2.0. Sync3 is already 2.0; workshop is lab/report only.

## Exact merge, runnable evidence
- [C24 PR #818](https://github.com/jfcarpiopuntocom/friendly-123/pull/818) **MERGED** into `jfcarpiopuntocom/friendly-123/master@df50e190027d29276461a89c2ca10be9a5cf24f3` after **12/12 GitHub CI SUCCESS**, exact assessed code SHA `10f6004cab97200c0f11359e21e9f7912d118945` (v809).
- [PR #816 C23](https://github.com/jfcarpiopuntocom/friendly-123/pull/816) made `crearAlmacenDurableOpsTipadas`, `crearClienteFotosShaCertificado`, `abrirEscritorDeltaCatalogoCertificado` available in REAL bundle + sync-yjs.js facade, behind QA OFF. [PR #817 C21b](https://github.com/jfcarpiopuntocom/friendly-123/pull/817) sealed v809 with atomic `settled_ops/markCommitted` persistent opId tombstones and post-ACK reload checks. Rebuilt bundle and SHA manifest proved exact. Superseded PR #815 closed, not merged.
- Score test `test/p0-architecture-2-port-score.test.cjs`, evaluator `scripts/architecture-2-port-score.cjs` enforce 100.0 exact milestone weight, SHA-pinned evidence, three C23 methods in source+real bundle+sync-yjs, integrity sha256 for bundle/sync, and v809 `settled_ops` & `markCommitted`. C24 RED first uncovered binary floating previousScore 74.899999999 instead of 74.9; fixed by oneDecimal before GREEN.
- **PORT engineering: 81.5→83.0/100**. Same 100-point budget; split *mixed* 4.0-point milestone into +1.5 verified browser C23 compiled seams and 2.5 still pending actual typed delta/legacy retirement. Nothing credited as an active commercial cutover.
- **Architecture quality: 74.9→75.4/100**, +0.5 durability from confirmed P0 pre-fix RED 6/7 → GREEN same-do-only atomic IDB marker for committed opId across Safari-style reload. No physical iPhone certification.
- **Commercial GO: 0/6** unchanged. QA flags OFF, Sync3 unchanged. **Cloudflare/R2 budget for new expenses USD 0.00**, no deploy, R2 writes or service mutations.

## Remaining actionable gaps
No active 1.0 route retired. C21a coordinator code is in app but NOT imported/exported via real browser bundle (`src/yparty-piloto.js` lacks `createVerifiedCrossDeviceFailbackCoordinator`). Next C25 combine C21a coordinator with C23 certified writer + C16b durable ops and idempotent latches as a guarded product facade, with bundle rebuild+real tests. Real customer cold join/transaction GO separately requires certified historical Firebase HEAD and physical A→B→A x2 tests.
[PRECODE](../plans/2026-11-19-real-c24-scored-c23-c21b-pinned-evidence-precode.md) · [Notion reservation](https://app.notion.com/p/41d1642b67f3810292f7c83ee99fde87)
