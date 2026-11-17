# P0 frozen Yjs → YParty SQLite import certificate (workshop only)

Base workshop/main@`ba183e5c097e0f00253a154338fae97228713f88`, 17 Nov 2026. Notion reservation: https://app.notion.com/p/41b1642b67f3813190bcccd6eae7a9da

## Why
The legacy Firebase cold-join canary still reports 15 Yjs pending parents in ~5,348 frames. YParty cold joins load from SQLite in one state-vector diff *only once a complete state has been imported*. A Y.Doc with pendingStructs/pendingDs cannot be certified. Blindly using it would entrench missing sales and inventory.

## Exact isolated code
New `relay/injertos/yparty-worker/src/certified-frozen-import.mjs` with server-only `prepareFrozenImport`, `installFrozenImport`, `readFrozenImport` (not exposed as endpoint). New TDD `qa/p0-certified-frozen-import.test.mjs`. New CI workflow. **Do not edit index.js or any client or production file reserved by other IAs.**

## Invariants / RED first
- Inputs must be authenticated, externally frozen frames through a known HEAD; no silent shortcut when parents or deletion sets remain pending.
- Independent expected normalized Yjs update SHA256 + expected state-vector SHA256 + exact event opId count (ops room only) required before write.
- No missing frames, no empty proof, no new arbitrary client-writable authority, no source proof inferred from the same bytes.
- TransactionSync creates native `documento_bloques` chunks (512KiB, exactly current YParty schema) and receipt together, and only if all live tables empty. Atomic rollback on mid-transaction errors. Retry with same proof is idempotent, different proof rejected. No overwrite of existing DO or journal.
- Export must read complete consecutive chunks and verify recorded SHA & state-vector before returning bytes, with no data deletion. This is a binary Yjs back-export proof, NOT yet a Firebase transport adapter.
- Source Yjs state is frozen and pristine until DO can be restarted from storage; must not hot-load into a running YServer.

## Procedure
1. Commit this plan before tests. 2. Add tests against missing module; run CI for true RED. 3. Add narrow module; run GREEN and test complete restored state. 4. Try real Workerd (if module imports cleanly); then broader authority and existing QA. 5. Write evidence, Notion, PR workshop-only; no production deploy. Await authorized integration into Worker and real provider before first store.

## Known gates beyond this module
Server-side deny employee raw Yjs writes, central Owner/Team ticket per room, photo bytes outside Yjs, one real Firebase→DO importer with zero pending and independently signed/source-anchored SHA, usable Firebase downpath, Web Locks and iPhone recovery, 2 physical Opera↔Safari A→B→A cycles.
