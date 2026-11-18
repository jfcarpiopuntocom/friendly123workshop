# 2026-11-18 · P0 Dashboard Safari Owner PIN parity · v791

## Physical facts confirmed by JFC
- Safari: dashboard opens and loads real commercial data with one credential (reported as Admin-candidate); Owner PIN accepted by the app open in a separate Safari tab is rejected by the dashboard.
- Same iPhone and Safari origin, business saved locally. User confirmed dashboard DOES load data with the other PIN.
- Sensitive license/PINs belong in private diagnostics, never source, test, GitHub, issue titles or console.

## Grounded source diagnosis
- v790 dashboard `pinLocalOk` checks only the local `OCSecure.verificarOwnerOEmpleado` and `f123_admins_pins`, then immediately opens via `pintarDesdeLocal`. It never invokes the canonical Worker /pin/verify.
- App `docs/auth-ui.js` has `verificarPinOwnerCentral` on the official HTTPS `friendly123-licencias.jfcarpio.workers.dev`, with tenant instance, revision and central Owner adoption.
- Cloudflare connected read-only check found the pictured license in the production KV registry; multiple instance records are linked to it. This does NOT establish that any specific PIN is valid or which role the alternate PIN has.
- v790 remote fallback depends on another live browser tab responding, fragile with Safari background-tab suspension. Same-origin local ledger already exists; a central Owner proof should open it directly.

## TDD / minimal implementation
1. RED test using the real extracted login click handler: central verified Owner succeeds with locally mismatched verifier and no peer; locally accepted Owner rejected by central must not bypass authority; active Admin from this notebook still opens; revoked Admin list without active roster cannot open; disconnected and unknown central responses fail safely; local lockout kept.
2. Add `verificarOwnerCentralDashboard` using official HTTPS only; no user-overridden URL, license+instance match, 2400ms bound, `pinTs:0` to prevent verification from rotating authority, parse 200/401/429/404/409/503. Reuse app's `OCSecure.adoptarPinOwnerCentralVerificado` on authoritative 200 to align local browser, never invent a PIN.
3. Verify locally active admin through the current notebook's `usuarios` roster (not a stale `f123_admins_pins` alone); check Owner against central before trusting local owner verifier. Explicit deny central wrong; no 333/555 literals in source/tests.
4. Run RED→GREEN, synthetic tests, build-dashboard-entry, deterministic gen-manifest and shell, P0 hotfix and release gate, WebKit end-to-end, Pages public check.
5. Physical acceptance requires JFC trying Owner in Safari while retaining original app in another tab; no guesswork about actual PIN/role from code.

## Rollback and scope
Dashboard source+official generated bundle+release identity only, plus tests/workflow. No inventory, photos, money, license rotation at server, outbox or Yjs changes. Preserve /previo.

## Evidence checkpoint · 18 Nov 2026
- Source mismatch verified: commercial app Owner via canonical Cloudflare `/pin/verify`, dashboard through stale local `OCSecure`/Admin-list shortcut.
- Connected Cloudflare read-only research verified license presence in the production registry. Registry contains numerous instance records for that license; these are *records*, not verified current physical devices. No owner PIN or company data read from the customer's Safari.
- PR [#764](https://github.com/jfcarpiopuntocom/friendly-123/pull/764) merged SHA `ea6c173aa1d708cb9cbf2561044455e21c733e5a` from exact candidate `52352a37820f8e6b2c2d1efee313105741fa64ac`.
- Candidate [P0 focused v791](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44380504914) **SUCCESS**, [P0 Hotfix Gate](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44380505003) **SUCCESS**, [release-control](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44380504911) **SUCCESS**.
- Source, official generated bundle and manifest `v0.7.91 / f123-shell-v791 / golden327`; strict static host inventory expanded *only* for the dashboard's Owner `/pin/verify`. Existing WebKit, finance and authenticated broadcast suites green on candidate.
- Merge production deploy [hotfix #44380915291](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44380915291) triggered, status pending at checkpoint. Do not claim live until Pages proven.
- Physical Safari Owner acceptance and role classification of the alternate PIN must be independently observed by JFC; tests use only synthetic credentials.

## Production seal after merge
- [Hotfix + GitHub Pages](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44380915291) promoted `estable` and completed site build/deploy from merge `ea6c173aa1d708cb9cbf2561044455e21c733e5a`: SUCCESS at the checked stage.
- Exact public no-cache GET 200 for `version.json` v0.7.91, `dashboard.html` visible Dashboard v0.7.91, `dashboard-main.min.js` with canonical HTTPS Owner `/pin/verify`, `sw.js` f123-shell-v791. Report generated under `docs/ops/P0-safari-dashboard-owner-v791-QA.md`.
- Post-release Chromium/WebKit `recorrido / recorrer` and independent cold-join `recorrido / union-fria` were still running at this checkpoint; track their final conclusions separately.
- The final real Safari acceptance is only proven by the owner's new report of both roles using the correct same shop and numbers; no synthetic PASS substitutes for physical PIN access.

## Post-release browser evidence (verified)
- [Production Actions #44380915291](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44380915291) job `recorrido / recorrer` **SUCCESS**.
- Live logs: `Publicado: f123-shell-v791 (v0.7.91)`, `Chromium escritorio: Dashboard v0.7.91`, `Safari iPhone: Dashboard v0.7.91`.
- Live CDN GET HTTP 200 for `version.json`, `dashboard.html`, `dashboard-main.min.js`, `sw.js`; new canonical Owner PIN Worker route verified in actual JS bytes.
- This tests shell/navigation on WebKit, not the actual Owner PIN on user's physical Safari. Physical Owner/Admin acceptance remains unverified.
