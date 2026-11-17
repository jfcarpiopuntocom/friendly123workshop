# P0 actual YParty port: secure cat/ops rooms (17-Nov-2026)

SOURCE BASE: workshop/main@b5a4550cf9fb8b853c94eadde74ac3db591d4a5a; Notion reservation https://app.notion.com/p/41b1642b67f381838780fcfd273f1704 . Scope ONLY this workshop, NOT friendly-123-injertos, NO production deploy, no actual business data.

## Why this is a real integration blocker (Opus 5.5)
Real pilot constructs three independent Y.Doc rooms `sala-cat`, `sala-ops`, `sala-fotos`. The server currently secure admits only `sala-priv`. Changing room name of multiple Y.Doc to `-priv` silently conflates documents. `ws-capability-issuer.mjs` already *permits* `cat:read`, `cat:write`, `ops:read`, `ops:sale` and `priv:read/write`. No room/channel contract exists yet in the Worker. Owner must not raw-write economic doc by `ops:sale`, because Yjs cannot validate parts of updates.

## Frozen, minimal solution
- Server-only QA flag `WS_SEPARATE_ROOMS_QA==='1'` admits `cat` and `ops`, never `fotos`, while preserving existing `priv` contract and legacy exact test source. No ticket/flag => NO access.
- `ticketRequest` derives requiredScope from the validated room suffix, never a client-supplied authorization value. `cat:read`, `ops:read`, `priv:read`.
- `Tienda.isReadOnly`: in secure channel `cat`, write only with signed `cat:write`; in `ops`, **always true** for Yjs transport: `ops:sale` is a *typed command* capability, not raw CRDT permission. Existing `priv` keeps `priv:write` behavior.
- Validate no secure room in unauthorized mode, capacity bound and distinct DO rooms. No changes to financial API, photos, Firebase, login UI.
- Test first with Workerd Miniflare using real issuer, Owner PIN and two rooms, persistence after restart, replay denied, no cross-doc updates, ops raw-write denied. Assert old `-priv` remains green and no `-cat` under flag off. Do not claim browser ticket stage until app actually connects. Possible score gain for architecture only if proven; Port 27.0 remains until actual client ticket wiring.

## Execution
1. Plan this in GitHub before source.
2. Add RED native Workerd test and workflow. Record GitHub Actions failing for *actual missing server behavior* (403 or 404, not a missing test file).
3. Implement *minimal* Worker + scope adaptation, tests GREEN. Run full 585/585 suite and score 15 tests, verify exact SHA.
4. PR, append evidence in GitHub/Notion; workshop main merge only after green. Stage port operational not completed if client remains disconnected. Next step reserved source client wiring or documented integration request.
5. No production rollout, no assumption phones have converged. All six original JFC commercial gates unchanged.
