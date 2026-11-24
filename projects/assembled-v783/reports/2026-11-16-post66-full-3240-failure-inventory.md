# Post-#66 native unfiltered historical audit — EXACT 3,240 TAP and by-name inventory

Date: 2026-11-16 Ecuador / 2026-11-17 UTC. Repo `jfcarpiopuntocom/friendly123workshop`.
Exact test SHA: `8edf8d3af2473fbd6b3ce8dd22ca663eb9a071bd`, branch `qa/20261116-post66-full-native-audit`, immutable base `01bc1de853d0324ee90132386efcd709c7b15025`.
[PR #67](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/67), [full unfiltered GitHub Actions 43995004986](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43995004986), job `133744772474`, conclusive outcome **FAILURE** (original strict exit code preserved). Workflow installs locked Node22, official Chromium+WebKit, pinned historical Yjs sources, no production network, runs unfiltered `npm test`, archives TAP/fixture hashes/HEAD even on RED. Not a customer or production release.

## Exact results (never substitute focal GREEN for this full)

| Source full | TAP total | PASS | FAIL | CANCEL | SKIP | Raw `not ok` incl wrapper | CI result |
|---|---:|---:|---:|---:|---:|---:|---|
| [prior post-#61 / pre-#63–66 43989633836](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43989633836) | 3231 | 3183 | 44 | 1 | 3 | 45 | FAILURE |
| [current post-#66 43995004986](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43995004986) | 3240 | 3203 | 33 | 1 | 3 | 34 | FAILURE |

**By exact test name, removed from failure set: 11**. The new full has 9 additional total TAP tests and 20 more PASS; **11 historical fail names absent, 0 new fail names**, but overall global remains RED. Raw `not ok` includes parent test-file wrapper, so counts differ from summary.

### Exact resolved failure names
- src/app/app-inline-03.js — never auto-reload during Yjs peer recovery
- src/app/app-inline-03.js — never auto-reload during local IndexedDB recovery
- src/app/app-inline-03.js — keep upgrades possible only after completed sync recovery
- docs/app-inline-03.min.js — never auto-reload during Yjs peer recovery
- docs/app-inline-03.min.js — never auto-reload during local IndexedDB recovery
- docs/app-inline-03.min.js — keep upgrades possible only after completed sync recovery
- real strict path measures queue, serialization, IDB and total outcome without touching CAS
- P0 JFC: strict CAS stays fenced; verified local A/B recovery is the only IDB-failure fallback
- estatico: workers.dev queda limitado a licencias y senalizacion, nunca negocio central
- estatico: toda llamada fetch/cliente a hosts externos esta clasificada
- test/v579-venta-pn-ack.test.js

### New failure names: 0
None.

## All remaining raw `not ok` lines — exact trace order / first visible error
- **TAP 497** — v459 reader on data from the new mechanic: keeps the old balance, no double discount, no invented cash, no crash (`app/test/customer-debt-follows-sale.test.js:97:1'`) — `2026-11-17T01:24:55.7659224Z     Command failed: git -C /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app show b8bd538:docs/cartera.js`
- **TAP 499** — old device + new device on the same data: the new mechanic fixes the debt, the old one keeps working with real payments (`app/test/customer-debt-follows-sale.test.js:142:1'`) — `2026-11-17T01:24:55.7673645Z     Command failed: git -C /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app show b8bd538:docs/cartera.js`
- **TAP 129** — test/e2-active-user-reload.test.js (`app/test/e2-active-user-reload.test.js:1:1'`) — `'test failed'`
- **TAP 811** — hotfix hands off tested SHA after promotion; broad regression cannot duplicate deployment (`app/test/fast-track-pipeline.test.js:33:1'`) — `"ENOENT: no such file or directory, open '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/.github/workflows/hotfix.yml'"`
- **TAP 1285** — official app keeps bytes and never forwards customer headers or query (`app/test/official-app-source.test.js:3:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1286** — official app follows a new stable source automatically without another deploy (`app/test/official-app-source.test.js:4:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1287** — landing stays on its existing assets and /app keeps correct relative base (`app/test/official-app-source.test.js:5:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1288** — source failures are explicit and cannot silently serve an obsolete local app (`app/test/official-app-source.test.js:6:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1289** — source proof identifies the same promoted commit (`app/test/official-app-source.test.js:7:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1290** — friendly123.com/app/sw.js retires the old worker and never reloads a ?stay=1 tab (`app/test/official-app-source.test.js:10:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1291** — official /app and /app/ redirect directly via 307, without any origin fetch (`app/test/official-entry-redirect.test.js:22:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1292** — new /app?entry=1 bypasses an old cached permanent /app → /app/ mapping (`app/test/official-entry-redirect.test.js:32:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1293** — invalid double-slash HTML paths are not externally redirected (`app/test/official-entry-redirect.test.js:38:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1294** — a deep HTML entry preserves its relative view, never arbitrary query data or license (`app/test/official-entry-redirect.test.js:43:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1295** — JS, SW, version and immutable release proof are still served from the one stable branch (`app/test/official-entry-redirect.test.js:51:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1296** — clients who already own a new-origin notebook retain a non-destructive escape (`app/test/official-entry-redirect.test.js:66:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1297** — HEAD is not a login redirect, POST is never redirected, landing is untouched (`app/test/official-entry-redirect.test.js:74:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1299** — a join invitation survives the redirect; anything else in the query is dropped (`app/test/official-entry-redirect.test.js:100:1'`) — `"Cannot find module '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/sitio-friendly123/official-app.mjs' imported from /home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/test/of`
- **TAP 1310** — P0 hotfix required check invokes exact selector and executes ALL selected test files (`app/test/p0-business-guards-selection.test.cjs:28:1'`) — `"ENOENT: no such file or directory, open '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/.github/workflows/p0-hotfix-gate.yml'"`
- **TAP 248** — test/p0-coldjoin-workflow-secrets.test.cjs (`app/test/p0-coldjoin-workflow-secrets.test.cjs:1:1'`) — `'test failed'`
- **TAP 266** — test/p0-hotfix-gate-contract.test.cjs (`app/test/p0-hotfix-gate-contract.test.cjs:1:1'`) — `'test failed'`
- **TAP 1408** — RED: missing GitHub workflow pull_requests metadata must NOT make a real exact-merge green look unverified (`app/test/p0-hotfix-proof-empty-prs.test.cjs:20:1'`) — `2026-11-17T01:27:14.6336377Z     Command failed: git show -s --format=%P af918a8b832210d14e1718f44ca4018f82653e9d`
- **TAP 1409** — fail closed on unmerged, wrong-base, wrong-head or wrong merge SHA associations (`app/test/p0-hotfix-proof-empty-prs.test.cjs:28:1'`) — `2026-11-17T01:27:14.6362255Z     The input did not match the regular expression /No merged PR/. Input:`
- **TAP 1410** — fail closed on missing or failing exact gate even if merged PR association is valid (`app/test/p0-hotfix-proof-empty-prs.test.cjs:38:1'`) — `2026-11-17T01:27:14.6403804Z     The input did not match the regular expression /No successful verified P0 gate/. Input:`
- **TAP 1411** — fail closed on permissions error in PR association API (`app/test/p0-hotfix-proof-empty-prs.test.cjs:43:1'`) — `2026-11-17T01:27:14.6437738Z     The input did not match the regular expression /Cannot verify PR association: HTTP 403/. Input:`
- **TAP 281** — test/p0-mixed-shell-v636.test.cjs (`app/test/p0-mixed-shell-v636.test.cjs:1:1'`) — `'test failed'`
- **TAP 325** — test/p0-v603-update-consent-click.test.cjs (`app/test/p0-v603-update-consent-click.test.cjs:1:1'`) — `'test failed'`
- **TAP 1872** — a new version shows no strip, never reloads, and tells the waiting service worker to take over (`app/test/p0-v774-version-sin-franja-ni-recarga.test.cjs:20:1'`) — `2026-11-17T01:27:55.1948182Z     the mismatch is detected and the waiting service worker is told to take over`
- **TAP 2335** — public proof records exact artifact bytes and recovery retains the already published canary (`app/test/release-control.test.js:55:1'`) — `"ENOENT: no such file or directory, open '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/.github/workflows/publicar.yml'"`
- **TAP 2452** — Sonar cannot replay an earlier PUSH against a newer master commit (`app/test/sonar-stale-push-guard.test.js:8:1'`) — `"ENOENT: no such file or directory, open '/home/runner/work/friendly123workshop/friendly123workshop/projects/assembled-v783/app/.github/workflows/sonar.yml'"`
- **TAP 2602** — estable y canario conviven: el canario mas nuevo NO borra la cache de los clientes (`app/test/sw-dos-canales.test.js:42:1'`) — `'page.waitForFunction: Timeout 30000ms exceeded.'`
- **TAP 499** — test/sw-dos-canales.test.js (`app/test/sw-dos-canales.test.js:1:1'`) — `'test timed out after 120000ms'`
- **TAP 2889** — v765: todo shell con el adaptador Firebase ya lee el marco 7 (commit 962ebb3a, shell v639) (`app/test/v763-ckpt-tamano.test.cjs:99:1'`) — `2026-11-17T01:30:51.9799784Z     Command failed: git show 962ebb3a:docs/sw.js`
- **TAP 3005** — the Lord stable-entry guard no longer redirects, while historical routes remain noindex (`app/test/yjs-first-join-start.test.js:57:1'`) — `2026-11-17T01:30:51.9935795Z     Command failed: git show 94877828be4da2541f25a142e26ad181e4b3d332:docs/index.html`

## Diagnostic classification: provisional, not proof of product cause
- Some retained failures reference missing *historical Git objects* in the reconstructed workshop checkout (e.g. `b8bd538:docs/cartera.js`, `962ebb3a:docs/sw.js`, `94877828...:docs/index.html`), verified to exist by read-only GitHub upstream. GitHub-only availability does NOT prove the original full runner fetched those objects. Evaluate fixture fetch/readback separately, never import missing private production assets to game CI.
- Other retained failures reference different deployment code paths absent from this workshop candidate (`sitio-friendly123/official-app.mjs`, production workflows for canary/publish/Sonar, etc.). Preserve their contract; do not create fake release artifacts just to turn full green.
- Retained `sw-dos-canales` browser timeout requires reproducible real behavior vs fixture diagnosis; PWA/SW/Workbox are **deferred** by user.
- `e2-active-user-reload` aborts while slicing old source markers before its test cases; can triage separately, but do not alter app update behavior or client SW to satisfy a stale test.
- Product P0 status is NOT established by green 585 alone. Distinct PR #68 native cross-engine synthetic two-cycle A→B→A test launched concurrently and had initial RED on WebKit product seed; source diagnosis needed. It does not prove actual live-transport convergence.
- Cross-device authority, PIN, server-side customer/licence/role, photos and finance ACK remain separately unverified, and remote inbox `stored-for-application` is NOT `business-committed`.

## Next actions and resume
1. Preserve this report in PR #67 alongside pre-run plan `projects/assembled-v783/plans/2026-11-16-post66-full-native-audit.md` (commit `e5469107`). Do not merge or label full GREEN.
2. Update Notion live handoff page with **3,240 / 3,203 PASS / 33 FAIL / 1 CANCEL / 3 SKIP**, exact job links, resolved 11 names and zero new, and customer NO-GO.
3. Avoid tampering with archived test/production paths; if fixing test fixture errors, require authentic RED→GREEN and run project integrated again. Prefer genuine cross-engine ledger/stock causal convergence over artificial full pass count.
4. Do not deploy `jfcarpiopuntocom/friendly-123`, enable commercial scopes, or modify clients until server authority+idempotent executor/readback ACK and two physical PC Opera↔iPhone Safari/PWA→PC A→B→A cycles with same license/PIN succeed. No backend business authority P2 approved by MDD.
