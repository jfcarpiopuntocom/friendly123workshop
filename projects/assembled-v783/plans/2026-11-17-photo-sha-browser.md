# P0 Browser-to-Workerd photo SHA bridge (Opus 5.5, 17 Nov 2026)

BASE: workshop/main@ceb6e5a0652c5093dbefe9afc8d2c236b35e2e86; NOTION https://app.notion.com/p/41b1642b67f381828d00eea08115d82b
Six existing JFC gates fixed. Workshop only, no production or real customer data.

## Reuse existing parts (Ponytail)
- PR89 deployed? NO. Workshop source includes signed HTTP GET/PUT photos -fotos, SHA256 and 512 KiB SQL blocks; feature flags disabled by default.
- Existing OCFotos IndexedDB has guardarPorHash, leerPorHash, hashDeDataUrl. Existing AuthorizedYProvider uses 1-use Owner issuer tickets.
- Current legacy fotos Yjs stores dataURL bytes; if remote SHA photo endpoint is unreachable, preserve old encrypted relay. Never delete/overwrite original photo evidence.

## TDD / implementation
1. RED: test missing photoScope and missing browser photo bridge against real source, with synthetic one-use issuer + exact SHA photo body validation; no secrets in URL or storage.
2. GREEN: extend Owner ticket helper with explicit opt-in photos HTTP read/write, never offer photos Yjs WebSocket. New photo-sha-bridge.mjs fetches immutable SHA bytes, validates verified receipt/hash/MIME/size, doesn't persist PIN/cap. Pilot method fotoSha() composes helper reading existing volatile PIN.
3. Minimal sync-yjs.js photo seed hook: when piloto+authorized photo bridge enabled, upload local OCFotos dataURL by hash first; after real 200/201 ACK put only {sha,bytes,tipo} into catalog map fotos_refs, avoid raw photo dataURL in new Yjs doc. If failure keep legacy encrypted relay, no false remote ACK.
4. Read-through recovery: on requested photo hash missing locally and present as fotos_refs, download via signed GET, verify SHA, save OCFotos.guardarPorHash then return dataURL. Never expose cross-license credentials. Use bounded work to avoid issuer rate limit.
5. Rebuild actual browser asset from existing scripts/build-yparty-piloto.cjs with locked esbuild; byte-identical vendor checked by CI; targeted test, Workerd local sender/receiver integration, and 585/585 broad CI on exact PR SHA.
6. Only credit fixed photo stage points after genuinely verified browser-to-Workerd and Yjs references. 0/6 commercial gates certified until full user-approved gate. No deploy.

Scope authorized in Notion: app/src/ws-owner-ticket-params.mjs, app/src/yparty-piloto.js, NEW app/src/photo-sha-bridge.mjs, app/docs/vendor/yparty-piloto.min.js (generated), app/docs/sync-yjs.js smallest glue, new app/test/p0-yparty-photo-sha-browser.test.cjs, .github/workflows/qa-v783-photo-sha-browser.yml, this plan.