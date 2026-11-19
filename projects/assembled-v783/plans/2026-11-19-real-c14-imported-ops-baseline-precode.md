# C14 · PRECODE · imported -ops baseline invariance · 2026-11-19
APP REAL: `jfcarpiopuntocom/friendly-123`; exact master `5daab17d24d5407f7d089b1d9d28c8a89b647319`. Sync3 intact. Workshop = evidence, not implementation.
[Sol6/C14 Buzón reservation](https://app.notion.com/p/41d1642b67f38120a972da10c46f58a3). [Antigravity/C13 reservation](https://app.notion.com/p/41d1642b67f38115b75ef830201acc83).

## Confirmed root cause
`cloudflare-yparty-worker/src/open-existing-store.mjs` when reopening an initially EMPTY -ops room with `f123_frozen_imports` certificate exports current SQLite snapshot+journal but only checks current `eventCount >= frozen event_count`. Thus a historical opId may be overwritten with a changed amount or deleted/replaced while count remains constant, yet Gate D returns `opened:true,already:true`. Occupied-room `f123_frozen_unions` already verifies baseline rows opId/payload; import-on-empty must do the same.

## Narrow implementation
New `cloudflare-yparty-worker/src/frozen-ops-baseline.mjs`: canonicalize bounded serialized events (stable key order, integer amounts only, reject nested/unexpected data), stage exact `opId -> payload` baseline from independently SHA-certified frozen Y.Doc, SHA-256 digest, atomic SQL rows + certificate digest in the same `transactionSync` as frozen import. `cloudflare-yparty-worker/src/certified-frozen-import.mjs` attaches verified baseline to opaque proof, installs it atomically, validates duplicate import baseline WITHOUT writing. `cloudflare-yparty-worker/src/open-existing-store.mjs` must reject an absent, corrupt or nonidentical baseline before setting `gateDVerified`. Only in ops; -cat untouched. Failback retains SQLite evidence, no resets or purges, no weakening of limits, no customer data.

## Real Workerd tests, RED→GREEN
New `qa/fixtures/c14-imported-ops-baseline-worker.mjs` subclass of REAL Tienda with test-only synthetic request injection, new `qa/p0-c14-ops-baseline-reopen-workerd.test.mjs` and focused workflow. Boot signed source 3-5 historical operations; assert frozen baseline SQL stored; append legitimate new op to journal, restart without source and accept; append tampering update to historical same id and same count, restart must reject; replace historical id with another and maintain count, reject; delete baseline row / mutate digest, reject; flag OFF and catalog unaffected. Run focused RED first, GREEN on SHA, then global Workerd suites and GitHub gates.
 
## Ownership and launch
Sol6 touches only `cloudflare-yparty-worker/src/frozen-ops-baseline.mjs` (NEW), `certified-frozen-import.mjs`, `open-existing-store.mjs`, new QA fixture/test and dedicated CI. Antigravity owns `docs/sync-yjs.js`, C13 browser tests, shell v803 and score; NEVER touch those. No cloud/deploy/QA flags, no changing `src/yparty-piloto.js`, Auth issuer, secrets, Sync3, commercial shop. A passing C14 server audit does not increment browser-cutover score or certify GO. Coordinate merge if C13 advances master.
