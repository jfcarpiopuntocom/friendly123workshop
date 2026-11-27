# P0 Dashboard remote Firebase ephemeral bridge · 18 Nov 2026

## Exact defect
App `docs/index.html` loads `peer-sync.js` + `vendor/supabase-relay.min.js` + `firebase-relay.js` + `relay-selector.js`, and `sync-realtime.js`. Dashboard `docs/dashboard.html` loads ONLY `peer-sync.js`. On real TURN-only CI #44335923862, SDP succeeds but no relay candidates (ICE 701); dashboard Owner PIN cannot reach app. Host-only CI #44342616469 1/1 GREEN, proving signaling+RTC on local network. Public Open Relay reported discontinued Oct 2026. User needs actual dashboard now.

## Minimum protocol
New `docs/dashboard-bus.js`: E2E-encrypted **temporary** Firebase REST + EventSource bridge using sibling `/f123/<room>/dashboard/m` separate from append-only Yjs `o` and checkpoints `k`, exact existing room crypto. Ciphertext only; no plain PIN, role, snapshot, finance or sales. 15-45s TTL/revocation per message with deletion by creator after delivery opportunity; max 64KiB ciphertext/message; strict 40-hex room, bounded number of live messages; receiver ignores own and stale messages. No Cloudflare business bytes; Firebase performs same transport role it already does for encrypted sync. No broad read or new licensing authority.

App: only for active joined notebook, open bus; decrypt inbound dashboard requests through existing legacy handler (preserve Owner/admin PIN check), respond on the same bus only to requests that arrived over it. Dashboard: bus as remote fallback to peer; authorized only after genuine encrypted `__respuesta__` affirmative; `__foto_pedida__` requires per-device token, existing snapshot partition and calculations unchanged. The bus persists no data in browser. Keep direct RTC when available.

## TDD gate, in order
1. Synthetic Firebase permission/reachability probe: create random room, PUT tiny ciphertext under isolated dashboard path, GET verifies, DELETE verifies; 0 customer context. If denied, record and choose another existing service, do not deploy speculative code.
2. RED browser test where peer RTC unavailable but new bus emits PIN challenge and real legacy Owner handler response; wrong PIN denied; isolated rooms cannot see ciphertext; bounded cleanup.
3. Minimum JS source and browser scripts; rebuild dashboard bundle with repo builder, update shell manifest and versions; fresh CI exact candidate SHA.
4. Live synthetic A→PIN→B→snapshot; verify actual public deployment. Rollback through stable/previo and feature-flag bus.

## Safety
No customer writes, no business transaction modifications, no PIN bypass, no unsandboxed workers, do not touch 2.0 rollout flags, single owner per production file. User's instruction: action, SHA/URL, evidence, blockers only, zero defensive justification.