# PRECODE · Endurecer compuerta pre-despliegue de `friendly123-licencias` (`.github/workflows/desplegar-licencias.yml`)

- **Fecha:** 2026-11-19
- **Base real verificada:** `jfcarpiopuntocom/friendly-123` `origin/master@673edca`
- **Colisión con #795 (C15) y #796 (Belén CAS v0.8.04):** CERO (solo toca `.github/workflows/desplegar-licencias.yml` y añade `test/p0-license-deploy-gate.test.cjs`; no toca `docs/*`, `src/*`, `cloudflare-worker/*` ni `cloudflare-yparty-worker/*`).
- **Alcance de despliegue:** NINGUNO. No despliega ningún Worker, no rota ni crea secrets, no enciende `WS_AUTHORITY_QA` ni `TEAM_AUTHORITY_QA`.

## Hallazgo actual (riesgo pre-despliegue)
`friendly123-licencias` en Cloudflare sigue en el deploy del 4 de noviembre (sin `/ws/ticket`). Cuando Sol6/JFC decidan desplegar el Worker actual con `/ws/ticket`, `.github/workflows/desplegar-licencias.yml` hoy tiene 4 brechas:
1. No ejecuta las 3 suites críticas del emisor WS (`test/p0-ws-authorized-subject.test.mjs`, `test/p0-ws-capability-issuer.test.mjs`, `test/p0-ws-worker-api.test.mjs`) ni las 6 suites de regresión de licencias/pagos/recuperación (`worker-licencia-pagada`, `worker-lotes-pagos`, `worker-master-recovery`, `worker-recover-pin`, `worker-sonar`, `worker-soporte-jfc`).
2. No valida sintaxis (`node --check`) de los módulos `.mjs` de equipo/WS (`team-authority.mjs`, `team-worker-api.mjs`, `ws-authorized-subject.mjs`, `ws-capability-issuer.mjs`, `ws-worker-api.mjs`).
3. Su `--dry-run` solo comprueba `env.LICENCIAS` y `env.REGISTROS`, omitiendo `env.MAESTRO_IP`, `env.MAESTRO_INST` y el ID exacto del KV (`f1599c69c4174cc2b38dd125c18ee3df`).
4. Conserva un trigger `push` obsoleto de octubre (`APPROVED-SINGLE-PIN-DEPLOY-20261031` / `f123-shell-v635`) en lugar de limitar estrictamente `deploy` a `workflow_dispatch` explícito y separar un job `verify` sin secrets para PRs que toquen `cloudflare-worker/**` o el workflow.

## Plan Ponytail (RED → GREEN)
1. **RED:** crear `test/p0-license-deploy-gate.test.cjs` exigiendo:
   - sin trigger `push` en `.github/workflows/desplegar-licencias.yml`;
   - job `verify` separado que corre en `pull_request` y `workflow_dispatch`, sin secrets;
   - job `deploy` con `needs: verify` y `if: github.event_name == 'workflow_dispatch' && inputs.worker_name == 'friendly123-licencias'`;
   - `node --check` sobre los 8 módulos de `cloudflare-worker/`;
   - las 14 suites Node del Worker (103 tests sintéticos, incluyendo las 3 suites `/ws/ticket`);
   - `--dry-run` verificando `friendly123-licencias`, `f1599c69c4174cc2b38dd125c18ee3df`, `env.LICENCIAS`, `env.REGISTROS`, `env.MAESTRO_IP`, `env.MAESTRO_INST`;
   - integridad de `cloudflare-worker/wrangler.toml` (`LICENCIAS` antes de `[secrets]`, `preview_urls = false`, `required = ["MASTER_KEY", "PIN_PEPPER"]`).
2. **GREEN:** actualizar `.github/workflows/desplegar-licencias.yml` con el cambio mínimo exacto.
3. **Verificación:** correr `test/p0-license-deploy-gate.test.cjs`, las 14 suites del Worker (103/103), `wrangler deploy --dry-run` y verificar 100% CI verde en GitHub Actions (donde `verify` correrá realmente en la PR y `deploy` quedará skipped).
4. **Métricas:** sin cambios en PORT (`81.5/100.0`), Calidad (`72.7/100.0`) ni GO (`0/6`).
