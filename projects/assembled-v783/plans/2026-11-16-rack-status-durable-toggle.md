# v783 P0 rack activate/deactivate durable ACK — checkpoint before code
Date: 2026-11-16 (Ecuador). Repo: `jfcarpiopuntocom/friendly123workshop`. Branch `fix/20261116-rack-active-toggle-durable`. Base exact workshop main **`c6fb947efb3611fd831fc90a2f0ba8dd8021411d`** merged PR #51. This document is the mandatory restart point across 5h stops.

## User mission and nonnegotiable boundaries
The same license+PIN must open same business and preserve sales, stock, money, photos and roles, even after iPhone/PC reconnection. The scope here is the narrow rack status toggle only. No new dependency, framework, backend, relay, photos service, or UI redesign; reuse mature Yjs, IDB and existing guards. No user/customer data, real production/worker, real PIN, deploy, or scope changes. **NO-GO customers** regardless of laboratory CI: the historical full is red, physical PC↔Safari/PWA A→B→A ×2, real remote business ACK and exact-once remain pending.

## Root cause observed in current source
In `projects/assembled-v783/app/docs/mock-backend.js` `/api/ubicaciones/:id/(activar|desactivar)` currently mutates `u.activa`, `u.rev`, `u.estadoRev`, calls `mov('ubicacion-reactivada'/'ubicacion-desactivada')` (which broadcasts catalog), returns `J(u)` HTTP success while generic finally executes non-strict `guardarEstadoLocal()`. No awaited durable ACK; a dual-failure IDB+A/B may falsely return HTTP 200 and expose a provisional rack status. Compare proven patterns in same file: #39 rack POST, #43 category batch, #48 rack PUT and #51 DELETE each await `guardarEstadoLocal(true)`, conditionally roll back and broadcast only after ACK.

## Phase A: TDD RED first
1. Build one paired Playwright Chromium/WebKit synthetic test in `app/test/tab-session-handoff.test.js` beside existing #51 DELETE regression, using existing guarded `context`, `seed`, `ownerLogin` and `api`. Seed rack and second rack status explicitly. Every test uses its own browser context; no network/business IDs outside synthetic test.
2. For BOTH `desactivar` and `activar`, inject `OCEstadoIDB.guardarConRevision` and `.guardar` -> false, `idb.ultimoError` -> `QuotaExceededError`, and `Storage.prototype.setItem` only A/B journal keys -> `QuotaExceededError`. Require both injectors triggered, **HTTP 507 RACK_STATUS_STORAGE_QUOTA** (not success), original active status and `rev,estadoRev`, movement count and seal unchanged, **zero** `oc-catalogo-cambiado` announcements. Ensure failed toggle doesn't affect unrelated products, money or sales. Test first under real Chromium/WebKit and verify **RED due to HTTP 200 vs 507**, NOT setup errors.
3. Restore writers and retry toggle once; require HTTP200 and correct active state, `ubicacion-desactivada` / `ubicacion-reactivada` movement exactly once after cold opening in fresh page. Test both directions, including reactivation, while keeping at least one other rack available.
4. Commit test and a small GitHub Actions workflow under `.github/workflows/v783-rack-status-durable-tdd.yml` on branch. Native Chromium/WebKit, Node22 npm ci, production-network guard, original source SHA, failure logs archived even on RED. Do not modify runtime until logs prove correct failure.

## Phase B: smallest current-code fix after RED
5. In handler, snapshot previous rack keys (via existing `clonar(u)`), movement count and `selloUltimo`. Apply same mutations and `mov(...,false)` (no precommit broadcast); record provisional changed rack (via existing `clonar`), appended movement identity and seal.
6. Set `debePersistir=false`; use `await guardarEstadoLocal(true)` (already supports IDB strict CAS and verified A/B fallback). If false, restore only own old rack keys, movements/sello IF same rack object, all provisional keys, appended movement and seal unchanged; if concurrent peer changed any object, set `_estadoLecturaBloqueada=true` and `_errorBloqueoLectura` to fail closed rather than erase peer changes.
7. Return HTTP507 with `RACK_STATUS_STORAGE_QUOTA` on confirmed quota, HTTP503 with `RACK_STATUS_DURABILITY_UNCONFIRMED` otherwise, no event; on true durable ACK, call `avisarCatalogoCambiado()` once and preserve original `J(u)` success payload. Do not invent automatic retry for non-idempotent status transitions.
8. Recompute true SHA256 of `docs/mock-backend.js`; edit only `./mock-backend.js` in `app/docs/version-manifest.json`, confirm Node crypto in CI. `SOURCE-MANIFEST.json` is immutable import provenance and stays unchanged.

## Phase C: verify, integrate, continue
9. Require native 2/2 green plus #39 rack POST CAS, #47/48 PUT, #51 DELETE, #43 category, finance/credit/photos and exact-head 585 integrated; list all skipped/failures. Compare current latest main for concurrent agent changes before any merge. If same status toggle already fixed by someone else, close duplicate PR preserving all evidence instead of overwriting.
10. With verified green and exact-head SHA, optionally merge workshop-only PR. Full historical suite remains NO-GO, physical PC↔Safari/PWA twice and remote commercial ACK not assumed.
11. Log exact SHA, RED/GREEN URLs, latest code, decision and next executable steps here and in Notion living log `https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902`. On an interruption the next worker reads this plan then GH Actions, never repeats solved tasks.

## Review focus
- Toggle handler matches without method guard; preserve preexisting method/response contract and do not create new access scopes.
- A failed write with quota **never acknowledges** status flip nor appends movement/tombstone.
- Ensure rollback restores `estadoRev` in addition to `rev` and `activa`.
- Avoid overbroad disposal/rollback or deletions of peer facts. Preserve production networking block and no real data in tests.
