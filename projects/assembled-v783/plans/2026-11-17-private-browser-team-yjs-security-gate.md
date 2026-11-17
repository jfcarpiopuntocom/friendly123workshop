# P0 QA privada de browser: segundo gate seguridad local Team/WS/PIN + Yjs durable

Fecha Ecuador 16 noviembre / UTC 17 noviembre. **Rama importadora privada** `jfcarpiopuntocom/friendly-123-injertos/import/workshop-v783-browser-20261117` HEAD inicial exacto `c201314895edfa4f4d22aa73aa15fc51cafb9bd2`. Procedencia fijada de workshop `55737c2c...`, 1160 archivos verificados y [PR #5 DRAFT](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/5).

## Base de evidencia

- [Import CI 44013567696](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44013567696) 1160/1160 ficheros byte por byte, source tree `da386fb8...`; commit privado `c2013148...`.
- [Browser QA 44013657645](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44013657645) sobre ese mismo SHA: **117/117 PASS, 0 FAIL/SKIP/CANCEL**, cuatro TAP grupos 8+5+83+21. Sigue DRAFT; no prueba Cloudflare real, PIN de clientes ni PWA.
- No confundir con el patch binario de Codex v783 no preservado en GitHub. Evitar claims «TODO funcional» o GO mientras no haya datos de cliente/sync remoto.

## Nuevo gate (plan previo, sin alterar comercial)

Añadir exclusivamente workflow `.github/workflows/qa-workshop-v783-team-yjs-security.yml` a la **misma rama privada de importación** para correr tests existentes de la FUENTE COPIADA, sin editar sus expectativas:

- `test/p0-team-authority.test.mjs`
- `test/p0-team-worker-api.test.mjs`
- `test/p0-ws-authorized-subject.test.mjs`
- `test/p0-team-authority-client.test.cjs`
- `test/p0-team-authority-local-commit.test.cjs`
- `test/p0-central-pin-authority.test.mjs`
- `test/p0-central-pin-worker-entry.test.mjs`
- `test/p0-ws-worker-api.test.mjs`
- `test/p0-v617-recovered-team-gate.test.cjs`
- `test/p0-yparty-pilot-origin.test.cjs`
- `test/p0-yjs-pull-failed-cursor-proof.test.cjs`
- `test/p0-yjs-pending-snapshot.test.js`
- `test/sync3-head-causal-gap.test.cjs`
- `test/p0-opid-before-yjs.test.cjs`
- `test/p0-v633-owner-pin-journal-real-yjs.test.cjs`

- CI Node22 Ubuntu24 `npm ci --ignore-scripts --no-audit --no-fund` con lock de candidato. `node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=120000` y todas las rutas. **No network real de negocio**, no secretos de GitHub Actions, no Cloudflare externo ni facturas, fake browser/local VM sólo.
- Workflow `on.push` focal al añadirse a rama import y `on.pull_request` hacia QA browser para futuras actualizaciones. `permissions:contents:read`, ningún commit/push, ninguna publicación.
- Guardas antes de ejecutar: SHA `git rev-parse HEAD`; existencia de los 15 tests, módulos Team y Yjs, `QA-WORKSHOP-V783-SOURCE.json` con `permission=NO_GO_BROWSER_QA_ONLY_NO_DEPLOY` y origen SHA. Si falla dependencia/fixture, clasificar causa y registrar rojo sin modificar runtime ni test a ciegas.
- Con commit de este workflow cambia HEAD privada: **se debe repetir la suite de 117/117 sobre nuevo HEAD**, no citar el SHA antiguo como GREEN de uno nuevo.
- Si pasan tests y browser, podremos pedir revisión de PR #5 (todavía sin GO) y luego probar WS server-side real con entorno descartable, antes de fusionar a QA o producción. **No tocar** la base QA privada, `friendly-123/master`, los repositorios upstream ni SW/PWA.

## Reanudación si ocurre stop de 5h

Plan dentro de `friendly123workshop` y Notion [reserva del import](https://app.notion.com/p/41b1642b67f381fa96e3e9ad80931af3). Revisar commit privado `c201314895edfa4f4d22aa73aa15fc51cafb9bd2`, historial PR #5 y CI SHA; si faltan checks dejar DRAFT. Confirmar navegador-first, Team y Yjs subtests, manifiesto SHA (full audit 29 FAIL) antes de avanzar. **Prohibido** saltarse tests o declarar protección remota real a partir de fixtures.
