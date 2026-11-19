# C25 PRECODE · assemble real C21a coordinator into C23 browser pilot and Sync3 facade (QA OFF)
Date 2026-11-19 Ecuador. Same friendly-123 product 1.0→2.0; Sync3 remains 2.0. Base master@df50e190027d29276461a89c2ca10be9a5cf24f3 (v809, C23 C21b + C24 score 83.0 quality75.4).

## Root cause and minimal complete change (Ponytail)
C21a `src/port2-cross-device-failback.mjs` had Workerd two-device and post-ACK reload RED→GREEN C21b but is NOT imported by `src/yparty-piloto.js`, so no actual browser can instantiate the complete cutover chain. C23 already exposes C16b durable IDB store, C15/C16a typed reconciler and C19a certified writer. Wire ONE factory `crearCoordinadorCorte20` into pilot calling these existing methods, never reimplementing them. Export behind same QA-pilot guard in `docs/sync-yjs.js`. All APIs stay opt-in; no changing `CONFIRM SALE` business path, no Firebase/Sync3 mutation, never auto-connect. Hidden/pagehide fails back and releases writer lock, `destroy` removes listeners. C21a alone decides opId same-DO latch and durable store read; ensure C21b tombstones are in compiled bundle.

## Exact files reserved
- `src/yparty-piloto.js`: one import and one factory, no other routing.
- `docs/sync-yjs.js`: guarded facade with fallback reject, no new auto-run.
- `test/p0-c25-browser-coordinator-factory.test.cjs`: compile+run real vendor bundle VM against fake IndexedDB; cold replay of committed opId, test hidden role and no calls before activate; unit on pagehide.
- `.github/workflows/qa-port2-real-c25-browser-coordinator.yml`: test real bundled factory.
- v810 **exact** release assets: `docs/vendor/yparty-piloto.min.js` from locked esbuild 0.28.2, `docs/version.json`, `docs/version-manifest.json`, `docs/sw.js`, `docs/dashboard.html`, `.github/workflows/qa-port2-v785-shell-seal.yml`; no Cloudflare deploy, no changes to rollout. One-time isolated GH Actions builder with contents:write on **only branch C25**; remove builder before merge.

## Acceptance gates
RED first QA must fail on absent `crearCoordinadorCorte20`; after code/bundle build GREEN with original C23 + C21a + C16b tests, official manifest exact, all CI. Do not overclaim actual real device A→B→A or GO (still 0/6). Port score 83.0 until truly proven new coordinator browser seam; potential next fixed-budget offline split 1.0 Workerd browser vs 1.0 physical, only with deterministic evidence. No customer PIN, real data or paid R2/Cloudflare calls. Budget for new costs USD 0.00.
