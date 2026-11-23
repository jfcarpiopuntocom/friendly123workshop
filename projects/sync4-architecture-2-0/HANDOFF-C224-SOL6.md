# C224 Surgical Handoff for Sol6 (`v0.9.02` — Cloudflare Encrypted Private Vault)

**Base commit verified:** `ae7c7138d00c8c541afac078974dcfd182593cd9` (`origin/master`, `v0.9.01`)
**Target release:** `v0.9.02` / `f123-shell-v902` / `golden438`
**Pre-sealed atomic patch:** `projects/sync4-architecture-2-0/releases/C224-v0.9.02-CF-Privado-on-ae7c7138.patch`
**1-command applier:** `node projects/sync4-architecture-2-0/src/apply-c224-v902.cjs <path-to-friendly-123-worktree>`

## What C224 Ships (ZERO improvisation, MDD-2026-10-31 #2)
1. **Cloudflare Worker + SQLite Durable Object (`cloudflare-relay-worker/` → `friendly123-relay-privado`):**
   - Stores ONLY opaque AES-256-GCM ciphertext frames (`relay_ops` + chunked 512 KiB `relay_ckpt_blocks` up to 2 MiB, 64 MiB store cap, 240 req/min rate limit, `storage.sync()` before ACK).
   - Rejects foreign origins (strict CORS allowlist: `https://jfcarpiopuntocom.github.io`, `https://friendly-123.jfcarpio.workers.dev`), cross-store rooms (`SHA-256("amigable-sala:"+license).slice(0,40)`), plaintext JSON, oversized bodies, stale CAS `rev` (`409`), and replayed tickets.
   - Authenticates **ALL roles** (`dueno` via `-priv`/`priv:write`, `admin` & `empleado` via `-cat`/`cat:read`) against `friendly123-licencias` (`WS_AUTHORITY` Service Binding `/ws/consume`) ONCE per 10-min room-bound HMAC session token (no `ws-capability-issuer.mjs` weakening; `test/p0-ws-capability-issuer.test.mjs` stays 100% green).
2. **Browser Transport (`docs/cf-relay.js` + `docs/cf-relay.min.js`):**
   - Exact `firebase-relay.js` interface (`window.F123CloudflareRelay`), pure `fetch()` (zero raw WebSocket/EventSource/XHR), in-memory session token wiped on `oc-logout` (never in `localStorage`), visible-only 5s live poll.
3. **3-Layer Cascade & 2.0 Coexistence (`docs/relay-selector.js`, `docs/sync-yjs.js`, `docs/index.html`, `docs/sw.js`):**
   - Cascade order: **Cloudflare DO (`f123_relay_cupo_cf_v1`, 32 MiB up / 128 MiB down) → Supabase → Firebase → Direct Peer**.
   - Fixes `leerFirebase()` + `resolverRecuperacion()` for 3 durable layers.
   - On `oc-login`, clears pre-PIN pause on `f123_relay_cupo_cf_v1` and upgrades immediately to Layer 0.
   - `docs/sync-yjs.js` keeps encrypted private updates (`ventas`, `hechos_financieros`/dinero, `promotoras`/comisiones, `clientes`, `gastos`, `transferencias`) syncing to `f123_relay_cupo_cf_v1` while `modoCorte20Activo === true`, while preserving `C54`/`C56` (`sentLegacy = {0,0,0,0}`).
4. **Tests & Audit (`test/p0-c224-cf-relay-privado.test.mjs`, `test/relay-sin-cloudflare-datos-v557.test.js`):**
   - Verified **121/121 PASS** on real `friendly-123` CI tests + `release-control.cjs validate ae7c7138` (`31 protected capabilities; identity consistent`) + `build-min-scripts.cjs --check` (43/43).

## Exact Surgical Execution Steps for Sol6 (WIP = 1)
1. **Create branch from `origin/master` (`ae7c7138`) and apply the atomic patch:**
   ```bash
   git fetch origin && git checkout -b feat/c224-relay-cloudflare-privado origin/master
   node "C:\00 Projects\claude-f123\friendly123workshop\projects\sync4-architecture-2-0\src\apply-c224-v902.cjs" .
   ```
2. **Deploy `friendly123-relay-privado` (ALWAYS with `--config wrangler.jsonc` + `--dry-run` first!):**
   ```bash
   cd cloudflare-relay-worker
   npx wrangler deploy --config wrangler.jsonc --dry-run
   npx wrangler deploy --config wrangler.jsonc
   # Configure WS_SERVICE_KEY secret (identical value to friendly123-licencias WS_SERVICE_KEY, never print it):
   npx wrangler secret put WS_SERVICE_KEY --config wrangler.jsonc
   cd ..
   ```
3. **Verify locally and open PR #1078 (`v0.9.02`):**
   ```bash
   node scripts/build-min-scripts.cjs --check
   node scripts/release-control.cjs validate origin/master
   node --test test/p0-c224-cf-relay-privado.test.mjs test/relay-selector.test.cjs test/p0-c210-port2-shipped-manifest-seal.test.mjs
   ```
4. **Merge PR when the 7 required checks are green, fast-forward `estable`, and close with real device check:**
   - Open existing device with JFC's store (`v0.9.02`, PIN `5-5-5`) -> automatically uploads compacted encrypted checkpoint to `friendly123-relay-privado`.
   - Open brand-new device (empty IndexedDB, `LORD` + `5-5-5`) -> verify money, transactions, past sales, commissions, and customers appear immediately (`A->B->A x2`, zero local deletion).
