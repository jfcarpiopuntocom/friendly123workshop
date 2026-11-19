# APP REAL friendly-123 · Gate D4 union-on-nonempty DO · PRECODE (Ponytail/Superpowers, 19 Nov 2026)

**User correction:** OpenCode/Hermes are READ-ONLY auditors. Sol6 performs ALL code grafts, SQL/staging, reviews and integration. Previous note assigning staging to OpenCode is explicitly withdrawn in canonical [Notion](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94).

**Target code:** `jfcarpiopuntocom/friendly-123` master `ec8359432ffd2ffeb6a9974cd1721ecb02a7ca40`. Workshop ONLY plan/QA/checkpoint. Keep Sync3 untouched. Existing QA flags OFF; Cloudflare deployment not part of this focused graft. Read existing helper `certified-frozen-import.mjs`, `durable-full-yjs-export.mjs`, `open-existing-store.mjs`, `index.js`; source code and actual Workerd tests. No active reservations for files under `cloudflare-yparty-worker` in Notion.

**Causal defect:** `installFrozenImport` fails nonempty local snapshot/journal. An existing Tienda needs merge of independently certified frozen history with local Yjs journal without erasing either; must not treat merge of CRDT as confirmed customer money transaction.

**Minimum complete design:**
- New module `merge-frozen-into-existing.mjs` used by `openExistingStore` only when local SQL is nonempty, after `prepareFrozenImport(source)` passes independently anchored HEAD/state/vector/ops count and 0 pending parents.
- Within ONE `transactionSync` reconstruct current local Yjs from EXACT snapshot+journal storage format via existing export module read helpers; reconstruct frozen from frames; check 0 pending and only `eventos` root on `-ops` (other channels must be privacy-allowlisted). For collisions on business opId, require identical canonical content; conflicting same-opId amounts reject with SQL intact.
- Use `Y.diffUpdate(frozen,localVector)`; verify union has expected key/values, no data loss. Append diff to durable journal with 512KiB chunks inside same synchronous transaction, record a separate **union** certificate. Do not change `f123_frozen_imports` semantics (that table means empty initial-store import). Reject dirty source or inconsistent SQL, and rollback all rows on any fault.
- At cold reopen, `index.js` recognizes either import or union certificate without calling potentially down Firebase source. `openExistingStore` validates the union certificate using entire local SQL state plus per-opId baseline for changed-value detection (event count alone is insufficient), and only then allows `opened:true,already:true`. Preserve subsequent legit ops and failback idempotence.
- Workerd + SQLite **RED**: real Tienda with prior local 10 distinct business ops and frozen 100 historical → exactly 110 events with amount sum and hashes preserved, persisted after restart; same source retry no dup, conflicting same opId refuses, SQL interruption rollback, missing parent and privacy refusal, FLAG OFF returns old path. Synthetic data ONLY.
- Workerd **GREEN** on SHA exact + full Gate D prior regressions + GitHub PR checks. Inspect constraints and separation before merge. No release flag activation or customer data. Keep master unaffected until GREEN.
- Next distinct task: SQL staging + bounded finalizer 48MiB & memory profiling Workerd per Hermes, because current 24MiB fail-closed guard is not full ingest. No waiting for other AI implementation.

**Score rubric:** Architecture quality 67/100, operational PORT 61/100, 0/6 commercial GO unless actual source/real cold join tests prove otherwise; avoid optimistic credit for tests or workshop commits.

**Failback:** any mismatch/exception before the transaction or within it → no SQL mutation, old legacy route. After commit, readback and validate. Reopening with union certificate bypasses source fetch only after verifying persisted baseline and current Yjs causal completeness.
