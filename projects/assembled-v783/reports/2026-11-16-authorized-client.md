# Cliente importado: pases nuevos, pausa segura y recuperación del mismo documento

## Primera CI del cliente y corrección del aislamiento de fixtures

[CI43864873058](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43864873058), SHA3b1862ab1531b9eac6b78ca52028caeb5d9cb021, ejecutó238 pruebas: **237 pasan,1 falla**,0 omitidas. [Log íntegro](../evidence/ci-43864873058.txt). Los lotes de app211/211 pasan; cliente/relay26/27. El caso de awareness pasó en esa repetición, sin cerrar por ello su intermitencia. WebKit sí arrancó con las dependencias oficiales del runner: su fallo fue un429 real del emisor al solicitar el pase de un observador, no una incompatibilidad WebKit ni fallo de instalación en CI.

La causa del429 es acumulación de los escenarios en una misma instancia ficticia durante una sola ventana de cuota. La fixture ahora registra instancias independientes de navegador y observador para cada motor, dentro de la **misma licencia y sala canónica**. Cada una obtiene pases por la autoridad real. No se aumenta el límite32/min, no se borra el registro de cuota, no se omiten casos ni se cambia la aserción HTTP200 esperada en un dispositivo legítimo. El test del núcleo que exige32 emisiones y rechazo de la33 permanece intacto y pasó en la CI. [Chromium tras aislar fixtures](../evidence/issuer/authorized-client-chromium-isolated.txt). Falta la siguiente CI para acreditar el nuevo SHA.

## Resultado y estado

Se incorporaron fuentes de cliente, no un reemplazo casero de Yjs/WebSocket: `app/src/authorized-yprovider.mjs` adapta el proveedor importado2.2.0, y `app/src/ws-owner-ticket-params.mjs` solicita un pase al issuer ya implementado. Son componentes listos para continuar la integración, **sin activar el piloto comercial ni desplegar**. La app histórica, IndexedDB, opId/outbox, credenciales existentes y shell/PWA permanecen sin cambios. No confundir la fixture de un documento privado con la migración del catálogo o de las ventas reales.

## Fallos reproducidos antes del adaptador

El proveedor importado captura el fallo de renovar params y reconecta con la URL anterior. Con pases de uso único eso intenta reutilizar un ticket consumido. Además, `connect()` puede terminar después de `disconnect()` y abrir un socket que la sesión ya no quiere; dos solicitudes concurrentes pueden dejar la URL de la sesión más antigua.

[RED original](../evidence/issuer/authorized-provider-red.txt): tres fallos observados mediante WebSocket real local. [GREEN inicial](../evidence/issuer/authorized-provider-green.txt): tres pasan. El servidor WebSocket de estas pruebas solo acredita el comportamiento del transporte; la prueba del emisor y persistencia reales se describe aparte.

El adaptador hereda YProvider y llama al `connect` síncrono del WebsocketProvider importado después de obtener y validar parámetros nuevos. Conserva el protocolo, codificación CRDT, awareness y transporte de upstream. Una generación invalida resultados de solicitudes anteriores o canceladas. Rechazar credenciales deja el documento intacto, retira la URL con el pase y exige reanudación explícita. No instala otro login, no firma roles del navegador, no reescribe vendor y no crea un almacén comercial paralelo.

## Revisión independiente y correcciones

El revisor de contexto limpio revisó solo este cliente nuevo. Encontró dos asuntos Important y ninguno Critical:

1. Pausar y reanudar inmediatamente encontraba el socket anterior todavía cerrándose y retornaba éxito sin conectar. Reproducción independiente: un handshake, una solicitud de pase, shouldConnect:false después de reanudar. Se corrigió esperando el cierre y comprobando de nuevo la generación antes de obtener el pase nuevo.
2. Si el issuer respondía pero el relay rechazaba la admisión, se emitían pases en bucle. El revisor midió ocho intentos en170ms con cierre1008 y seis con rechazo HTTP403. Ahora se permite un reintento de admisión no confirmada y después se pausa. Solo una sincronización efectiva del protocolo reinicia el presupuesto. No se interpreta esa sincronización como ACK comercial. Una nueva acción explícita de conectar inicia otro intento acotado; la integración con eventos de la app todavía está pendiente.

[RED de revisión](../evidence/issuer/authorized-client-review-red.txt): tres fallos por esos dos asuntos y un pase de la comprobación de destrucción pendiente. [GREEN final focal](../evidence/issuer/authorized-client-review-green.txt):11/11. Se conservó además la cobertura de destrucción durante emisión, solicitada por el plan; no destruye el documento que pertenece al llamador.

El revisor no aceptó el servidor previo ni una migración comercial completa; ese límite se mantiene. No hubo segunda revisión presentada como aprobación.

## Solicitud al issuer existente

El destino está fijado en fuente a HTTPS `/ws/ticket` del Worker de licencias; no se obtiene de localStorage ni de un parámetro de URL. El PIN vigente va únicamente en el cuerpo POST, con no-store, credenciales de cookies omitidas, sin referrer, redirects rechazados y timeout2,4s. El getter lee la credencial existente en cada intento; el módulo no conserva una copia del PIN ni la guarda en storage.

