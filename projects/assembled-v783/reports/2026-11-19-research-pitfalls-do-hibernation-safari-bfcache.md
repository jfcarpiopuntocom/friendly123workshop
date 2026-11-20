# Research & Production Pitfall Advisory (DO Hibernation + iOS Safari BFCache)

- **Date:** 2026-11-19 (GMT-5)
- **For:** Sol6 & JFC (`friendly-123` 1.0 -> 2.0)

## 1. Cloudflare Durable Objects + WebSocket Hibernation ("Amnesiac Wake-Up")
- **Pitfall:** After ~10s of inactivity, a hibernatable DO evicts its JS instance from memory while keeping WebSockets open; on the next `webSocketMessage`, `constructor()` runs fresh and any in-memory `Map`/`Set`/flag is wiped.
- **Audit of `cloudflare-yparty-worker/src/index.js`:**
  - `conexion.state.accesoFirmado` (PartyServer attachment -> `ws.serializeAttachment()`) **does** survive hibernation and `unexpired(...)` + `askAuthorityBatch` re-validates on wake.
  - `this.outboundViews` (`WeakMap`/`Map`) is lazily rebuilt on demand; `this.pendingAdmissions` only spans in-flight `onConnect`.
  - **Rule going forward:** Never store role leases, rate-limit counters, or session revocations solely in DO class fields without SQLite (`this.ctx.storage.sql`) or `serializeAttachment`.

## 2. iOS Safari BFCache (`pagehide` -> `pageshow`) + IndexedDB + WebSockets
- **Pitfall:** Active WebSockets or uncommitted IndexedDB transactions at `pagehide` block BFCache or cause dead/zombie IDB connections (`TransactionInactiveError` / `AbortError`) when Safari thaws the JS heap on `pageshow` (`event.persisted === true`).
- **Audit of `docs/sync-yjs.js` & `src/yparty-piloto.js`:**
  - Both already hook `pagehide` (`failbackToLegacy('pagehide')`) and `pageshow` (`event.persisted`).
  - **Rule going forward:** Keep all IndexedDB transactions short-lived (never hold an idle IDB transaction open), and never tear down/close the shared IDB database instance inside `pagehide` — only close WebSockets and release ephemeral locks so `pageshow` can cleanly reconnect.

## 3. iOS Safari PWA `navigator.locks` (Web Locks) Unbounded Wait
- **Pitfall:** On iOS Safari / standalone PWAs, if a backgrounded tab or worker is frozen/killed while holding a Web Lock, a second context calling `navigator.locks.request(name, fn)` **without a timeout (`signal`)** can hang indefinitely. Web Locks are also non-reentrant.
- **Audit finding (`docs/sync-yjs.js:718-720`):**
  - `navigator.locks.request("f123-relay-outbox-" + API.roomId + suffix, run)` currently has **no `AbortController` / timeout**, even though `mutarOutboxAtomicoSinLocks(change, run)` already exists on line 720.
  - **Recommendation (post-PR #845):** Guard `navigator.locks.request` with a bounded timeout (`AbortController` + `setTimeout`, falling back to `mutarOutboxAtomicoSinLocks` on `AbortError`) so a frozen iOS Safari tab can never wedge the outbox.
