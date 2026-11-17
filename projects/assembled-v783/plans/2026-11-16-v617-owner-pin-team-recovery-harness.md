# v783 PIN team recovery historical harness — plan and 5h restart checkpoint

> REQUIRED Superpowers: systematic-debugging → TDD RED observed → minimal GREEN → verification-before-completion. Ponytail: reuse real PIN helper, no invented identity authority.

Date Ecuador: 2026-11-16. Repo `jfcarpiopuntocom/friendly123workshop`.
Branch `sol/20261116-v617-pin-recovery-vm` based on exact main `6a536cb3e49bf8472136e718ee2771c5591c2f11` (#56). Independent of #52 rack toggle and #58 Yjs harness.
**No changes to auth runtime, PINs, real businesses, server, worker, production or UI. NO-GO release.**

## Root-cause evidence from unchanged full historical audit
Full [run 43983149410](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43983149410), job 133704459844 (PR #57) failed 48 of 3,228 tests. Two isolated failures in `app/test/p0-v617-recovered-team-gate.test.cjs`:
- TAP #1662 `joined team login cannot overwrite original device owner PIN` fails at test line 48 `assert.ok(at > 0 && stop > at)`; actual production `docs/auth-ui.js` method is now `async function validar(code, esReintento)`, while test searches for obsolete exact signature `async function validar(code)`, hence stop=-1. Current `alinearYEntrar(code, rolEntrada)` uses only `OCSecure.recordarPinQueAbre`, and does NOT call `fijarOwnerPin(code)` (confirmed exact slice and nonmatches). Test is stale, not demonstrated privilege bug.
- TAP #1664 `unrecovered team metadata shows pending without classifying PIN as wrong` fails as `check(true, '432').ok === undefined` instead of true. Actual snippet invokes `canalAccesoListo(Y)`, introduced in v769, but historical `new Function('window','error', readiness)` lacks that helper and falls through its catch. The real `canalAccesoListo` helper in `docs/auth-ui.js` is `return !!(Y && Y.canal && (typeof Y.canal.accesoListo === "function" ? Y.canal.accesoListo() : Y.canal.recuperando === false));`. The snippet also uses `guardarPinEnEspera(code)` when not ready; old harness never supplied these lexical inputs.
- The two original neighboring dynamic tests verifying actual owner/staff/accountant 3 PIN roles and rejecting wrong/retired PIN all PASS. Do NOT alter their assertions, product authority, rejection messages or lockout policy.

## Implementation TDD (test-only)
1. Preserve existing full RED evidence exactly (done); checkpoint this plan before modifications.
2. In the PIN test for login, use `indexOf('  async function validar(code, esReintento)', at)` matching real current function signature. Preserve check that only `recordarPinQueAbre(code, rolEntrada)` is called and never `fijarOwnerPin(code)`; do not weaken boundaries.
3. In readiness test, extract actual `canalAccesoListo(Y)` helper between `function canalAccesoListo(Y)` and `function soltarPinEnEspera()` from real auth-ui source, assert exact extraction boundaries, inject into test's `new Function` scope, then provide synthetic `guardarPinEnEspera`, `code`, `esReintento`, without changing the readiness logic. Vary `accesoListo()` independent of `recuperando` to validate v769 priority, and assert queued PIN exactly once on genuine missing credential/readiness. Keep original checks for ready owner, unrecovered room, demo PIN rejection, lockout absence, no access granted on missing owner metadata.
4. Add workflow `.github/workflows/v783-v617-pin-recovery-harness.yml` reusing Node22/npm ci and `--require ./test/helpers/sin-red-produccion.cjs` guard to run **entire original file** `node --test --test-concurrency=1 test/p0-v617-recovered-team-gate.test.cjs` (no filtering), archival TAP/SHA even failure; no production network.
5. Review 3-file diff (plan/test/workflow), open DRAFT workshop PR. Fetch actual job logs and 0 skip/0 fail evidence; no claims until verified.
6. Check current main and #52 rack, #58 Yjs, #57 full audit before any integration. Merge workshop test-only if safe/green. Full audit still NO-GO; require physical PC↔iPhone A→B→A two cycles plus financial remote ACK.

## Other risks / reviewer focus
- Never grant wrong PIN just because access metadata is unavailable; UI must show pending, avoid incrementing lockout, and never call `entrar`.
- A real channel with `accesoListo() === false` is unready even when `recuperando === false`. If access proof is true while legacy `recuperando === true`, the verified access proof wins (v769).
- Avoid timers in test: stub only local `guardarPinEnEspera`, verify invocation count, run real readiness helper.
- No impact on persisted local secret, owner revision, synthetic/real monetary business data, compiled assets or version manifest.
- Continuity: record exact SHA, full-file RED→GREEN run URL and diff in this plan and [Notion log](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902) for next agent.