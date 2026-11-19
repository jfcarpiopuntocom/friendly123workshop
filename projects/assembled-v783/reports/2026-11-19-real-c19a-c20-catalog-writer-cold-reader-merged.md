# 2026-11-19 · C19a + C20: writer único de delta y cold read Yjs REAL · MERGED en producto

## SHA de fuente de verdad
- App `jfcarpiopuntocom/friendly-123` (NO workshop), `master@312201073975e3237014254fe9d87b87763c14ea` verificado tras PR C20.
- C19a [PR #811](https://github.com/jfcarpiopuntocom/friendly-123/pull/811), merge SHA `91fef9c84d91dd54b3a2466225c66f20546985fa`, candidate `beb8d034e72fe84b76848a7fdf5398b7a4cdb563`: 14 SUCCESS, 1 CodeRabbit SKIPPED, 0 failures.
- C20 [PR #812](https://github.com/jfcarpiopuntocom/friendly-123/pull/812), merge SHA `312201073975e3237014254fe9d87b87763c14ea`, candidate `499cf34972b844d86d2608fdb1875210ce00bab2`: **30/30 checks SUCCESS**. [Real-Yjs/Workerd QA](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44600298131), [Release continuity](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44600297598), [PORT failback gate](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44600297423), all SUCCESS.
- [PRECODE C20](../plans/2026-11-19-real-c20-readonly-yjs-abstracttype-hydration-precode.md); [Buzón C20 reservation](https://app.notion.com/p/41d1642b67f381ba8eccc0a1b6f3b0bd).

## Real causal discovery and RED→GREEN
C19a's independently executed actual YParty/Workerd test found C12 read-only cold join failed after WS sync: when receiving remote structs via `Y.applyUpdate`, `Y.Doc.share.get('productos')` and `ubicaciones` remain untyped `AbstractType` until `doc.getMap`. Earlier C12 tests injected a fake provider that directly called `getMap` when populating rows, obscuring this issue. `assertPublicCatalogTransportDoc` (C9) properly rejected the untyped maps.

C20 added a synthetic-but-real Yjs update test (8 C12 tests): original branch RED 7/8; `openCertifiedReadOnlyPublicCatalog` now checks that BOTH public roots exist before binding exclusively `getMap('productos')` and `getMap('ubicaciones')`, then invokes the UNCHANGED strict C9 allowlist, rejecting any other root including `_meta`, `ventas`, PIN/cost/contact data. After patch, 8/8 green. It does **not** initialize new shared data, publish the private Y.Doc or write to public socket.

Second independent Workerd test uses actual `Tienda` Durable Object SQLite, C11 certified historical HEAD, central one-use Owner `cat:read` tickets, actual `AuthorizedYProvider` and browser-side C12 module bundled with the SAME Yjs instance. It verifies cold public reading from remote Yjs, preservation of private local Sync3 data and response-only display, closes provider, stops historical source, restarts Worker, and reads again from certified SQL without re-querying the frozen source. PASS.

## C19a new writer (independent, no UI cutover)
`src/port2-catalog-delta-writer.mjs` checks C11 with a one-use `cat:read` ticket; obtains a second one-use `cat:read,cat:write` token; begins with EMPTY Y.Doc to avoid reauthoring frozen history; verifies exact canonical public projection parity and allows only `product.upsert`, `product.delete`, `shelf.upsert`, `shelf.delete`, all validated against strict public allowlist. Enforces C10 single writer: second Owner blocked, 1008 => inactive, no automatic second writer. Workerd test confirms deltas reach reader; SQLite cold restart retains result. It does NOT yet constitute active commercial catalog publishing. Global first SHA failed due a root test requiring Worker-local `yjs` without installing it in root; corrected with shipped vendor Yjs fallback before merge; no under-tested green claim.

## Browser release seal
C20 compiled real `docs/vendor/yparty-piloto.min.js` from official `scripts/build-yparty-piloto.cjs`, and regenerated `docs/version-manifest.json` through official builder. Exact bundle SHA256 `a4730abd63a194a28a3c20a40ee78cbac4f171e9a4cee69be3962685e1b3867d`; pinned in `.github/workflows/qa-port2-v785-shell-seal.yml`. Shell **v0.8.07** (`f123-shell-v807`, `golden343`) coherent in `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`. Full 30/30 CI on final SHA before merge; no cloud deploy asserted. Different from GO to customers.

## Metrics and constraints
As of master BEFORE separate quality review: PORT implementation **81,5/100**, quality engineering assessment **74,6/100**, commercial GO **0/6**. C19a is a stand-alone, unhooked writer; C20 repairs a previously accredited C12 reader. **No PORT score increase** until another legacy path is actually replaced. A small, evidence-specific improvement in quality for real C20 cold-join regression may be separately reviewed through versioned metrics, with `previous`, `delta`, and exact SHA.

**No new Cloudflare/R2 expenditure authorized, USD 0,00.** No R2 buckets created, no object write or binding activated; six QA flags remain OFF at last verified read. No Sync3 changes, no client commercial store changes, no physical iPhone test, no customer history imported. Workshop stores this audit only.

## Causal next step
Now that C12 cold reader and C19a writer work separately, integrate a deterministic single-writer **catalog delta bridge** into real client WITHOUT emitting an initial snapshot and with strict historical HEAD+parity, then replace the active catalog read/write route under one-store QA rollback. Only after proven user-visible replacement grant `typed-delta-and-legacy-retirement` points (4.0 pending), not simply because the writer module exists. Commercial `Confirm Sale` still needs same-DO business ACK and Idempotent outbox evidence; R2 source + physical PC–Safari cycle remain needed for GO.
