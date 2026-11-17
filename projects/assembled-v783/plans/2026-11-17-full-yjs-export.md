# 2026-11-17 P0 complete YParty Yjs snapshot+journal readback (workshop only)

Base main `179177fd78360d633802e453a8dfa63b63b6609c`. Notion reservation https://app.notion.com/p/41b1642b67f38105a1fdeeecf3f482f1.
TDD Superpowers, Ponytail: **new isolated module only**, DO adapter not yet wired; avoid reserved `src/index.js`, `src/yparty-piloto.js` and all live business flows.

## Real blocker
Current `certified-frozen-import.mjs:readFrozenImport` intentionally denies export when `diario` is nonempty, to prevent losing an after-cut sale. A reversible cutover needs a **complete read of current SQL facts**: base `documento_bloques` (512KiB), optionally old single `documento`, then ordered `diario` with `diario_bloques`. The live YParty `Tienda.onLoad` reconstructs exactly this history. Missing, orphaned, gapped or double-owned blocks must fail closed, never silently omit an op.

## Frozen predeclared award
Quality index before task = **64.0/100**, migration **5.0/10**. Award **+0.5** (64.5/100, migration 5.5/10) *only after* real Miniflare Workerd SQLite proves full export after restart and negative corruption test AND broader 585 integration success; update rubric JSON and CLI tests with exact SHA-linked evidence. Six GO gates stay zero; no Firebase transport or production claim. +0.5 for truthful narrower capability only.

## Contract / tests FIRST
1. New `src/durable-full-yjs-export.mjs` exports `exportCompleteYpartyYjs({storage,channel})` read-only. Validate `storage.transactionSync`, `sql.exec`, `channel=ops/cat`.
2. Sync read of all SQL tables inside transactionSync; copy BLOB bytes before leaving; ensure exactly one base form (unless no base and diary first), blocks numbered from zero and full 512KiB before last; `diario` chunk parts numbered 0.. and no orphan chunks. No SQL DELETE, INSERT or CREATE.
3. Reconstruct updates using real Yjs; *reject* pendingStructs/pendingDs, zero frames, and malformed Yjs. Encode state as update and vector, independently SHA256 both; report exact `eventos` count; return Uint8Array. Callers must still authenticate; there is no endpoint, encryption or transmission in this task.
4. Workerd fixture with synthetic complete frozen import three opIds via PR82, SQL journal fourth opId/large event >512KiB, verify cold restart, output SHA vs independent Yjs, compare ops count 4. Validate distinct Yjs client actor, no duplication on replay.
5. Negative tests: journal missing middle block, orphan row, child update missing parent; no data mutation during denied export, no false ACK.
6. CI focal RED→GREEN, full integration, SHA verification, GitHub evidence, Notion update. Release only workshop. Do not equate binary Yjs export with encrypted Firebase back-export.

## Later closed GO tasks (not part of this PR)
Certified HEAD of real Firebase >5k frames with 15 missing parents resolved, single authorised DO importer wired under issuer, actual authenticated encrypted Firebase return transport, server-side employee typed economic veto, external photos, outbox Web Locks + physical iPhone 2 A→B→A cycles.
