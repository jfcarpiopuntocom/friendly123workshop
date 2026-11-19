# PORT 2.0 · Gate D6 · fuente R2 congelada y certificada → lector REAL (PRECODE, 19 noviembre 2026)

## Jerarquía vinculante

1. **Destino/producto**: `jfcarpiopuntocom/friendly-123` master `853075dcd7c3fb0782e7e33c11bfaddff57dee94`. Es allí donde debe entrar código y pasar pruebas; el workshop es SOLO plan/auditoría/checkpoints. Sync3 es parte de 2.0 y no debe tocarse.
2. **OpenCode/Hermes**: observador, no implementador. Releer Notion [handoff](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94), [frozen source/paging audit](https://app.notion.com/p/41d1642b67f3810891f0f987393fcf94), [PITR audit](https://app.notion.com/p/41d1642b67f38119a1fbc7b3188e1f79).
3. **Causa raíz**: Gate D2–D5 ya desplegables en app real leen `env.WS_FROZEN_HISTORY_SOURCE.fetch` pero no existe ningún Worker real de fuente inmutable ni Service Binding en QA; los tests usaban fakes. Crear **solo el lado fuente de lectura R2 y sus contratos**, manteniendo flags QA OFF, sin convertirlo en certificación del Firebase real todavía.
4. **Reserva Notion**: sin reservas activas de `cloudflare-yparty-worker` según consulta anterior; revalidar antes de editar.

## Especificación Ponytail

- Nuevo `cloudflare-yparty-worker/src/frozen-r2-source.mjs`, entrada independiente `fetch(request,env)`, invocada via POST `/v1/frozen` desde el Service Binding ya contemplado en Gate D; sin endpoints PUT/PATCH/GET ni origin externo público; `workers_dev:false` en configuración independiente `wrangler.frozen-source.jsonc`.
- **Grant**: `Authorization: Bearer WS_SERVICE_KEY` y room `F123_FROZEN_ROOM` (32-hex y canal -ops/-cat) y HEAD `F123_FROZEN_HEAD` preasignados. Sin grant, consultar R2 está prohibido. No inventar secretos ni HEAD del negocio.
- **Head/páginas inmutables**: R2 key `f123-frozen/v1/<room>/<head>/<channel>/manifest.json` y `page-0001.json`, etc. No mutador de R2 en el Worker. El sha de bytes EXACTOS de manifest está anclado **fuera de R2**, en `F123_FROZEN_OPS_MANIFEST_SHA256` o `...CAT...`. Cambiar bytes R2 manteniendo HEAD debe romper hash; no puede cambiar ROOT, paginas ni conteos sin cambiar pin.
- Manifiesto estricto: `version:1`, room y channel, head, `expectedStateSha256`, `expectedVectorSha256`, `expectedOpIds` para ops; para cat require `expectedProjectedSha256` y `projectionVersion:v1`, y proyección detached sólo dos mapas (ver consumidor). `pages`: array de 1–8 consecutivos, `chunk,firstFrameIndex,frameCount,bytes,sha256`, `rootSha256=sha256(concat(chunk+':'+sha+'\\n'))`; totales idénticos; ops ≤12MiB; cat ≤24MiB (pero cat privado seguirá sin habilitarse). Rechazar >4MiB JSON por página, >64KiB manifest, >4096 frames/página, >16384 frames globales.
- Cada `page-nnnn.json` contiene exclusivamente `{frames:[base64,..]}` y se verifica SHA256 de los bytes Yjs prefijados con longitudes de 4 bytes BE; si alguna página o manifiesto es corrupto/mutado/ausente, `409/503` fail closed sin `completeToHead`. Reintento mismo chunk devuelve mismos bytes del **mismo HEAD**, nunca reconstruye Y.Doc ni reinterpreta datos; no escribir ni devolver datos privados al navegador.
- Respuesta al consumidor exactamente contrato del código integrado en `src/trusted-frozen-source.mjs`. El Worker vuelve a verificar SHA/manifiesto (defensa en profundidad); el consumidor repite verificación y aplicación Yjs/carácter causal antes de importar en SQLite. No incluir nombres de bucket ni secretos en respuestas/errores.
- TDD **RED** con Miniflare Workerd `R2Bucket` real del sandbox y `readTrustedFrozenSource` de producto como consumidor real, 0 datos de negocio: resultado 2 páginas 2 frames vs estado oracle, reintento head inmutable, 401/403 sin R2, wrong room/head, digest/root/chunk y page body tamper, página ausente, manifesto y bytes oversize, flag OFF Gate D y falback sin SQL, cat proyección sólo pública.
- TDD **GREEN**: nuevo módulo read-only+test+config, ningún cambio al navegador, Sync3, legacy, `index.js`, dominio actual o Cloudflare en producción. GitHub exact-head CI y controles generales, luego merge y verificación de `master`. Cloudflare QA flags OFF, Servicio Binding aún ausente porque NO EXISTE archivo histórico real certificado en R2.

## Medición honesta

- El usuario pide **80% del PORT del camino real 1.0→2.0**, no 80% del workshop. Regla: contar rutas productivas sustituidas, NO líneas, PRs ni tests. Mientras `src/yparty-piloto.js` devuelva a legacy por privacidad y el Worker QA esté OFF, no afirmar 80% de rutas activas.
- La fuente R2 es un bloque 2.0 integral pero no es un corte real hasta congelar/validar universo Firebase HEAD y resolver 19 padres Yjs faltantes y 9 HTTP401 previamente observados. Siguiente: packer de snapshots inmutables / exact bytes y canal público cat con safe Y.Doc, issuer QA, prueba física PC↔iPhone.
