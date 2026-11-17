# P0 · Legacy manual-sync replay: HTTP rejection is NOT applied (17 Nov 2026)

## Authored BEFORE code and tests · durable shared checkpoint
- Shared repository: `jfcarpiopuntocom/friendly123workshop`.
- Branch: `fix/20261117-lazy-replay-http-ack-p0`.
- Exact starting main: `aa597f894118a0a31d57610e99af6a6ae6c0970a`.
- Executable app: `projects/assembled-v783/app/`; NO files in historical `apps/friendly-123`, root `docs`, `friendly-123/master` or the private YParty PRs.
- Reason: `app/docs/avanzado-extra.js`, function `OCSync.reproducir`, loops over remote encrypted legacy log entries; `await fetchOriginal(op.url, ...)` resolves on HTTP 403/500 and the next lines unconditionally add `op.id` to `f123_sync_ids_aplicados` and `op.opId` to `f123_sync_ops_aplicadas`. This silently suppresses a later valid retry, causing diverging stock/sales after reconnection. No claim yet that this has caused any specific customer incident.
- Existing behavior: throws on network failure (breaks same-device sequence) and guards URL to /api/ and JSON body, but does not inspect response.ok. Legacy manual copy/paste is safety fallback C, not the primary YParty/Firebase transport. Avoid replacing or activating paths.

## Scope and file ownership
Reserve ONLY:
1. `projects/assembled-v783/app/docs/avanzado-extra.js` inside `async function reproducir(ops)`, specifically inspect HTTP response before dedup mark.
2. NEW `projects/assembled-v783/app/test/p0-legacy-manual-replay-http-ack.test.cjs` extracting the ACTUAL function and nearby dedup helpers under Node VM, synthetic remote operations, fake localStorage/fetch; no customer identifiers or external HTTP.
3. NEW `.github/workflows/qa-v783-legacy-replay-http-ack.yml` isolated minimal workflow.
4. This plan; later STATUS.md documentation if verification passes.

Do not edit: `sync-yjs.js`, `sync-outbox.js` (other agents' recent work), YParty worker/client or ticket, PIN, roles, brand, catalog, sales engine, service worker, manifests, generated assets or production. Avoid introducing a new sync engine; leave encrypted outbox and opId unchanged. Never log a URL, body, PIN or token.

## Test-first acceptance
- RED on original real function: HTTP 403 response without network exception MUST NOT mark either applied-ID ledger, nor execute subsequent same-device operations; demonstrate the current bug with failing assertion.
- RED on HTTP 500 similarly fail closed; a 200 afterward applies exactly once with same original ids and operation sequence, including retry of the previously rejected event.
- Network exception leaves ids unapplied and replays later; duplicate successful replay does not apply twice.
- Different sending devices remain independent; a rejected op from device A cannot consume opId/ID from device B.
- Successful HTTP 200 (including bodyless Response) remains compatible; no schema/HTTP endpoint modification. Avoid assuming Yjs synced, network send or generic response is commercial ACK; this guard is only HTTP rejection detection.

## Minimal GREEN implementation
Within try block, retain `const response = await fetchOriginal(...)`, and **before** `aplicados.add(op.id)` require `response && response.ok === true`; otherwise break the current sender's replay sequence, conserving the same `op.id` and `op.opId` for later retries. Do not rewrite the business event, use optimistic success, add new scopes or emit another operation. Preserve the original exact dedup semantics and local-first behavior.

## Verification and release gates
1. Plan commit FIRST, then Notion reservation; tests RED commit and CI showing actual failure, not parser failure.
2. Source one-line/minimal fix after verified RED; focused GREEN and nearby legacy sync tests; syntax/check test.
3. Trigger/read exact-head GitHub Actions logs, plus existing larger QA when practical. Clearly report any unchanged 29 historical full-audit failures and any new ones.
4. No merge/promote until GREEN same SHA; no release deploy; no flag activation; record SHA/logs/readback in workshop STATUS and Notion.
5. This does NOT fix YParty 401 Service Binding, 2 insecure mutable economic ops, 15 historical Firebase missing Yjs parents, one importer/exporter, blobs/photos SHA, Web Locks fallback, iPhone reconnection or physical PC↔Safari A→B→A twice. Maintain NO-GO and Claude's approved closed first-shop checklist.

## Recovery after stop
Read this plan + `projects/assembled-v783/STATUS.md` + the Notion reservation; inspect branch `fix/20261117-lazy-replay-http-ack-p0`, HEAD, CI, last log, and verify original file blob before editing; do not restart TDD if already green. Keep failed/red tests and exact hashes. Prioritize live users and do not interpret a passing synthetic VM as real remote business commit.
