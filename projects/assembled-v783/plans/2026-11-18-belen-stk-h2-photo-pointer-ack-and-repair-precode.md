# 2026-11-18 · Belén STK-H2 · shelf photo pointer write silently fails: photo local, invisible on peer

## Read-first / ownership
- Target `docs/vista-perchas.js`, outside PR #771's production paths (`idb-fotos.js`, `mock-backend.js`). Do not touch H6 #769 dashboard or cold-join #765.
- Base currently master v0.7.94 `d0767d34e755edb155bea4707001fc4eeb61912f`; PR #771 v0.7.95 pending CI, merge first to avoid competing shell publication. No YParty2, identity, stock, finance mutations.
- Exact UI upload branch currently saves ID photo `OCFotos.guardarFoto(id,dataUrl)`; if true, sets local `fotoCache[id]`, then calls `OCFotos.guardarFotoContenido(dataUrl)`, then `fetch PUT /api/ubicaciones/:id {fotoHash}`. It **does not check response.ok** and swallows every exception in `catch (_) {}`; `cargar()` follows.
- `docs/application/recover-shelf-photo.js` already includes careful pointer repair from exact same-shelf per-id evidence, refuses overwrite of a current pointer, returns `pointer-no-confirmado` on rejected write. Reuse this rather than inventing a second repair engine.
- Root: a successfully displayed local photo is not proof the `fotoHash` pointer was ACKed to the local business model/Yjs, so another device can miss it. Earlier snapshot quota fix reduces pressure but doesn't repair pointer ACK.

## Acceptance
1. RED actual UI event in Chromium+WebKit: `guardarFoto(id)` durable true and `guardarFotoContenido()` durable hash, but `PUT` 500/403/throws => photo still visible locally, no false pointer success, explicit pending/warning, no 2nd unintended photo hash, no deletion.
2. Repair uses **existing exact-shelf evidence** and `recoverShelfPhoto` policy, never a blind retry to a different business. If a new remote hash exists or shop changes while async, do not overwrite it.
3. On retry/reopen after network recovery, persist and verify the same hash, keep fotoRev/hash lineage. Enforce response.ok (not just Promise resolves), and always render local fallback.
4. No new global outbox without proving existing `guardarFoto(id)` + `recoverShelfPhoto` constitutes a durable pending pointer source. If that evidence isn't enough, implement an IDB scoped photo-pointer pending record with reliable ACK before user-visible success, rather than stuffing base64 into localStorage.
5. Minimal UI message in approved existing visual language (action failed; photo saved on this device, pending sync) only on actual pointer failure.
6. Test response loss, offline, quota, restart, fresh device, stale pointer, cross-notebook switch and revocation. WebKit browser test + existing shelf-photo-policy and v449/4D photo suites. Exact compiled manifest, hotfix, release-control, hex-boundary; physical Belén UAT remains separate.

## Sequence
- Finish PR #771 first (v795). Before edits, verify exact master/ref and any competing ownership.
- RED test on real capture callback; then smallest source change in vista-perchas.js and existing recovery path; GREEN on exact SHA; shell/version via scripts and CI, no hand hashes.
- Reserve own branch/one owner; publish per user-approved fast-track only when gates green.
