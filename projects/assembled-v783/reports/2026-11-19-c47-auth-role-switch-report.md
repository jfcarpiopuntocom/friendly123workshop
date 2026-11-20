# C47 Verification Report — Real `oc-login` / `oc-logout` 2.0 Role Switch & Disarm Wiring

- **Date:** 2026-11-19 (GMT-5)
- **Base:** `master@879954d` (C45 merged, `v0.8.19`, `PORT 87.5 / Calidad 77.0`)
- **Branch:** `port2/20261119-c47-auth-role-switch-v820`
- **Shell:** `v0.8.20` / `f123-shell-v820` / `golden356` (`docs/sw.js`, `docs/version.json`, `docs/dashboard.html`, `docs/version-manifest.json`)
- **Spend:** `USD 0.00` (all QA flags OFF, ZERO R2, ZERO Worker deploys, zero overlap with PR #844 or PR #841)

## Verification Results
- `node scripts/release-control.cjs validate origin/master` -> `PASS 31 protected capabilities; identity consistent`.
- `bash check-sw.sh` -> all gates PASS (`G2`, `G4`, `G5`, `G6`, `G7`, manifest hashes).
- `node --test test/p0-c47-auth-role-switch-20.test.cjs test/p0-c31-*.test.cjs test/p0-c38-*.test.cjs test/p0-c42-checkout-receipt-status.test.cjs test/p0-c44-*.test.cjs test/p0-architecture-2-port-score.test.cjs` -> **18/18 PASS, 0 FAIL**.
