# Candidata ensamblada local v783: estado y reproducción

Base exacta: `f6276adac490f0610e130afec0615f98acd4b32b`. Esta carpeta es un paquete local sobre la copia privada existente. No es un commit publicado, un despliegue ni una aceptación de clientes. El SHA-256 del parche está en provenance.json. No aplicar sobre v781, ni sobre un árbol con trabajo ajeno. `app/` es una extracción aislada; no tiene su propio .git.

## Contenido y orden

`candidate.patch` contiene fuentes propias de integración, tests, activos generados y cambios sobre la base exacta. `imported-sources.tar.gz` conserva los fuentes congelados de Dinero.js y Workbox con sus licencias; extraer en la raíz de la copia aislada antes de reconstruir los bundles. Validar primero con `tar -tzf` y `git apply --check`. No sustituir los fuentes por dependencias flotantes ni editar los minificados.

El candidato original ya tenía y-partyserver/y-indexeddb. Se le añadió Dinero.js BigInt para el porcentaje de comisión de ventas nuevas, Workbox para el registro del SW, adaptador de principal Owner, autoridad Team, API dormant y conexión a la transacción local Team. Los flags siguen apagados por defecto. No se ha reemplazado todo el precache por Workbox ni todo el reparto monetario por Dinero. Las diferencias de centavos y el reparto de asistentes requieren su propia aceptación antes de ampliar.

## Autoridad Team implementada

El servidor consume la autoridad Owner ya existente. Un rol o una sesión enviados por navegador no bastan para autorizar. Las mutaciones Team comprueban el vínculo licencia/instancia y la revisión Owner en la misma transacción del registro de licencias. Conservan admin, empleado, contador y artista, sin elevar admin a Owner. Demo/soporte no se registran como usuarios reales. No se cambió la longitud ni el valor de PINs de clientes.

HMAC usa WebCrypto con un pepper Team distinto. Solo se guardan digests vinculados a licencia/miembro, roles, revisiones y comprobantes de operación; el PIN de miembro no se copia a otro almacén. El endpoint verifica el PIN existente enviado mediante HTTPS. El almacenamiento local de credenciales existente en crypto-store no se rediseñó en esta fase. Nada de ello equivale a tickets WebSocket.

Las revisiones CAS evitan sobrescribir silenciosamente cambios de otro dispositivo. Un mismo opId y contenido vuelve como already-applied; el mismo opId con contenido distinto se rechaza. Los intentos erróneos se limitan para miembros existentes; sujetos desconocidos no generan registros ilimitados de intentos. La baja conserva el registro y revoca su verificación. El principal es un objeto comprobable solo en el contexto servidor que lo creó; su JSON no es una capacidad transferible.

## Continuidad local y dos carreras corregidas

El alta local guarda `_teamAuthorityIntent` dentro del mismo snapshot durable Team. Contiene opId, origen, revisión y metadatos, sin otra copia del PIN. La lista explícita del catálogo compartido excluye ese campo. Una caída remota mantiene la operación pendiente y no revierte el guardado local legítimo. El cliente envía de forma secuencial, con abort y el mismo opId; un conflicto conserva su CAS original. No hay rebase silencioso ni bucle periódico de sondeo.

La revisión independiente reprodujo una respuesta HTTP tardía sobre un miembro cuyo rol/PIN había cambiado por merge. Se añadió primero el test rojo y después una comprobación del origen completo antes del ACK. Una segunda revisión reprodujo una ventana durante la espera de IndexedDB. Se conserva ahora el comprobante local de ACK, en lugar de borrar el testigo: se oculta de pendientes únicamente mientras su revisión/rol/estado coinciden con la fila. Si llega un merge diferente, sigue existiendo el testigo y vuelve a pendiente. Al terminar el guardado se revalida también la fuente capturada, incluido el PIN en memoria. El PIN no se persiste en este comprobante. Un origen cambiado necesita reconciliación explícita; no se declara éxito remoto de otra versión del miembro.

## Activación: ninguna realizada

Servidor: TEAM_AUTHORITY_QA, TEAM_AUTHORITY_LICENSE y TEAM_PIN_PEPPER, además del PIN_PEPPER Owner existente. No se guardó ni configuró ningún valor real. El código rechaza ausencia/reuso de secreto y licencia fuera del piloto. Cliente: f123_team_authority_qa=1, solo contexto Owner con licencia/instancia coherentes. Los otros flags son f123_dinero_qa y f123_workbox_qa.

El uso del PIN Owner local solamente permite intentar la petición; el servidor realiza su propia verificación. No es una autorización derivada de OCAuth. El alta Team no debe confundirse con entrada remota a documentos Yjs. Aún faltan issuer firmado, scopes, recepción protegida, revocación de sockets y frontera comercial de comandos. No activar el piloto de roles remotamente hasta integrar y validar esos puntos.

## Evidencia final

Logs originales en `/workspace/work/assembled-candidate/`:

- `team-final-core.log`: 71 casos, 0 fallos, 0 omitidos. Cubre autoridad Owner/Team, API, intentos, CAS, revocación, metadatos locales, dinero y contratos adyacentes Team.
- `team-final-browser.log`: 3 casos Chromium, 0 fallos: venta sintética con comisión importada, Team con 503/recarga/reintento y registro Workbox.
- `team-receipt-reload-browser.log`: comprobante confirmado sobrevive otra recarga real IndexedDB; merge posterior vuelve a pendiente sin nueva autorización remota.
- `team-ack-race-red.log`, `team-ack-save-red.log`: dos reproducciones rojas válidas; no fallos de infraestructura.
- `team-ack-save-green.log`: ambas carreras y contratos client/local pasan.
- `team-api-body-red.log`/`team-api-body-green.log`: límite real del cuerpo HTTP por bytes, cancelación temprana y fallo de stream tratado como rechazo.
- `team-build-check.log` y `team-shell-check.log`: fuentes/activos coherentes, manifiesto regenerado, sintaxis y shell v783/golden319.

Los comandos finales de núcleo usan `node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=45000` con los archivos de autoridad/importación/Team enumerados en el log. Las pruebas Chromium usan además `PLAYWRIGHT_BROWSERS_PATH=/workspace/work/playwright-browsers`. La primera llamada Chromium sin ese entorno falló por ejecutable ausente; se preparó el navegador mediante el script oficial del repo, y la ejecución final pasó. Este fallo no se ocultó ni se contó como RED del producto.

La prueba Team usa aplicación real local y módulos reales de API/criptografía, pero el Durable Object es un arnés transaccional en memoria. La identidad Owner en navegador es sintética. No prueba Cloudflare remoto, login físico, dos personas reales, WebKit/Firefox, iPhone, cuotas reales ni recuperación entre regiones. No existen scripts globales lint/typecheck configurados: check-sw comprueba sintaxis JavaScript; no equivale a tsc global.

## Próximo trabajo autorizado

Conectar esta fuente real Team al issuer del plan privado `docs/superpowers/plans/2026-11-15-friendly-123-role-ws-issuer.md`, sin firmar metadatos de navegador. Conservar secreto WS separado, revisión y TTL, validación antes de enviar bytes, y ninguna autorización de escritura genérica de dinero. Luego probar failback con el mismo opId, sin dobles escritores ni purgar outbox/store/fotos. La aceptación física y el GO de JFC siguen siendo pasos distintos de una prueba local. No introducir la puerta eliminada de 33 minutos.

Revisión independiente final: ambas carreras corregidas y verificadas por separado; nueve casos client/local pasan. No se encontró otro defecto crítico/importante en este fix revisado.
