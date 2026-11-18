# 2026-11-18 · Ultrareview #756 follow-through: P0 opaque wire + cold-join readiness

## Baseline and authority
- Actual LIVE `friendly-123` v0.7.91/f123-shell-v791; user has physically confirmed Safari dashboard success. Separate incident from migration.
- UltraReview https://app.notion.com/p/41c1642b67f381209690f76fe5c89e8c; code `docs/sync-yjs.js`, `src/yparty-piloto.js`.
- `docs/sync-rollout.json` no `yparty:true` entries: 2.0 OFF for all customers; central ticket issuer remains as deployed, do not activate or change secrets.
- Scoring frozen: quality 67/100 (QA candidate, ±4 judgment), PORT 57/100 (QA Workerd assemblies, 0/6 GO), baseline Nov 10 quality ~45±5; no increment from dashboard auth alone.
- Workshop active photo/outbox reservations: avoid editing workshop `app/docs/sync-yjs.js` and `app/src/yparty-piloto.js`; use dedicated LIVE draft branch under file owner, no merge without complete safety proof.

## P0-1: no raw Y.Doc on YParty
**RED**: instantiate the actual pilot with a mock AuthorizedYProvider. Pass a catalog containing `_meta.pinsRol` and `hechos_financieros`. A `yparty:true` rollout must NEVER construct a provider around `API.doc` plaintext, even if a ticket is valid. Status quo fails.
**Ponytail containment**: default fail closed to the encrypted legacy channel until there is a separately tested authenticated E2E adapter that gives the provider an opaque ciphertext-only `wireDoc`. No truthy rollout flag or browser global counts as ciphertext proof. Preserve existing legacy IDB/outbox and no duplicate writes. This closes immediate plaintext leak in the candidate, but **does not complete the E2E architecture** or earn port points.
**Future full fix**: build an authenticated AES-GCM envelope over Yjs updates in a separate Y.Doc containing *only* version, room-scoped ciphertext + integrity metadata. Never give AuthorizedYProvider raw API.doc. Test negative plaintext scanning of WebSocket frames and DO SQL readback, private metadata, large updates, rollback and typed business ACK, durable cold join in Workerd. Only after GREEN may YParty have a real connect branch.

## P0-2: old relay recovery barrier
**RED**: pilot reports synced while shadow legacy has not completed pull and PIN/identity metadata remain old. Ensure `canal.accesoListo()===false`, `canal.recuperando===true` and `aplicar()` not called until legacy itself is fully ready and Yjs has no pending structs/deletes; fallback on failure.
**Ponytail**: supply `legacyReady` from `API.canalSombra`, require it in both `completar()` and `accesoListo()`, never replace the condition with local IDB/synced alone; add a bounded retry to notice zero-update (empty legacy) completion. Stop timer on pause/destroy and ignore disconnected sessions.
**Acceptance**: synthetic tests prove no metadata authority before certified pull; Workerd with legacy frames in late/out-of-order replay confirms cold join; physical A→B→A ×2 later. Any missing proof => stay on encrypted old relay, 2.0 OFF.

## Gate evidence and governance
- One dedicated source branch with a new regression test, CI RED before patch, GREEN after patch.
- `yparty:true` remains OFF across all licenses. No Worker ticket deployments, secrets, live PIN, customer data or activation. No scoring increment until full E2E and all six accepted gates.
- Build official vendor via `scripts/build-yparty-piloto.cjs` and deterministic manifest if preparing a merge candidate. Do not ship a new public shell just to prove dormant candidate safeguards.
- Prioritize integrity and actual user business data over a guessed 70%.
