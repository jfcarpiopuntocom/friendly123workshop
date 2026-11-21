# PRECODE P0 Sol6 · Cloudflare HTML redirect + Service Worker navigation · 2026-11-20 Ecuador

## Problema real reproducido

En la misma app friendly-123 v0.8.33, `https://friendly-123.jfcarpio.workers.dev/dashboard.html` responde mediante redirección al URL canónico `/dashboard` (Cloudflare Workers Static Assets con HTML handling automático). Chromium remoto Playwright pudo abrir `dashboard.html` antes de registrar el Service Worker, pero, una vez activado `f123-shell-v833-golden369`, un nuevo `page.goto('/dashboard.html')` falló `net::ERR_FAILED`. Se reprodujo en varias sesiones (primera ruta 200, posterior controlada ERR_FAILED). En el origen histórico GitHub Pages no hay esa redirección y la recarga del dashboard sin red dio 200. Las dos URL pasan verificación SHA real de 131/131 assets (262/262).

Fuente runtime: `docs/sw.js`, fetch handler, branch `esArchivoDelShell`: `cache.match(evento.request)` entrega respuesta cacheada directamente, y `fetch(...).then(guardar)` también entrega una respuesta potencialmente redirigida. Cloudflare documenta `/file.html -> 307 /file`: https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/ . El navegador rechaza respuestas con redirect history no permitido como navegación desde Service Worker: https://stackoverflow.com/a/45440505.

**Hipótesis principal muy fuerte, aún por confirmar mediante introspección de la Response real:** caché incluye la respuesta ya redirigida, que el Service Worker devuelve tal cual ante navegación, y Chromium rechaza. El HTTP 200 final por sí mismo no representa éxito con SW.

## Cambio Ponytail mínimo completo

1. RED primero: test Node `test/p0-sw-navigation-redirect-response.test.cjs`, ejecutar **el fetch handler real de `docs/sw.js`** en VM aislada con CacheStorage falso y Response marcada `redirected:true`. Asegurar: navegación a `dashboard.html` devuelve Response sin historial de redirección, mismo body/status/tipo MIME. Antes del arreglo debe fallar; no dar crédito por regex de código.
2. Un helper puro dentro del mismo fetch handler, solo para `request.mode === 'navigate'` y `response.redirected === true`: reempaquetar con `new Response(response.body, {status, statusText, headers})` (con fallback `response.clone().blob()` si hace falta). Aplicarlo al resultado desde caché Y desde red para navegaciones; no afectar API, version.json, assets no-navegación ni fuentes externas. Nunca alterar datos de negocio.
3. GREEN de prueba RED, más originales SW, release y manifest, y diferencias con GitHub Pages. Crear versión/shell incremental oficial **solo al introducir runtime nuevo**; no editar hashes a mano. REVISAR SHA final, CI full, dos URLs y recorrido Chromium real online/offline (Chromium no acredita WebKit/iPhone físico).
4. Desplegar solo con gates exigidos y reversible, previa comprobación de CI y pruebas en origins sin modificar tienda real. Si algún gate bloquea, mantener candidato PR visible y NO inventar LIVE.

## Alcance, riesgo y reversión

Solo `docs/sw.js`, test y workflow focal más archivos derivados por scripts oficiales de versión/control. Mantener intactos Sync3, IDB, libros comerciales, PIN, relays, Worker de negocio, fondos y datos de Belén. No instalar ni rotar nada en cuentas reales. Evitar políticas nuevas de Cloudflare HTML handling que pudieran romper enlaces de clientes.

Si el RED con Response real no reproduce el fallo, revisar fetch event y Cloudflare Browser Rendering antes de editar. No confundir síntomas idénticos con causalidad certificada. Original 2.0 implementación **100,0/100**, calidad **81,3/100**, GO comercial y físico separados y sin incremento por esta prueba.

## Evidencia externa y estado inicial

- Producción [v0.8.33](https://friendly-123.jfcarpio.workers.dev/version.json), [131/131](https://friendly-123.jfcarpio.workers.dev/version-manifest.json).
- GitHub Pages [v0.8.33](https://jfcarpiopuntocom.github.io/friendly-123/version.json), [131/131](https://jfcarpiopuntocom.github.io/friendly-123/version-manifest.json).
- [QA privado Notion](https://app.notion.com/p/41f1642b67f38180ba89c9d8366eaa32).
- CI anterior #918 63/63 verde, no es prueba P0 de esta nueva ruta.
