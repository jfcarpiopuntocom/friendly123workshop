# v783 P0 rack activate/deactivate strict ACK — fresh-main integration checkpoint

Date: 2026-11-16 Ecuador / 2026-11-17 UTC. Owner: workshop-only engineering.
Repository: `jfcarpiopuntocom/friendly123workshop`.
New isolated branch: `sol/20261116-rack-toggle-rebase-current-main`.
Immutable base: `df00ac28486056d6574fc96d33d4f06a4df6c1f3` (merged PR #60, after #58/#59).
Active concurrent draft source PR [#52](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/52): head `e887e98c83f802894c5be92371227063217861ee` based on older `c6fb947e`; currently not mergeable cleanly, seven commits behind. Its native Chromium/WebKit red-to-green workflow [43974739736](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43974739736) is SUCCESS. Do not overwrite the original branch. This is an additive **safe port** of its exact proved tiny fix, not a new design.

## Prior evidence and root cause
Latest main `projects/assembled-v783/app/docs/mock-backend.js` still contains old toggle handler in `/api/ubicaciones/:id/(activar|desactivar)`: mutates `u.activa`, `u.rev`, `u.estadoRev`, calls `mov(...)` which publishes Yjs, then returns HTTP 200; generic finally saves non-strict. A dual IDB+A/B quota can falsely ACK and publish a status not durably stored. Distinct from rack POST, PUT and DELETE, which already await `guardarEstadoLocal(true)` and publish only after ACK.

Existing PR #52 full native synthetic tests inject dual storage quota (both `OCEstadoIDB.guardarConRevision` and local A/B journal), require HTTP507 `RACK_STATUS_STORAGE_QUOTA`, no revision/status/movement changes, no Yjs catalog event, successful retry, and cold readback of deactivate/activate exactly once. Two native engines PASS on #52 but its old base is incompatible with latest main; fresh-head verification necessary.

## Mandatory safe execution (Superpowers red-first, Ponytail reusable primitives)
1. This detailed plan is committed **before any runtime/test edit**. Read original PR #52 full patch and exact current main source; ensure old unchanged status handler is byte-identical at matched block; do not change any other endpoints.
2. Add original PR #52 **test suite** to current main (app/test/tab-session-handoff.test.js) and its dedicated no-production-network workflow. Run native Chromium+WebKit test-only RED on fresh main, verifying expected HTTP200 vs demanded 507 **not** harness/setup failures. Stop if RED absent or different.
3. After genuine RED, port ONLY #52 status handler 21-line durability fix into current main backend, preserving every existing adjacent POST/PUT/DELETE case and all other injertos; no duplicate writer, no new dependency. Roll back only exact provisional event if unchanged; if concurrent peer changes, block unsafe writes rather than overwrite.
4. Manifest: compute true SHA256 of final `app/docs/mock-backend.js` (not blob SHA). Replace ONLY its `./mock-backend.js` entry in `app/docs/version-manifest.json`, verify against exact bytes (Node crypto), preserve immutable import `SOURCE-MANIFEST.json`.
5. Run native 2/2 browsers + original related 585 integrated + financial, photos, PIN, stock/credit, exports, asset hash gate; archive real RED and GREEN outputs and exact SHAs. No claim all full historical tests green: last unfiltered full 3228 with 48 fails on older SHA; need fresh full run after merge and by-name comparison.
6. Review current main and #52 live head before merging; if another agent already integrated/fixed toggle in new main, close duplicate instead of overwriting. Open fresh DRAFT PR to current workshop main, merge only when verified and test-only findings (if any) resolved.
7. Document commits, CI URL, failure classifications, and next steps here plus [Notion living log](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902). A 5h stop resumes from this exact file; never repeat solved work.

## Non-negotiable release gates
NO PROD/CLIENT RELEASE from this PR, no real client names/PINs/financial data touched. Still NO-GO until physical PC Opera→iPhone Safari/PWA→PC A→B→A twice, same license/PIN, verified sales/stock/money/photos/roles convergence, IDB/A-B recovery, idempotent opId, ACK of remote financial writes and no double commission. No TinyFish. No changes to production app repository.
