# Opus/JFC P0: photo bytes outside Yjs, SHA-addressed SQL blocks in existing Workerd (2026-11-17)

**BASE**: workshop/main@1a93289b94d337646d9699a30e1cca49c3b1de94. **Notion reservation** https://app.notion.com/p/41b1642b67f381f48906faf4dc21877e. NO production/client/actual data. Other repository `friendly-123-injertos` reservations untouched.

## Exactly one existing gate C, minimum complete vertical server slice

Approved by JFC on Opus 5.5 guide: Photo bytes must leave Yjs; Yjs metadata only `{sha,bytes,tipo}`. Reuse Worker Durable Object SQLite and 512 KiB block pattern. No R2/new third-party service; browser original photo relay remains fallback until same-store browser adapter proven.

P0 server transport goal:
1. Existing `partyserver` HTTP `onRequest` on `/parties/tienda/<license-room>-fotos`, GET/PUT under private QA server-only `WS_PHOTO_BLOBS_QA=1` and `WS_AUTHORITY_QA=1`, no anonymous Yjs WebSocket photos and no private-room merge. Root router never permits unauthenticated endpoint or arbitrary room.
2. Browser sends `Authorization: Bearer <one-use-photo-ticket>` and `x-f123-license`, `x-f123-instance` HTTP only; server routes to central `WS_AUTHORITY` with **server-only** `WS_SERVICE_KEY`. Server calls `consume` for each request, with scope `fotos:read` GET or `fotos:write` PUT; only signed room-principal accepted. Cannot leak token/PIN in response/storage/logs.
3. SHA256 path/query `?sha=<64 lowercase hex>` identifies immutable photo. PUT accepts only allowed raster MIME (`image/jpeg/png/webp/gif`) and bounded blob <= 6 MiB. Validate Content-Length actual bytes, calculate SHA256 before commit, reject mismatch. SQLite `photo_sha_meta` and `photo_sha_blocks` with BLOB chunks <=512KiB and atomic `transactionSync`; exact replay idempotent, SHA collision with unequal bytes/mime conflict. ACK only after successful commit and `storage.sync`.
4. GET concatenates in block order, checks count/total/hash; refuses truncated/corrupt data, returns exact bytes, headers no-store and content-type. Cold restart Miniflare uses same persisted SQL. HTTP behavior fail closed on disabled flag, bad auth/replayed ticket/wrong scope, bad hash/oversize, never advance Yjs.
5. TDD RED Workerd test extends exact `qa/p0-secure-separate-rooms.test.mjs` synthetic central issuer, GET/PUT + 2MiB+ chunks, cold restart, corruption/replay/unauthorized/disabled flag. Commit RED test and see real failure. GREEN minimal code in `src/index.js` + new `src/photo-sha-storage.mjs`; existing four Workerd cat/ops tests unchanged. Run integrated 585/585 on exact SHA.
6. This *alone* **does not** close photo gate or count port photos points: no client upload/download SHA reference yet, legacy fotos Yjs unchanged. Add browser wiring in separate PR, verify real browser→DO→browser and then score stage `photo-sha-sql-blob` 3 if proven. No moving goalposts, six gates fixed and port stays 33 until browser side and certified proof.

## Real browser CORS preflight is part of same photo transport, not a new JFC gate

The app is hosted separately from the private Workerd domain; its `Authorization` + custom identification headers require an HTTP `OPTIONS` CORS preflight. Allow only a **server-configured explicit HTTPS origin** `WS_PHOTO_ORIGIN_QA` under the existing QA flag, exact string match, no wildcard. Preflight never exposes photo bytes or token, only `GET, PUT` and three named headers. Unauthorized origins get 403 and no `Access-Control-Allow-Origin`. Actual GET/PUT with an Origin must match and return CORS response headers (including errors), while synthetic same-origin tests remain supported. TDD RED first with Workerd, then minimal root/onRequest patch; compare byte exact photo cold restart again. No more services or redesign.
