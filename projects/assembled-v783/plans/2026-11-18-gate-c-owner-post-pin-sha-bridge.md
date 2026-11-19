# Gate C · fotos SHA Owner tras PIN: puente perezoso, IDB local, no falso ACK

Corte 2026-11-18 Ecuador, main@759ee1d37f5503de5c8beda3a578fd08be48934f; PR #128 integró y certificó el transporte SHA-only offline [24/24 Chromium/WebKit](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44454217429). El cliente comercial sigue arquitectura 2.0 OFF; rúbrica arquitectura 67/100, port 61/100, GO 0/6. Esta tarea no suma puntos sin criterio preexistente adicional. Reserva única de `projects/assembled-v783/app/docs/sync-yjs.js`, sin tocar `app/src/yparty-piloto.js`, vendor compilado, Worker, auth-ui ni LIVE. Root respaldado por [Notion revisión](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94), audit Qwen/Gemini y reportes de Belén.

## RED real (sin fixtures de producto)
- `sync-yjs.js:2608` fija `API.fotoSha = piloto?.fotoSha()` al arrancar, antes del Owner `oc-login` (fuente real `auth-ui.js:1909`), por lo que retorna null y el puente SHA sigue inactivo durante el resto de la sesión. El test debe probar que *antes del PIN no se pide un ticket ni se almacena PIN*, después de Owner login sí se ejecuta `put/get` con credenciales frescas, sin recargar ni hacer navegación externa.
- `sync-yjs.js:2718...` instala wrapper `OCFotos.leerPorHash` sólo si el puente existía en el arranque. `sync-yjs.js:3096+` usa ese wrapper incluso durante el sembrado, consume cuota 16 lecturas GET y puede bloquear lectura IDB por red lenta. El sembrador debe usar método exclusivamente local `__f123PhotoReadOriginal` (instalado en el wrapper), UI read-through queda aparte.
- Cambio de rol, licencia, aparato o PIN durante respuesta HTTP NO puede producir referencia Yjs ni falso ACK; si no hay Owner, no hay subida ni descarga privada.
- Si piloto OFF (todas las tiendas) `API.fotoSha` permanece null, flujo cifrado antiguo sin alteraciones; nunca abrir `-cat` raw Y.Doc a Team. Se prohíbe expedir credenciales en trazas o URL GET.
- Reiniciar sesión en el mismo origen no debe crear segundo escritor ni retener foto byte/dataURL en Yjs bajo un puente activo sin red. Si un PUT falla, IDB local permanece, reintento al `oc-login` o `online`.

## Implementación mínima completa propuesta
1. Nueva función local `crearPuenteFotoPerecedero(piloto,codigo)` dentro de `app/docs/sync-yjs.js`, retorna UNA fachada estable `{disponible,put,get}` si hay piloto; método real `piloto.fotoSha()` se obtiene únicamente AL MOMENTO de cada operación; no cachear bridge, token ni PIN. Revalidar Owner + licencia + instancia + PIN tras cada await. `API.fotoSha` conserva su identidad para los checks existentes de catálogo/Hash.
2. A `oc-login` Owner disparar `sembrarFotosAlRelay()` (código real ya emite el evento); mantener `online` del injerto #128; no tocar `OCAuth` central.
3. Wrapper GET sólo cuando el puente perezoso existe; guard `disponible()` **antes** de aumentar contador de lecturas remotas, no consumir cuota cuando no hay PIN. Reducir GET al sembrador usando fuente local directa.
4. Test fuente Node VM RED antes de código, cubriendo cold pre-PIN, Owner login, sesión revocada a mitad de PUT/GET, instancia de otra licencia, staff, piloto OFF, read-through/local-only y retry. Después GREEN de test focal y native photo #128 en los dos motores, y suite integrada. Nada de despliegue.

## Límites y aceptación
El índice PORT 61/100, calidad 67/100 y 0/6 GO permanecen. El HTTP QA usa Owner y Workerd SHA firmado, pero **no** demuestra foto física PC↔iPhone, ni servicio ticket LIVE disponible, ni piloto de Belén. Fotos de percha y fotos de facturas de gastos son entidades diferentes; preservar ambas. No afirmar que C3 está listo ni que se encendió YParty. Registrar evidencia, SHA de fuente exacto y Notion antes de merge.
