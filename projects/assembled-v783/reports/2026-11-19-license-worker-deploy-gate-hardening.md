# Reporte · P0 Seguridad · Compuerta pre-despliegue endurecida de `friendly123-licencias`

- **Fecha:** 2026-11-19
- **PR producto (`jfcarpiopuntocom/friendly-123`):** [#797](https://github.com/jfcarpiopuntocom/friendly-123/pull/797)
- **Rama:** `chore/p0-harden-license-worker-deploy-gate` (base `master@673edca`, CERO colisión con #795 y #796)
- **HEAD exacto verificado en CI:** `b498e77b79c4ad78ece1770dc0867cf44b6da46b` (`b498e77`)
- **PRECODE:** [`projects/assembled-v783/plans/2026-11-19-license-worker-deploy-gate-hardening.md`](../plans/2026-11-19-license-worker-deploy-gate-hardening.md) (`bd85ba8`)
- **Reserva Notion:** `41d1642b-67f3-81da-95f5-f7fc2fa9e7b9` (Liberada, lista para fusión de Sol6)

## Qué protege antes de desplegar `/ws/ticket` a `friendly123-licencias`
1. **Elimina el trigger `push` obsoleto** (`APPROVED-SINGLE-PIN-DEPLOY-20261031` / `f123-shell-v635`): ningún `push` a `master` puede disparar un despliegue automático.
2. **Job `verify` sin secrets en PR y en `workflow_dispatch`:**
   - `node --check` sobre los 8 módulos (`worker.js`, `pin-authority.mjs`, `pin-worker-api.mjs`, `team-authority.mjs`, `team-worker-api.mjs`, `ws-authorized-subject.mjs`, `ws-capability-issuer.mjs`, `ws-worker-api.mjs`).
   - Ejecuta **15 suites / 108 pruebas sintéticas**, incluyendo las 3 suites críticas de `/ws/ticket` (`p0-ws-authorized-subject`, `p0-ws-capability-issuer`, `p0-ws-worker-api`), las 3 de PIN central y las 8 de licencias/DO/pagos/recuperación/sonar.
   - `wrangler deploy --config ./wrangler.toml --dry-run` exige el nombre `friendly123-licencias`, el KV ID `f1599c69c4174cc2b38dd125c18ee3df`, y los 4 bindings (`env.LICENCIAS`, `env.REGISTROS`, `env.MAESTRO_IP`, `env.MAESTRO_INST`).
3. **Job `deploy` estrictamente manual:** `needs: verify` + `if: github.event_name == 'workflow_dispatch' && inputs.worker_name == 'friendly123-licencias'`. No despliega en PRs (`deploy: skipping` comprobado en vivo).

## Evidencia verificada (RED → GREEN → CI GitHub)
- **RED local:** `test/p0-license-deploy-gate.test.cjs` 1/5 pass, 4/5 fail contra el workflow previo.
- **GREEN local:** 108/108 pruebas Node PASS (0.81 s) + `wrangler deploy --dry-run` 4/4 bindings OK.
- **GitHub Actions CI en HEAD exacto `b498e77`:** **11/11 PASS, 0 FAIL** (`deploy` skipping, `CodeRabbit` skipping):
  - `verify` PASS (`44581469344`, 16 s) · `deploy` SKIPPING (`44581469344`)
  - `P0 Hotfix Gate` PASS (`44581469295`)
  - `Release continuity gate` PASS (`44581469384`)
  - `Synthetic sync + real-browser contracts` PASS (`44581469166`)
  - `two-tab-sales` PASS (`44581469373`)
  - `hex-boundary`, `integrated`, `mixed-shell`, `private-health`, `twice`, `Workers Builds` PASS

## Métricas
- **PORT 2.0:** intacto en `81.5/100.0` · **Calidad:** `72.7/100.0` · **GO comercial:** `0/6`. Sin despliegue real ni cambio de secrets/flags.
