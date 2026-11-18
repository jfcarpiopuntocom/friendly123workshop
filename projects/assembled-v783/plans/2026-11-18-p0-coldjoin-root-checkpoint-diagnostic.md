# 2026-11-18 · Root P0 cold join: diagnose old encrypted checkpoint and browser termination without touching shops

## Release evidence / hypotheses (do not conflate)
- Production v0.7.92 merged c7be66104583bf48bb3018759bc4c1c5a669b58f, HTTP 200. Hotfix run 44393365047 publish + Chromium/WebKit smoke successful. Separate cold join job 135117862153 fails.
- v792 synthetic cold-join: checkpoint metadata consultado=true/checkpointExiste=true, latest operation cut >1d after checkpoint (band only). At 207 seconds, 25 successful pull pages and 4,775 ciphertext frames, `pullMas=true`, 16 unresolved parent groups, no Owner metadata; then page diagnostics unavailable, exception in RECUPERACION. Firebase 132 HTTP 2xx, 11 HTTP 4xx (not classified), 1 network failure; six peer WS opened/closed, 5 errors.
- v791 previous run 44380915291 similar 28 pages/5348 frames, 16 parent gaps, Owner absent; checkpoint probe unknown in that attempt. Not proof the underlying crypto bits were missing. Pending Yjs structs are expected while remote pull has more pages.
- New root suspects, undecided: (A) checkpoint genuinely old/expensive tail; (B) Firebase 4xx due to room invalid or 404 for missing metadata vs 429 quota, currently indistinguishable; (C) browser process/page crashed after long catch-up; (D) HTTP read stalls. Do NOT assume loss. Build evidence before patching product sync.

## Next smallest diagnostic PR (only `scripts/canario-union-fria.cjs` and new `test`, no docs/ or release)
1. Count Firebase HTTP 400/401/404/409/429 separately, and other 4xx, keeping existing aggregate counters. No URLs, body, credentials, timestamps, IDs.
2. Label checkpoint probe refusal cause as a fixed enum (no room, wrong active layer, absent native reader, malformed head, internal failure). Keep original consultado/checkpointExiste semantics; old tests must pass.
3. Observe page `crash`/browser `disconnected` events, report booleans and `page.isClosed()` on exception without logging exception text.
4. Test actual canary code via Node VM harness with mocked safe response/status and no room capability; prevent any release/customer code from changing. Existing `test/p0-canario-*` and `test/p0-cold-join-*` run focal.
5. Read-only synthetic QA run only if existing `recorrido` can reuse the same synthetic secrets without touching clients or duplicating a 5-min costly canary. Do not weaken coldjoin GO criterion or add 33-minute wait. One code owner per file.

## Exit
Deterministically distinguish 404 vs 429 and browser crash; only then choose a transport checkpoint fix. 2.0 OFF. Preserve historical encrypted bytes, PIN authority, stock, money, photos, before/after screenshots and opIds untouched.
