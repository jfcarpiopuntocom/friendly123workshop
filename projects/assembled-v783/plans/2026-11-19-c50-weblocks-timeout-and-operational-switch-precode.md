# C50 PRECODE (`v0.8.21` / `f123-shell-v821` / `golden357`) — Bounded Web Lock Timeout + Double-QA-Gated Operational Switch

Scope: `jfcarpiopuntocom/friendly-123` (`docs/sync-yjs.js` + shell version bump + TDD tests). Zero R2 writes, zero production deploy, zero QA flags flipped ON (`USD 0.00`).
**Gate:** Execute only AFTER [PR #845](https://github.com/jfcarpiopuntocom/friendly-123/pull/845) (`v0.8.20`) merges into `master` so there is zero collision on `docs/sync-yjs.js` and `docs/sw.js`/`version*.json`.

## 1. Real Bug Fixed (`docs/sync-yjs.js:717-721`)
From [research report](file:///C:/00%20Projects/friendly123workshop/projects/assembled-v783/reports/2026-11-19-research-pitfalls-do-hibernation-safari-bfcache.md):
- `navigator.locks.request("f123-relay-outbox-" + API.roomId + suffix, run)` has **no timeout (`AbortController`)** even though `mutarOutboxAtomicoSinLocks(change, run)` already exists at line 720.
- On iOS Safari BFCache / frozen tabs, a background tab holding the Web Lock can stall foreground outbox commits indefinitely.
- **Ponytail fix:** Wrap `navigator.locks.request` with `AbortController` (`1500ms` bounded wait, `clearTimeout` in `finally`), falling back to `mutarOutboxAtomicoSinLocks(change, run)` only on `AbortError` / `TimeoutError` (preserving normal lock exclusivity when uncontended and rethrowing real business errors from `run`).

## 2. Double-QA-Gated Operational Switch (`storage/operational-switch` + `browser-cutover`)
- Keep both QA flags **OFF by default** (`localStorage.getItem("OC_YP_PILOTO") === "1"` AND `localStorage.getItem("OC_CORTE_20_QA") === "1"`).
- When both flags are explicitly enabled in QA AND `activarCorte20Runtime` is available:
  - Auto-arm `activarCorte20Runtime({ cortarComercio: true })` cleanly (idempotent, guarded by `API.__authEpoch20` and C38 `relayAnteriorApagadoYVacio()`).
  - Never activate if `OCAuth` is demo or non-Owner without valid QA opt-in, and never auto-activate in production when either flag is absent (`USD 0.00` / `0` production traffic shifted).
  - Preserve C38 isolated extraction compatibility (`test/p0-c38-legacy-transport-quiescence.test.cjs`: all state on `API`, no outer closure references inside `activarCorte20Runtime`).

## 3. Verification Plan (TDD RED -> GREEN)
1. **RED test (`test/p0-c50-weblocks-timeout-and-operational-switch.test.cjs`):**
   - Prove `navigator.locks.request` hanging indefinitely currently blocks `mutarOutboxAtomico` forever (fails before fix), and with `AbortController` falls back to `mutarOutboxAtomicoSinLocks` cleanly while still rethrowing non-abort errors from `run`.
   - Prove double-QA switch stays OFF by default (neither flag alone activates `activarCorte20Runtime`), and activates cleanly when both `OC_YP_PILOTO === "1"` and `OC_CORTE_20_QA === "1"` are set with C38 `relayAnteriorApagadoYVacio()` satisfied.
2. **GREEN + Gates:**
   - Bump `v0.8.21` / `f123-shell-v821` / `golden357` across `docs/dashboard.html` (lines 5, 6, 119), `docs/sw.js`, `docs/version.json`, `docs/version-manifest.json`.
   - Run `node scripts/release-control.cjs validate origin/master`, `& "C:\Program Files\Git\bin\bash.exe" check-sw.sh`, `test/p0-c38-legacy-transport-quiescence.test.cjs`, `test/p0-c47-auth-role-switch.test.cjs`, `test/p0-c50-weblocks-timeout-and-operational-switch.test.cjs`, and `cloudflare-yparty-worker/qa/p0-c33-sync-yjs-cutover-workerd.test.mjs`.
