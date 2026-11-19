# C16b-store P0 audit after Gemini #803 · PRECODE 19 nov 2026

APP REAL: `jfcarpiopuntocom/friendly-123/master@f5f400dd0e6486990276c27e9c080cdae7248c73`. Improve one merged adapter `src/port2-typed-ops-idb-store.mjs` only; no second adapter. Workshop = audit. Gemini Antigravity owns C16b+C17b **UI/shell**; our reserved files: `src/port2-typed-ops-idb-store.mjs`, `test/p0-c16b-typed-ops-idb-store.test.cjs`, new/updated existing targeted workflow ONLY. No `docs/`, no `src/yparty-piloto.js`, no Cloudflare, no R2 (USD 0.00).

Confirmed code audit #803 merged:
1. `openDb()` has no blocked/unresponsive timeout. If request never fires callback in Safari, entire pre-send flow can wait forever; if blocked callback rejects but onsuccess arrives late, orphan DB connection remains. Require bounded timeout, settle guard and late onsuccess `db.close()`, no promise resolution on timeout.
2. `validateEntry` protects only blacklisted secret names but accepts arbitrary extra command keys, payloads and mismatched license/role; canonical source C15 `validateTypedCommercialCommand` already defines exact supported keys and ranges. Use that allowlist and reject extra entry keys; reject corrupted own-namespace rows and unsafe state/attempts instead of silent default.
3. Two tabs write same opId with conflicting amounts: IDB transaction serializes; only one may commit, other rejects, first remains unchanged. TDD.
4. Old C16b tests 7/7 should remain green, C16a 17/17; final CI on exact head plus full suite. No runtime shell bump because changes only src+tests; no code active by default.
5. **Scores** remain PORT 81.5, quality 74.1 and GO0/6 until commercial browser checkout actually replaced. No artificial increase for another guard test.
