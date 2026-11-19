# C16b-S · 2026-11-19 · IndexedDB durable adapter for C16a typed ops (PRECODE)

**SAME APP** `jfcarpiopuntocom/friendly-123`, master `7d543ab66c90116922af55a7806c55de2a130cf9`. Component is part of architecture 1.0→2.0. Sync3 intact; workshop only PRECODE/QA. Cloudflare/R2 **USD 0.00**, no external writes, no flags.

## Why this component
PR #798 C16a (merged) blocks any economic POST until caller supplies durable store; `createTypedOpsReconciler` no longer uses RAM. Active browser `docs/sync-yjs.js` still sends economic operations via 1.0 relay; wiring checkout without real IDB transaction adapter would reintroduce loss of opId on crash and double-charge risk. This is an independent core-integration prerequisite for Gemini Antigravity's C16b checkout wire, not parallel shell work.

## Single-owner files and scope
Sol6 owns only NEW `src/port2-idb-ops-store.mjs`, NEW `test/p0-c16b-idb-ops-store.test.cjs`, NEW `.github/workflows/qa-port2-c16b-idb-ops-store.yml`; GitHub PR in PRODUCT. **NO** `docs/sync-yjs.js`, `docs/sw.js`, `docs/version.json`, `docs/version-manifest.json`, `docs/index.html`, `src/yparty-piloto.js` nor Belén #801 `docs/mock-backend.js`; no package dependencies or cloud resources.

## Contract
Use mature browser IndexedDB API (fake-indexeddb 6.2.8 test fixture), restricted to per-license+per-instance scope, private DB ID, transactional `loadAll/save/remove`; return promise only after `transaction.oncomplete`. Serialize commands through C15 `validateTypedCommercialCommand`: only supported kinds/fields, avoid ever persisting PIN/token/cap/customer private data not in canonical business command. Duplicate opId with changed business payload => reject atomically; never overwrite. Fail closed on blocked/aborted/upgrade failure, timeout closes late connection, no implicit RAM fallback, recovery same opId after reload. Explicit `close()`. No secrets in DB name.

## RED→GREEN
At least six tests with fake-indexeddb: (1) transaction completion before promise, (2) persist + new store instance restore, (3) same id different payload atomically rejected, (4) invalid fields/pin no writes, (5) multi-store parallel conflict serializable via IDB tx, (6) simulated `tx.abort` no ACK, (7) C16a reconciler cannot dispatch until IDB save and recovers original opId after crash. Build gate node v22 no cloud. Read evidence exact GitHub SHA and full master PR checks before merge.

## Score/GO
No artificial +/100 for a module not wired to actual checkout. PORT currently **81.5/100**, quality **74.1/100**, GO 0/6. When Gemini wires exact browser checkout with correct typed commercial parity + IDB durable+ACK, only then evaluate existing business dispatcher milestone (3pts) via fixed rubric and ship seal.