# C47 PRECODE — Real `oc-login` / `oc-logout` -> `cambiarRolComercial20` & `failbackToLegacy` Wiring (`identity-rooms/commercial-role-switch`)

- **Date:** 2026-11-19 (GMT-5)
- **Base:** `master@879954d` (C45 merged, `v0.8.19`, `PORT 87.5 / Calidad 77.0`)
- **Shell Bump:** `v0.8.20` / `f123-shell-v820` / `golden356`
- **Budget:** `USD 0.00` (all QA flags OFF by default, ZERO R2, ZERO Worker deploys)
- **Collision Check:** Zero overlap with PR #844 (C46 QA/workflow only) and PR #841 (`docs/core/ledger.js` red-team).

## Root Cause
`docs/auth-ui.js` dispatches `CustomEvent("oc-login", { detail: { rol, demo } })` (line 1909) and `CustomEvent("oc-logout")` (line 2002) whenever a user unlocks, switches role (`dueno` <-> `empleado` / `admin` / `contador` / `artista`), enters demo mode, or locks the app. However, `docs/sync-yjs.js` had ZERO listeners on `oc-login` or `oc-logout`, leaving `API.rolComercial20Activo`, `API.fotoSha` (including Owner PUT authority), and `API.modoCorte20Activo` / `-cat` single-writer lease stale across role switches and logouts.

## Minimal Ponytail `full` Fix
In `docs/sync-yjs.js` (inside `if (piloto && typeof piloto.crearClienteFotosShaCertificado === "function")`, right after `API.activarCorte20Runtime`):
- Attach `oc-logout` and `oc-login` listeners (guarded by `if (window.OCYjs && window.OCYjs !== API) return;` so stale notebook instances cannot interfere):
  - `oc-logout`: disarm `API.modoCorte20Activo = false`, `API.corteFotosShaActivo = false`, `API.fotoSha = null`, `API.rolComercial20Activo = null`, and call `API.coordinadorCorte20.failbackToLegacy("oc-logout")`.
  - `oc-login`: if `demo === true` or non-commercial role (`contador`/`artista`/missing), disarm identically; if `dueno`/`admin`/`empleado` and 2.0 was active (`modoCorte20Activo || corteFotosShaActivo || rolComercial20Activo`), release Owner `-cat` lease on downgrade to `empleado` and call `API.cambiarRolComercial20(rol, { cortarLegadoFotos: API.corteFotosShaActivo === true })`.
- Bump `docs/sw.js`, `docs/version.json`, `docs/dashboard.html`, `docs/version-manifest.json` to `v0.8.20` / `f123-shell-v820` / `golden356`.

## Verification Plan (TDD RED -> GREEN)
1. `test/p0-c47-auth-role-switch-20.test.cjs` (real `docs/sync-yjs.js` VM): proves `oc-login` (`dueno -> empleado`, `demo: true`, `contador`) and `oc-logout` cleanly downgrade `API.fotoSha`, `API.modoCorte20Activo`, `API.rolComercial20Activo`, and invoke `failbackToLegacy` (RED before edit, GREEN after).
2. `node scripts/release-control.cjs validate origin/master` + `bash check-sw.sh` + existing P0 suite (`p0-c31`, `p0-c38`, `p0-c42`, `p0-c44`, `p0-architecture-2-port-score`).
