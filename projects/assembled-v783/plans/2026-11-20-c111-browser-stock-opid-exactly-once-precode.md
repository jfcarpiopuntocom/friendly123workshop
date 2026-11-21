# C111 PRECODE: Browser stock adjust exactly once after ambiguous CAS ACK
**Owner:** Sol6/ChatGPT. **Priority:** JFC browsers 10:1 over PWA, Nov 20 2026.
**Same product:** jfcarpiopuntocom/friendly-123, no new app; workshop only plan and evidence.
**Notion reservation:** https://app.notion.com/p/41f1642b67f3811cb1c2c436b0fec21d

## Reproduction grounded in master v0.8.33
`docs/mock-backend.js` /api/productos/:id/ajustar:
* applies delta to p.stockActual and derives PN before verifying any existing opId;
* creates `_opIdAjuste` but does **not** persist it in `mov('ajuste')` hash-chained `movimientos`;
* `_fetchConCandado` re-runs `_fetchInterno(url,opts)` after 503 STOCK_DURABILITY_UNCONFIRMED if a newer IDB `_rev` exists;
* `src/app/app-inline-01.js` manual +/- and quantity box send `{ delta, motivo }` without explicit opId.

If first IDB transaction committed but returned ambiguous false, a rebase of committed state can apply the same delta twice. Claude's offline real-store QA reports 7→5 after a single -1 plus reload and intermittent 503, which makes this P0. This is a plausible root, not a proven field causality until the RED harness reproduces it.

## Ponytail complete fix
1. RED: execute **actual** `docs/mock-backend.js` via `test/helpers/browser.cjs`. Mock IDB `guardarConRevision` that stores first candidate with a newer revision but reports `false`; `leer` supplies that commit during CAS rebase. Require exactly one signed movement and one delta, no doubled stock on repeating identical `opId`; unmodified master should fail. Also test same opId but different product or delta returns 409; retry after reload recognized.
2. Make `opId` a stable identifier of each adjustment **intent**, provided once by both actual UI routes. Validate ID format on supplied ids; legacy/no-id requests keep backward compatibility with generated id and no promise of dedup across independent replays.
3. When committing, record `opId`, `productoId`, `delta`, `stockFisico` if applicable in existing signed `mov(...)` detail before strict save; no network before durable ACK. On incoming replay, check prior signed movement and exact intent fingerprint. Return existing result/current ficha with `duplicate:true` and zero effects if identical; reject mismatch with 409. Do not use timestamp as ordering rule.
4. The canonical ID should be based on existing `crypto.randomUUID()` where available, fallback to `uuid` if appropriate. **No UI refetch/new opId per CAS attempt**.
5. Full focused regression stock/finance/auth, 100-point score remains independent and unchanged until source-backed result. Bump `v0.8.34 / shell v834 / golden370` only once in final candidate, generate `version-manifest.json` via official script, run `check-sw.sh` and full release gates. No direct production writes, secrets, PIN, customer data, PWA edits except standard version identity, or Cloudflare flag changes. Do not merge if tests fail.

## Precautions
Only touch `docs/mock-backend.js`, `src/app/app-inline-01.js`, `test/p0-browser-stock-adjustment-opid.test.cjs`, single focused workflow, and official derived shell/version files. Claude PR #923 owns `docs/estado-idb.js`, do not alter or merge it. One file owner per stream.

Status at creation: PRECODE, implementation NOT YET VERIFIED; browser operational focus, commercial GO 0/6, physical QA 0/5.
