# P0 importación verificable de todo el árbol ensamblado del workshop a QA privada de browsers

**Fecha Ecuador 16 noviembre / UTC 17 noviembre 2026.** Importar de **repo PÚBLICO** `jfcarpiopuntocom/friendly123workshop@55737c2c6c99b27aa003855445105b5675fd550b`, ruta `projects/assembled-v783/app`, SHA del árbol Git `da386fb8bf02c518c576e3354494f9d440ed297c`, a rama NUEVA **privada** `jfcarpiopuntocom/friendly-123-injertos/import/workshop-v783-browser-20261117` derivada de QA browser `ee4460177b5f85ca605717f78bd9fc88b82f3339`.

## Por qué y qué sabemos

Notion [war room](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902) confirma orden de JFC: **BROWSERS FIRST, PWA DESPUÉS**. El `candidate.patch` y `imported-sources.tar.gz` de Codex v783 original **siguen sin aparecer como bytes auditables**, por lo que NO atribuir este source a Codex ni su SHA al patch de Codex. Es una variante explícita, **`workshop-v783`**, ya presente bajo control GitHub en `friendly123workshop`, con múltiples reparaciones, tests y piezas importadas. No etiquetar "v783 final". No tocar `friendly-123` comercial ni QA browser base.

Un árbol API `git/trees/da386fb8bf02c518c576e3354494f9d440ed297c?recursive=1` confirmó **1.220 entradas; 1.160 archivos** (no symlinks, no rutas tipo .env/private keys/node_modules), entre ellos `docs/index.html`, `docs/mock-backend.js`, `docs/team-authority-client.js`, `src/app/app-inline-01.js`, `cloudflare-worker/team-authority.mjs`, `team-worker-api.mjs`, `ws-authorized-subject.mjs`, `package-lock.json`, test funcionales. Esto permite probar con browser real la app ensamblada sin esperar un workspace local no publicado.

## Plan FIRST, jamás copiar fuentes incompletas o sin prueba

1. Registrar Notion reserva para **nueva rama aislada** en privado, no impedir trabajo de Codex sobre su reserva `sync-outbox.js` y no modificar `qa/browser-first-v782-sol6-20261115`, `main`, `upstream/` ni `injertos/`. Guardar este plan en workshop antes de cualquier workflow privado.
2. Crear rama importadora desde SHA `ee4460177b5f85ca605717f78bd9fc88b82f3339`, añadir `.github/workflows/qa-import-workshop-v783.yml` con `on.push` **solo al crear/modificar ese mismo workflow** en la rama importadora. Permiso contents:write restringido a ese job; no secrets ni credenciales reales, no ejecutar app/third-party scripts. Bloquear commits simultáneos: normal `git push` FF only, nunca `-f`.
3. `actions/checkout` del repo privado y checkout de `jfcarpiopuntocom/friendly123workshop` en **SHA exacto** `55737c2c6c99b27aa003855445105b5675fd550b`; verificar HEAD y SHA de directorio con Git, número 1160 archivos, ausencia de symlinks/credenciales; abortar en divergencia. `rsync -a` del árbol app al ROOT de rama importadora, **sin `--delete`**; conservar `upstream`, `injertos`, `qa` y workflows existentes.
4. Crear `QA-WORKSHOP-V783-SOURCE.json` con SHA/árbol/fecha/cobertura y `QA-WORKSHOP-V783-FILES.sha256` para comprobar byte-for-byte los 1160 ficheros; `sha256sum -c` contra destino. Mensaje explícito **NO_GO_NOT_CODEX_CANDIDATE**, nunca incluir tokens, PIN, negocio ni URLs privadas.
5. Commit y push en esa rama **solamente** si SHA/archivos/paths cuadra, fail closed si el push no es FF. Guardar GitHub Actions run, commit, número real y hash del manifiesto en workshop/Notion.
6. Abrir PR desde `import/workshop-v783-browser-20261117` **a `qa/browser-first-v782-sol6-20261115`**. Dejar PR **DRAFT**, no merge ni deploy, con alcance y procedencia. Su `.github/workflows/qa-validate-final-v783-browser.yml` debería validar estructura, dependencias, Chromium/WebKit y dinero/fotos/Team. Añadir gate específico de PR #74 cursor proof en workflow adicional no invasivo si el import pasa.
7. **Si workflow import falla** por permisos/quota/fetch, registrar logs, no asumir copias; reparar arnés solo en rama import, no mentir que v783 fue portado. Si tests browser rojos, enumerar fallos reales y escribir RED/plan, no rebajar tests.
8. Para GO futuro: revalidar origen de Codex patch `987b1d2c83666b7729c4c31a36a41d12a3ff47bc16e40639a4b6e033c811fa62` y tar `04e799e4271c2ffbde84058cbee992115555854c4bfb8ed9aa8b4171ae776817` en privado o comparar funcionalidad y licencias importadas. Reconciliar PR #74 y audit 29 rojos. Pruebas físicas Opera PC ↔ Safari iPhone ×2 con dinero/fotos/stock/PIN siguen pendientes. User PWA diferida; bloquear serviceWorkers en test.

## Seguridad / rollback / continuidad

- **NO production, NO real data, NO release, NO PWA installation**, no changes to `friendly-123` or Team Worker externo. La importación de 1.160 archivos en rama privada no supone funcionar la app. No correr scripts importados en job con token write: job únicamente copia+verifica+commitea. La QA siguiente usa token READ.
- Prohibido overwrite de `qa/browser`, `upstream`, `injertos` y `.github` salvo crear el workflow explícito.
- Recuperación de 5h: primero revisar esta página, Notion, `import/workshop-v783-browser-20261117`, runs de `qa-import-workshop-v783.yml`, PR correspondiente, HEAD exactos. Ningún otro agente puede dar por terminada la integración de Codex por esto.
