# 2026-11-18 · P0 Safari Owner Dashboard PIN · local verifier vs authoritative peer

## Evidence before code
- Production baseline: friendly-123 master `de0487c3771b97392caa7f827ab857605f0cf83d`, v0.7.89, published.
- User reports Opera iPhone dashboard accepts Owner PIN; Safari iPhone same license rejects it. Real-device report, not yet reproducible by browser automation. No customer secrets in this file.
- Confirmed source defect: `src/dashboard/dashboard-main.js` Entrar handler immediately rejects if `leerEstadoLocalActual()` finds a notebook but `pinLocalOk(pin)===false`. It never asks other authorized devices despite a possibly stale Safari browser verifier.
- PIN-only local lockout return object remains authoritative; different-license guard remains. Successful local Owner/Admin PIN still renders without network.
- Transport used for remote Owner check already authenticates PIN and receives encrypted responses, and `verificarPin` waits for affirmative answer. Never grant access based on local mismatch or room membership alone.

## Minimal Ponytail
1. RED behavior test via extracted real Entrar handler: locally outdated verifier, other live team device confirms Owner -> must authorize and ask snapshot; baseline fails. Wrong local PIN plus negative/no remote answer -> remains denied; locked local PIN -> does not try remote; different license -> cannot render stored notebook.
2. In source handler, do not terminate login merely because local verifier returns false; continue encrypted remote Owner/Admin verification, never mark authorized until remote positive. Display diagnostic for active verification. Never use stale local notebook as a confirmed snapshot when local verifier refused.
3. GREEN tests, official `node scripts/build-dashboard-entry.cjs`, `node scripts/gen-manifest.js`, checks and WebKit/Chromium. Seal candidate v0.7.90 / f123-shell-v790 / golden326.
4. PR and gate exact SHA; hotfix Pages release, live GET 200 and WebKit browser, then physical Safari Owner acceptance separately.

## Security/rollback
- No real license, real PIN, photos, customer records or telemetry in repository or tests.
- No PIN reset, no changed crypto verifier, no customer data writes, no opId/outbox mutations.
- Keep `previo` rollback, preserve one shop per license. If remote denies / times out, deny UI. No false 100% claim without physical Safari.
