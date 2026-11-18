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
