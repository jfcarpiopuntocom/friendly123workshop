# Recuperar y ejecutar sin depender de otro contenedor

## Cliente autorizado añadido el16 de noviembre

Leer primero [el informe de cliente](reports/2026-11-16-authorized-client.md), porque el resultado223/223 anterior no acredita los casos nuevos. Instalar ambos lockfiles con npm ci. Para ejecutar el conjunto ampliado en una máquina que ya disponga de las bibliotecas de sistema de Chromium/WebKit:

```sh
cd projects/assembled-v783/app
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install chromium webkit
cd ../relay/injertos/yparty-worker
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

En CI, el workflow usa `playwright install --with-deps chromium webkit` para instalar también bibliotecas de sistema. No inventar un PASS si no pueden instalarse en un equipo local; conservar el error de entorno. Para foco sin browser se puede ejecutar `node --test --test-concurrency=1 qa/p0-authorized-provider.test.mjs`:11 casos de transporte/solicitud de pase. El lote de integración es `qa/p0-real-session-room.test.mjs`:16 casos, incluidos Chromium y WebKit. Los módulos del cliente se empaquetan en la fixture con esbuild resuelto desde el lockfile del relay, sin añadir paquetes ni reconstruir a mano el bundle histórico.

Las pruebas solo usan identidades sintéticas y HTTP/WS locales. El adaptador de fixture intercepta la solicitud del endpoint de emisión antes de acceder a red externa; no se llama al Worker productivo. No abrir la app con perfiles reales para repetirlas. La aceptación comercial y el incidente awareness siguen pendientes aunque una repetición CI pase.

Clonar `https://github.com/jfcarpiopuntocom/friendly123workshop.git`. Leer AGENTS.md y START-HERE. El commit inicial con fuentes completas es `44b93c9a2687f6a9eec222e2037d685e2dbeefd8`. El repositorio es público; los perfiles de prueba siempre son desechables y sintéticos.

Desde `projects/assembled-v783/app`:

```sh
npm ci
node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=45000 test/p0-team-authority.test.mjs test/p0-team-worker-api.test.mjs test/p0-team-authority-client.test.cjs test/p0-team-authority-local-commit.test.cjs test/p0-ws-authorized-subject.test.mjs test/p0-central-pin-authority.test.mjs test/p0-central-pin-worker-entry.test.mjs test/p0-money-imported.test.cjs test/p0-workbox-registration-path.test.cjs test/team-access-hardening.test.js test/p0-ws-capability-issuer.test.mjs test/p0-ws-worker-api.test.mjs
node scripts/prepare-test-browsers.cjs
node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=45000 test/p0-team-authority-browser.test.mjs test/p0-assembled-browser.test.cjs
```

Si el sistema no permite escribir en ~/.npm, npm admite `--cache /ruta/escribible`. Si se usa PLAYWRIGHT_BROWSERS_PATH, conservarlo igual al instalar y ejecutar. No cambiar versiones por problemas de permisos del entorno. Logs de esta ejecución en evidence/issuer/workshop-core.txt y workshop-browser.txt: 91+2 pasan.

Desde `projects/assembled-v783/relay/injertos/yparty-worker`:

```sh
npm ci
node --test --test-concurrency=1 qa/p0-real-session-room.test.mjs
```

Consultar STATUS antes: la entrega inicial conserva dos tests relay rojos pendientes, no es un release seguro. El test ejecuta Workerd local y usa las autoridades reales desde app/ con registros sintéticos transaccionales en memoria; no crea recursos remotos. La copia de src/index.js conserva fragmentación b93 de512KiB. El guard seguro se limita a Owner-private mientras shared cat/ops/fotos carezcan de proyección/command boundary completos.

No desplegar este árbol ni abrirlo con perfiles/licencias de clientes. No hay pruebas físicas ni Cloudflare remoto acreditadas. La prioridad de trabajo es navegador; no modificar PWA/SW para repetir estas pruebas.