Solo se solicita Owner-private con los scopes actuales priv:read/priv:write. No se deduce Owner de un campo rol ni se habilitan salas comerciales de otros roles. Se rechaza identidad incompatible, cambio de PIN/instancia durante la solicitud, HTTP no exitoso, respuesta caducada o malformada. El servidor sigue siendo quien verifica el PIN y la autoridad actual. Este cliente no sustituye esa verificación.

[RED del componente de emisión](../evidence/issuer/owner-ticket-client-red.txt) y [GREEN7/7 del primer conjunto](../evidence/issuer/authorized-provider-and-issuer-green.txt). Las respuestas sintéticas de los casos de validación no se cuentan como prueba de autenticación real.

## Integración que sí se ejecutó

El test añadido a `p0-real-session-room.test.mjs` usa el cliente nuevo, los módulos reales del issuer/registro y el relay Workerd con SQLite. Exige un token distinto al reconectar, deniega con la autoridad apagada, conserva el mismo opId sintético en el documento, permite una edición local pendiente y tras reanudar exige que otro Y.Doc/cliente reciba exactamente ese mismo valor. El adaptador transaccional del registro es en memoria; no es Cloudflare desplegado.

Otra prueba espera dos caducidades reales de pases de400ms y exige tres conexiones confirmadas con pases nuevos, conservando las actualizaciones. Evita que el límite de admisiones no confirmadas rompa la renovación legítima tras caducar.

En Chromium real, se cargan el bundle Yjs/y-indexeddb existente y los módulos nuevos. Dos perfiles/clientes intercambian el documento mediante Workerd. Con la autoridad apagada se escribe un valor pendiente, se espera la transacción nativa IndexedDB, se recarga la página, se exige recuperar el mismo opId/valor y después se comprueba su recepción por otro cliente. localStorage y sessionStorage continúan vacíos en esa fixture: los módulos no persistieron PIN/ticket. [Primer pase Chromium](../evidence/issuer/authorized-client-chromium.txt).

El endpoint HTTPS fijado se redirige **por el adaptador de la fixture** a HTTP local; no se envían las credenciales sintéticas a producción. Se bloquea toda red HTTP/WS externa y Service Worker. No son la UI de login completa, una venta comercial real, un iPhone físico ni una prueba TLS contra producción.

## Resultado local completo, con fallos conservados

`PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npm test` del paquete relay ejecutó27 casos: **25 pasan,2 fallan**,0 omitidos. [Log completo](../evidence/issuer/authorized-client-final-local-suite.txt).

- Fallo de producto/aceptación aún abierto: el caso anterior de awareness/revocación observó un frame. La traza sintética lo asocia con grantSeq376 y revocación377: autorización anterior a revocar, recepción posterior. La asociación es ordinal; no se presenta como prueba causal definitiva ni se elimina/rebaja la aserción cero frames. El relay servidor no se modificó en esta continuación. Se contrasta además con el test de main para no asumir sin evidencia que es anterior.
- Fallo de entorno: WebKit no inicia por bibliotecas de sistema ausentes. `node node_modules/playwright/cli.js install-deps webkit` intentó elevar mediante su y falló `Authentication failure`; no se forzó la instalación ni se usaron credenciales. [Salida de instalación](../evidence/issuer/authorized-client-browser-system-deps.txt). CI ya tiene `playwright install --with-deps chromium webkit`; el nuevo caso WebKit debe pasar allí antes de acreditarlo.

Se extrajo el test exacto del HEAD main e32b55f, se ejecutó desde una copia temporal en la misma ruta lógica y se retiró únicamente esa copia creada por la prueba: **12/12 pasan** en esa ejecución. [Log baseline main](../evidence/issuer/authorized-client-main-baseline.txt). Esa ejecución no reprodujo la intermitencia; tampoco invalida el fallo nuevo ni el fallo del mismo caso registrado antes en CI43843328597. No se concluye por conveniencia que sea ajeno al cambio ni que esté arreglado. Hace falta cerrar la investigación de tiempos/envíos antes de aceptar producción.

Los errores iniciales de build/resolución de módulos y los dos errores de preparación del cierre en navegador quedan en evidence con sufijo build-error/setup-error. No se cuentan como RED de producto. La fixture del navegador se corrigió para usar un código de cierre permitido y tolerar que el relay ya hubiese cerrado al detectar el apagado de la autoridad.

## Condiciones que siguen abiertas

El workflow ahora ejecuta tanto las11 pruebas focales como el lote ampliado Workerd/browser. Falta resultado CI de este nuevo SHA. El incidente awareness sigue abierto aun si una repetición pasa. No hay GO de clientes. No se renombra el documento cat a priv ni se envía el catálogo completo a una sala nueva para fingir permisos correctos.

La siguiente integración comercial necesita proyecciones de lectura por rol, comandos tipados con autoridad/commit durable/opId y vínculo con los stores existentes, ACK de fotos, eventos de pausa/cierre de sesión/cambio de negocio y failback autorizado A→B→A. El adaptador mantiene el documento local; eso por sí solo no acredita dinero, stock ni outbox comerciales. PWA/Workbox siguen aplazados por orden vigente.
