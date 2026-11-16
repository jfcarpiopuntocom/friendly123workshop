# v783 rack PUT validation atomicity — TDD evidence and integration gate
Date: 2026-11-16. Scope: synthetic laboratory only, branch `fix/v783-rack-put-validation-atomic-20261116`, [PR #40](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/40).

## Exact bug and root cause
In `app/docs/mock-backend.js`, rack PUT assigned `u.nombre` and `u.comisionSocio` before validating `pctQuedaEnCasa` and the incompatibility between `contribFija` and `escalasComision`. After a 400 rejection, the mutated object remained visible via GET and the generic `finally` attempted a local save. This is an **atomicity defect**, distinct from PR #39's 2xx acknowledgment for rack POST and the still-open nonstrict PUT/DELETE durability gap.

## RED
- Plan `plans/2026-11-16-rack-put-validation-atomic.md` committed before test/source changes: `f02b1c6986d5c139fe773c0375687e105101392d`.
- Test-only commit `8132830677b8c9d32775efb66c1e177420cc86ee`; protected native-browser workflow `deacf5b9a3cbed388fffd298ad22f8de2bcf08e9`.
- [RED CI 43953443734](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43953443734), job 133601669828: 0/2 PASS, 2/2 FAIL, no skips. Both Chromium and WebKit reported `400 must not retain a partial rename`: actual `REJECTED pct change` vs expected `Synthetic immediate rack` after HTTP 400. Expected functional failure, not browser installation issue.

## Minimal fix
- `fd99ede1e129955d8f9ca6e6294fc263d465aa1e`: prevalidates only the existing three rejecting rack PUT conditions before any field mutation, removes duplicate checks later. Preserves errors and valid percent mapping; no dependency, new engine, format, money/role/stock/photo modification.
- Source SHA-256 computed in GitHub Actions from actual normalized bytes: `4c2fc228931f8c08f80a58b7827f285ad228150828e9fc35f508fa0cdbda23bd`.
- `e7de1a1276495fc67930335a4479248247ef7898`: updates **only** `./mock-backend.js` entry in `docs/version-manifest.json`. Version, SW and other assets unchanged.
- `5d2d6e5bfaa18ec8e70327d9ce80af6ad5225806`: adds check that valid rename and 15% house share still produce the expected rack / 85% partner share.

## GREEN and still-open gates
- [GREEN 43953943528](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43953943528) 2/2 Chromium/WebKit, 0 fail, 0 skips.
- [Final focal 43954263653](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954263653) on updated regression with valid-edit assertions: 2/2, no fail/skip, both official native engines.
- [Expense/money integrity 43954263904](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954263904) SUCCESS (exact source hash manifest).
- [Credit/money 43954784899](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954784899): SUCCESS on exact source SHA `8710daa6017770bbb7e9780e184680fb44f85455`.
- [Expense/integrity 43954784920](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954784920): SUCCESS on same SHA.
- [Integrated browser/authority 43954785668](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954785668): **SUCCESS, 585/585 PASS, 0 FAIL/SKIP/CANCEL**, 15 groups. Independently counted TAP groups from job 133606380301 (105+8+5+22+28+248+7+8+31+1+33+21+6+27+35=585). The test with the third cold tab is included on this SHA.
- [Latest focal 43954784965](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954784965): 2/2 native Chromium and WebKit after rejecting partial updates, cold third-tab state inspection, and valid PUT 15% house / 85% partner.
- Earlier integrated runs of older intermediate SHAs were cancelled by newer branch pushes: not evidence of test failure, not substitute for the SUCCESS run above.
- Global `npm test` full candidate-vs-baseline audit still red historically, not newly certified by these focused tests.
- PR #39 is concurrently changing rack POST; do **not** clobber its guarded strict commit. PR #40 is separate and remains DRAFT until fully integrated and reviewed. Explicitly cross-linked in PR #39 issue comment 6929018088.
- **Not fixed here:** Valid PUT/DELETE can still respond HTTP 2xx before asynchronous generic save; business-global ACK, full roles, photos/relay, and physical PC→iPhone→PC convergence are not certified. No production deploy.
