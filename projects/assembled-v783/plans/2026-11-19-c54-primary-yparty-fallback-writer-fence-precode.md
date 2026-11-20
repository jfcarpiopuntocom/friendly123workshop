# C54 PRECODE · fix PRIMARY Yjs legacy fallback writer while cutover is active (same friendly-123)

**Fecha Ecuador** 2026-11-19 / UTC 2026-11-20. Repo funcional de usuario: `jfcarpiopuntocom/friendly-123` master post-C53 (PR #852 merged SHA `7c5f6637ceab125711da84bbd25b1152a79b5df3`). Este repo `friendly123workshop` es solo registro. **Sync3 permanece integrado.**

## Causa raíz observada directamente en fuente actual

- `docs/sync-yjs.js` en `API.doc.on("update")` envía siempre a `API.canal.enviarUpdate(update)` aun bajo `API.modoCorte20Activo === true`. C52 [PR #851](https://github.com/jfcarpiopuntocom/friendly-123/pull/851) ya cerró envíos legado `canalSombra`, `opsCanal`, `fotosCanal` bajo modo 2.0, pero NO cerró **API.canal**.
- `usarRelayHabitual()` reconfigura `API.canal = canalesRespaldo[0]` (equivalente a `API.canalSombra`) cuando falla el piloto; esto deja una posible publicación 1.0 de catálogo mientras 2.0 está armado, o un doble escritor si el piloto/legacy reconectan.
- `API.canalPiloto` es el transporte piloto YParty que SÍ necesita `enviarUpdate(update)` durante el corte 2.0. Nunca silenciar indiscriminadamente API.canal: rompería la publicación nueva.
- `API.canalSombra` es el legado cifrado que se debe mantener operativo después de failback. Ya existe barrera C38 contra antiguo `OCSync`, pero es una fachada distinta de este emisor Yjs.
- No supuestos extra del informe Hermes frío: `open-existing-store.mjs` ya une 100 hechos congelados + 10 locales, Workerd test real ya existe, así que no duplicar.

## Contrato mínimo RED → GREEN

1. **RED** extender `test/p0-c52-legacy-channel-retirement.test.cjs` (mismo test ya real, no nueva suite): escenario piloto actual `API.canal === API.canalPiloto`, writer nuevo sigue (1 envío); al cambiar temporalmente API.canal a `API.canalSombra` con 2.0 activo no sale ningún update legado; al bajar flags de corte vuelve a enviar una vez, sin duplicar sombra. IDB/local outbox permanece, BC no cambia. No reclamos físicos.
2. **GREEN Ponytail 1 línea** en la fuente: en el handler `API.doc.on("update")`, `if (!API.modoCorte20Activo || API.canal === API.canalPiloto) API.canal.enviarUpdate(update)`. Mantiene escritura normal con switch QA OFF, nuevo piloto activo, corta solo emisor legado al fallo de pilot bajo corte 2.0.
3. **RELEASE** v0.8.23 / shell v823 / golden359; actualizar `docs/version.json`, `docs/dashboard.html`, `docs/sw.js`, `docs/version-manifest.json` con SHA256 exacto de fuente real; `bash check-sw.sh` y `release-control` CI.
4. Ejecutar C52 test nuevo, C38/C47/C51/Workerd C49 y full CI. No fusionar con errores. Verificar Cloudflare Workers Builds exact merged SHA **SUCCESS** y QA flags OFF.
5. **SCORE-ONLY después de merge funcional**: crédito máximo del presupuesto existente `typed-delta-and-legacy-retirement` todavía pendiente **1,0**: si componente REAL integrado/testeado, desglosar **0,5 DONE** por fence del emisor principal cuando es legado; **0,5 PENDING** por retiro total/QA físico. Migración potencial 90,0→90,5/100; calidad migration potencial 78,1→78,3/100, solo con evidencia y rubrica fija100,0. Comercial GO0/6, físico0/5. No crear nuevo punto ni pedir proveedor.

## Boundaries / ownership

No modificar source económico `docs/core/ledger.js` (PR #841 RED / private #14 GREEN bajo otra reserva), no tocar Worker real `cloudflare-yparty-worker/src/index.js`, ni desplegar workers/cambiar R2/PIN/licencia de clientes, ni flags QA. Fotos conservan SHA fuera Yjs. Único propietario de `docs/sync-yjs.js` en PR C54, revisar HEAD de master y PRs abiertos antes de editar. App real es producto; workshop plan y evidencia persistente.

## Gates

Full GH CI + release hash + Cloudflare build; source fingerprint. Accept synthetic QA only as engineering confidence; no physical PC↔Safari/PWA acceptance. Si falla, documentar y no contar puntos. `F123YPartyPilot`, Yjs, IndexedDB existentes: sin nueva implementación de sincronizador.
