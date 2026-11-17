# P0 fallback C · HTTP rejection is not a successful applied opId

Date: 2026-11-17. This report is a reproducible synthetic QA checkpoint, not production acceptance.

## Frozen provenance
- Source repo `jfcarpiopuntocom/friendly123workshop`; lab app path `projects/assembled-v783/app/`.
- Base `main@aa597f894118a0a31d57610e99af6a6ae6c0970a`; isolated branch `fix/20261117-lazy-replay-http-ack-p0`.
- [Plan FIRST](../plans/2026-11-17-legacy-replay-http-ack-fail-closed.md) committed `5cea65cf5832c57c013c0d8d78a0584beaf8f55b`.
- [Notion reservation + recovery](https://app.notion.com/p/41b1642b67f3816ca371e12646f24819).
- RED source unmodified; test added `c712847ea6faedbcb0fffd65bff5ee378fda0133`, workflow dependency fix `6d5fb1148b1c0caff751fdb668e68abf1844a402`.
- [True RED run #44124702320](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44124702320) Node22: **5 tests, 1 PASS, 4 FAIL**, no syntax or dependency failures; HTTP 403 and 500 wrongly passed to second same-sender operation, 403 falsely entered applied-ID ledger, null response falsely entered ledger. Network throw test already passed.
- Initial bootstrap workflow run #44124509559 failed before test because Playwright test-firewall dependency was not installed. Resolved with pinned `npm ci --ignore-scripts` + `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`. Do not use bootstrap failure as RED evidence.
- Minimal code change at `app/docs/avanzado-extra.js`, commit `927e83822183f90f00f24f3f467ab71c2ee5c020`, source blob `c328c3723ff39f55cab2fb2e357140e942df1508`. Readback: successful `fetchOriginal` Response required `respuesta.ok === true` before marking `op.id` and shared `op.opId` applied.
- [Focused GREEN run #44124856066](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44124856066) SHA `927e838`: **5/5 PASS**, 0 FAIL/CANCEL/SKIP. Same tests, exact source, blocked production network.
- [Expanded GREEN run #44125031317](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44125031317) SHA `db97377d07e355d0c57b2869a196a359101e9f74` (only added two adjacent IDB regression files in workflow; business JS identical to `927e838`): **11/11 PASS**, 0 FAIL/CANCEL/SKIP. Covers HTTP 403/500, retry IDs, different sender, null response, network exception; IndexedDB transaction abort, local fallback/dual failure, successful IDB commit, and IDB transient error/blocked/throw reopen. Syntax `node --check` both files PASS. Runtime Node22.

## Business effect and honesty
In the manual/legacy `OCSync.reproducir` fallback ONLY, an HTTP rejection no longer consumes the dedup ID or skips a rejected sender's next operation on a future retry. The same original intent/ID remains retryable. Other senders continue independently, successful 2xx is still accepted. NO secondary sale, no new outbox, no role/scope change, no interface change. HTTP success is **not** proof of business-level ACK; endpoint may need semantic payload validation as a separate bounded scope. This was a static source flaw and a reproduced synthetic fixture; do not state it caused any real customer's divergence without correlated evidence.

No deployed shell, workers, client stores or PINs changed. Historical full suite remains NO-GO (last candidate [#44116661596](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44116661596): 3277 tests /3244 pass/29 fail/1 cancel/3 skipped, compared with baseline 58 fail); no new full audit was run. Vercel check on branch independently rate-limited deployments (do not construe as this test failing or a production deployment); root GitHub Pages/workshop may run on pushes but projects subtree excluded.

## Next engineering gates (do not add new first-shop requirements)
1. YParty typed economics and actual server rejection of employee writes in ops/-cat, backed by real Owner/Team authority and fresh tickets per channel (other agents currently own those files).
2. Move photo bytes out of Yjs to existing SHA-chunk storage in same DO, keep only metadata in Yjs; one-time Firebase→DO importer certifying zero pending structures+SHA; tested reversible exporter.
3. Browser Web Locks fallback + Safari visibility/pageshow reconnect, then physical Opera↔Safari on iPhone twice, with stock/sales/money/photos/reconnect equivalence. Do not treat this RED/GREEN as these gates.
4. Owner human GO after closed checklist passes. No PWA work or deployment from this branch.

## Rollback
If regression occurs, revert **only** the two newly introduced statements assigning `respuesta` and checking `respuesta.ok`, preserving the original `opId` and ledger. Re-run this 11-test suite; the 4 RED tests should reappear, proving why that revert is unsafe for fallback integrity. Do not remove audit evidence or erase customer local stores.
