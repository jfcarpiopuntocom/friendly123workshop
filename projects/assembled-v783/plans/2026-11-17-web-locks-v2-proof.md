# 2026-11-17 · Opus gate E: real sync-yjs v2 IDB + Web Locks two-tab proof (no source collision)

Approved fixed gate: 5-point `idb-outbox-web-locks` stage of 10-point mobile gate. Current PORT 33.0/100, quality 64.5/100, 0/6 certified. [Notion reservation](https://app.notion.com/p/41b1642b67f38152955bc2322a9b5892). Base `2f663c052eb4c936ae11cb4dec62d2761dfd63a0`.

## Source-specific finding
`app/docs/sync-yjs.js` already defines `mutarOutbox(change)` with `navigator.locks.request('f123-relay-outbox-'+room+suffix, run)`. It also has v2 IndexedDB per-opId rows under `custom` with revisioned metadata, and v1 legacy compatibility. Existing `app/test/yjs-durable-outbox.test.js` checks 2 synthetic tabs with v1 memory storage, not 2-tab v2 IndexedDB. Existing `p0-s4-outbox-per-op.test.cjs` checks v2 migration and appends from one tab, not concurrent mutations. No 5-point award merely because lock syntax exists.

## TDD proof
- Create separate `app/test/p0-outbox-v2-two-tabs-web-lock.test.cjs`. Load the *actual source function declarations* in independent Node VM contexts, with shared fake-indexeddb IndexedDB and shared lock queue. No simulated helper implementation: the Web Locks invocation and SQL-like IDB transactions must come from shipped `sync-yjs.js`.
- Test two independent browser contexts append `op-A`, `op-B` concurrently into shared v2 per-opID rows; two independent ACK removals do not erase other tab's pending id; reopen third context and restore exact records.
- Test Web Locks exclusive active <=1 while transactions run, and durable rejection propagation so no false success. Test missing navigator.locks specifically: Opus requires single-tab visible failback, not silent unprotected concurrency; document RED if missing.
- Install dependencies from existing `app/package-lock.json` on GitHub CI. No network to real customers; no actual browser production deployment.
- No modifications to reserved `app/docs/sync-yjs.js`, app YParty client, Worker, photo browser bridge, or product. No port increase unless full stage (including missing-lock failback and true retry) is green on exact code SHA. Record RED rather than fabricating GO.

## No moving-goalposts
The six already-approved commercial gates and their weights remain unchanged. This is within gate E and cannot be used to justify new launch work. Physical iPhone acceptance still required.
