# Auditoría Preventiva de 40 Bugs Conocidos y Bombas de Tiempo (`B01`–`B40` · Horizontes: 3 Días, 1 Semana y 2–5 Años)

**Autor:** Google Gemini (análisis forense sobre `origin/master` `v0.9.01`/`v0.9.02`, `auditoria-150` PRs #895–#1077, `cloudflare-yparty-worker/`, `cloudflare-worker/`, `cloudflare-relay-worker/`, `src/port2-*` y worktrees abiertos)
**Objetivo:** Evitar que `friendly-123` falle a los **3 días** (sesiones, red móvil, Safari iOS), a la **semana/mes** (multi-cajero, comisiones, fotos, cuotas) o a los **2–5 años** (bloat Yjs/CRDT, tope de `localStorage` 5 MB, límites duros `MAX_ITEMS`/`MAX_EVENTS`/`MAX_FACTS` en Workers, acumulación de nonces en DO y deriva de configuración en deploys).
**Regla Scope Lock (`WIP = 1`):** No mezclar con `C224` (`v0.9.02`) en curso. Ejecutar en PRs quirúrgicas por horizonte una vez certificado `v0.9.02`.

---

## Horizonte 1 · Corto Plazo (0 a 3 Días: Sesiones, Red Móvil LatAm, Safari iOS y Arranque) — `B01` a `B10`

1. **`B01` — `unexpired(conexion.state?.accesoFirmado)` usa el TTL de 30 s del ticket one-use como duración del WebSocket (`cloudflare-yparty-worker/src/ws-authority-client.js:50` + `index.js:77,199`):**
   - *Causa:* `/ws/ticket` emite tickets de admisión con `ttlMs = 30_000` (máx 60 s). `Tienda` guarda ese objeto en `conexion.state.accesoFirmado` y en cada mensaje o `comprobarConexiones()` evalúa `unexpired(accesoFirmado)` (`principal.exp > Date.now()`). Pasados 30 s, cualquier mensaje o conexión nueva en la sala cierra el socket con `1008 Acceso no autorizado`, disparando `authorization-error` → `volverAlRelay()`.
   - *Fix quirúrgico:* Al consumir el ticket one-use en `onConnect`, sellar en `conexion.state.accesoFirmado` un `leaseExp = Date.now() + 15 * 60_000` (revalidando `roleRevision` en `comprobarConexiones()`), separando el TTL del ticket de admisión (30 s) de la vida del socket ya admitido.
2. **`B02` — Falta de tolerancia de clock-skew en `p.iat <= Date.now()` (`cloudflare-yparty-worker/src/ws-authority-client.js:39` y `cloudflare-worker/ws-capability-issuer.mjs:84`):**
   - *Causa:* Si el reloj del isolate del servidor 2.0 va unos milisegundos detrás del isolate de `friendly123-licencias`, `p.iat > now` rechaza un ticket recién emitido.
   - *Fix quirúrgico:* Permitir `p.iat <= now + 30_000` (30 s de tolerancia de reloj).
3. **`B03` — Plazo de reconexión fijo (`7500 ms`) en redes 3G/ferias con RTT alto (`src/yparty-piloto.js:15`):**
   - *Causa:* En señal móvil débil, el ticket + upgrade WS + sync inicial de `-cat` puede superar `7.5 s` en el primer intento frío y caer a respaldo sin necesidad.
   - *Fix quirúrgico:* Usar `12_000 ms` en la primera conexión fría tras `oc-login` sin bloquear el pintado inmediato desde IndexedDB.
4. **`B04` — Peso de arranque JS en `68.07 %` antes del PIN (`docs/index.html`, PRs #1040, #1042, `auditoria-150` #918/#1035):**
   - *Causa:* Parsear `~3.5 MB` de JS antes del candado de PIN aumenta la presión de memoria en Safari iOS.
   - *Fix quirúrgico:* Aplicar los Parches `04` y `05` ya probados en el workshop (`carga-tardia.js` + `i18n-es.js` bajo demanda), que bajan el JS de arranque a **`30.32 %` (`≤ 40 %`)** con los 163 archivos cacheados en el Service Worker.
5. **`B05` — Repintados del DOM bajo la cortina del PIN (`docs/sync-yjs.js` + `docs/index.html`, PRs #1035, #1036, `wt-corte20` C197):**
   - *Causa:* Cuando llega hidratación de Yjs mientras `#oc-auth-overlay` está cerrado, disparar `oc-sync-merge` repinta tarjetas detrás del candado y retrasa los toques del teclado de PIN.
   - *Fix quirúrgico:* Si el candado está activo, coalescer `oc-sync-merge` en una bandera `_pendienteRepintarTrasPin = true` y ejecutar un único repintado al recibir `oc-login`.
6. **`B06` — Race condition de `skipWaiting()` en Service Worker durante sesión activa en Safari (`docs/sw.js`, PRs #901, #903, #1023–#1025):**
   - *Causa:* Cambiar el controlador del SW a mitad de una venta en Safari iOS puede desincronizar assets entre generaciones de shell.
   - *Fix quirúrgico:* Verificar que las 141 entradas de `SHELL` respondan HTTP `200` antes de completar `install` y aplicar el cambio de shell en la pantalla de PIN o bajo acción explícita.
7. **`B07` — Desfase de fecha/mes cerca de medianoche (`19:00–23:59` Ecuador = día siguiente en UTC, PR #1007):**
   - *Causa:* Comparar `new Date().toISOString().slice(0, 10)` (UTC) en lugar de la fecha civil local mueve las ventas de las 7 pm–12 am de Ecuador al día/mes siguiente.
   - *Fix quirúrgico:* Unificar toda agrupación de día/mes en Hoy, Ventas y Commissions con un helper `fechaLocalYYYYMMDD(date)` en hora local del dispositivo/tienda.
8. **`B08` — Colisión de intención de cobro (`pago-intento-idb.mjs`) entre dos pestañas abiertas del mismo navegador (PRs #940, #946):**
   - *Causa:* Dos pestañas abiertas simultáneamente comparten la misma base IndexedDB de intenciones de pago.
   - *Fix quirúrgico:* Aislar cada intento en vuelo con un `tabId` efímero de `sessionStorage` + `opId` único por operación.
9. **`B09` — Cierre silencioso de conexiones IndexedDB por WebKit al suspender la PWA en iOS (PRs #955, #959, #963, #976–#980):**
   - *Causa:* Safari iOS invalida handles de IDB al suspender la app sin disparar `onclose`; la siguiente transacción lanza `InvalidStateError`.
   - *Fix quirúrgico:* En `pageshow` y `visibilitychange` (`!document.hidden`), capturar `InvalidStateError` en los almacenes IDB (`idb-fotos`, `port2-typed-ops-idb-store`, `y-indexeddb`) y reabrir el handle de forma transparente antes de reintentar.
10. **`B10` — Píldora `"Sync pending"` heredada al cambiar de licencia en el mismo navegador (`docs/help-ui.js` + `docs/sync-yjs.js`, PRs #1039, #1041, #1042):**
    - *Causa:* Si `recibosComerciales20` conserva entradas de una licencia anterior, `sync4Pend` puede evaluarse a `true`.
    - *Fix quirúrgico:* Limpiar `API.recibosComerciales20.clear()` al cambiar de licencia activa y filtrar solo recibos de la licencia actual.

---

## Horizonte 2 · Mediano Plazo (1 Semana a 1 Mes: Multi-Cajero, Comisiones, Fotos y Cuotas) — `B11` a `B25`

11. **`B11` — Checkpoints comprimidos (`tag 7` gzip) restringidos solo a Firebase (`docs/sync-yjs.js:879`, `v765`):**
    - *Causa:* El comentario `v765` descarta checkpoints comprimidos `soloFb` cuando la capa activa no es Firebase.
    - *Fix quirúrgico:* Permitir checkpoints comprimidos `tag 7` también cuando `ws.relayLayer === "f123_relay_cupo_cf_v1"` (`cf-relay.js`), reduciendo 4× el tráfico y almacenamiento en el Durable Object `RelayPrivado`.
12. **`B12` — Consumo de cuota por fotos de alta resolución en respaldo (`docs/sync-yjs.js` + `wt-miniaturas` C204):**
    - *Causa:* Si una tienda con cientos de fotos cae temporalmente a respaldo, las fotos de `1600px` agotan rápido la mitad de cuota reservada a fotos (`CAP_FOTO_DOWN = 10 MiB`).
    - *Fix quirúrgico:* Mantener siempre el canal 2.0 HTTP por SHA-256 (`-fotos` en `Tienda` DO) activo para todas las tiendas en `SALAS_PILOTO` y servir miniaturas ligeras en catálogo.
13. **`B13` — Coste cuadrático $O(V \times P)$ al abrir Commissions con miles de ventas (`docs/commissions-by-person.js`, PRs #965–#974, #997–#1014, #1034):**
    - *Causa:* Recorrer todas las ventas por cada promotora y grupo en el hilo principal degrada el renderizado al final del mes.
    - *Fix quirúrgico:* Agrupar las ventas del período en un `Map<promotoraId, Venta[]>` en una sola pasada $O(V)$ antes de renderizar las tarjetas.
14. **`B14` — Limpieza prematura del carrito antes de confirmar el recibo local de venta (`docs/mock-backend.js`, PRs #970, #971):**
    - *Causa:* Si un error inesperado interrumpe el flujo antes de sellar el recibo, el cajero perdería la selección del carrito.
    - *Fix quirúrgico:* Vaciar el carrito únicamente tras verificar que `venta.id` y `venta.opId` quedaron persistidos en el store local.
15. **`B15` — Cobro 2.0 (`ops:payment`) sobre un fiado creado antes de activar 2.0 (`cloudflare-yparty-worker/src/index.js:291`):**
    - *Causa:* `authorizeReceivable` consulta `SELECT 1 FROM f123_business_receivables WHERE license = ? AND receivable_id = ?`; si el fiado nació en Sync3 antes del corte 2.0, no está en esa tabla SQL y el Worker devuelve `503`.
    - *Fix quirúrgico:* Si el `receivable_id` existe en el cuaderno local pero no en SQL 2.0, enrutar ese abono automáticamente por el buzón cifrado (`cf-relay.js` / `API.doc`) sin tumbar `modoCorte20Activo` para ventas nuevas.
16. **`B16` — Apagado temporal de `modoCorte20Activo` al registrar un gasto o cliente (`docs/sync-yjs.js:3706`, C196):**
    - *Causa:* `publicarOpLocal` hace `failbackToLegacy("unmapped-typed-command")` cuando la operación es un gasto, transferencia o cliente, desactivando 2.0 por 15 s.
    - *Fix quirúrgico:* Con `cf-relay.js` (`C224`) activo, gastos, clientes, comisiones y transferencias ya sincronizan cifrados por `API.doc` en Capa 0; permitir que se publiquen al canal cifrado sin desarmar el coordinador 2.0 de ventas/stock.
17. **`B17` — Caché local de rol desactualizada cuando un empleado asciende a `admin` en el panel con el mismo PIN (`docs/auth-ui.js`):**
    - *Causa:* Si `rolHash` local seguía diciendo `"empleado"`, un corte de red posterior abriría como empleado en vez de admin.
    - *Fix quirúrgico:* Al recibir `dTeam.ok === true` de `/team/verify`, actualizar inmediatamente el rol local asociado a ese hash con `dTeam.principal.role`.
18. **`B18` — Expiración a los 15 minutos (`PROPOSAL_TTL`) de un cambio de PIN preparado en el panel (`cloudflare-worker/pin-authority.mjs:7`):**
    - *Causa:* Si el operador deja abierta la pestaña del panel > 15 min entre staging y activación, recibe `409 expired-proposal`.
    - *Fix quirúrgico:* En `panel-pin.js`, si `master-activate` devuelve `409 expired-proposal`, re-ejecutar `master-set` + `master-activate` automáticamente con la revisión actual.
19. **`B19` — Dependencia de Supabase Realtime en `dashboard.html` (`docs/dashboard-broadcast.js`, PR #926):**
    - *Causa:* Si Supabase Realtime falla o se pausa, el Dashboard abierto en otra red no recibe el snapshot efímero.
    - *Fix quirúrgico:* Añadir lectura cifrada de respaldo desde `friendly123-relay-privado` (`cf-relay.js`) en `dashboard.html`.
20. **`B20` — Acumulación de objetos `RTCPeerConnection` cerrados a medias tras cambios Wi-Fi ↔ 4G (`docs/peer-sync.js`):**
    - *Causa:* Los navegadores limitan el número total de `RTCPeerConnection` vivas por pestaña; si no se invoca `pc.close()` al pasar a `failed`/`closed`, dejan de abrirse canales nuevos tras horas de uso móvil.
    - *Fix quirúrgico:* Limpiar listeners y llamar a `pc.close()` inmediatamente en `connectionstatechange === "failed" | "closed"` y tras `8 s` en `"disconnected"`.
21. **`B21` — Serialización completa del catálogo al ajustar 1 unidad de stock en Perchas (`docs/mock-backend.js`, PRs #918, #919):**
    - *Causa:* Recorrer todos los productos en cada toque `+`/`-` de percha causa latencia en tiendas grandes.
    - *Fix quirúrgico:* Mantener siempre el fast-path incremental por `productoId` tanto al sembrar en Yjs como al persistir.
22. **`B22` — Límite de `64` conexiones en `askAuthorityBatch` (`cloudflare-yparty-worker/src/ws-authority-client.js:44` + `index.js:79`):**
    - *Causa:* Si una sala acumula > 64 sockets (incluyendo sockets zombie antes del timeout TCP), `askAuthorityBatch` devuelve `null` y `comprobarConexiones()` cierra todos los sockets de la sala con `1008`.
    - *Fix quirúrgico:* Dividir `active` en lotes de `50` conexiones dentro de `comprobarConexiones()` antes de llamar a `askAuthorityBatch`.
23. **`B23` — Sockets fantasma tras hibernación del Durable Object `Tienda` (`cloudflare-yparty-worker/src/index.js:166`, PR #1011 C87):**
    - *Causa:* Un teléfono que pierde señal abruptamente deja su socket anterior en `this.getConnections()` cuando reconecta.
    - *Fix quirúrgico:* En `onConnect`, cerrar con `1000` cualquier conexión previa que tenga el mismo `instanceId` y `room` antes de aceptar la nueva.
24. **`B24` — Consumo innecesario de `localStorage` por `f123_sync_log` legacy (`docs/sync-realtime.js:12`):**
    - *Causa:* `f123_sync_log` guarda hasta `1.000` operaciones del sync viejo (~400 KB en `localStorage`).
    - *Fix quirúrgico:* Cuando la tienda ya opera en Sync4 (`modoCorte20Activo === true` y `colaLargo() === 0`), recortar `f123_sync_log` a las últimas `50` entradas.
25. **`B25` — Escrituras KV frecuentes por telemetría `sonar:` y `canario:` en `friendly123-licencias` (`cloudflare-worker/worker.js:1032,1038`):**
    - *Causa:* Escribir en Cloudflare KV en cada evento de canario/sonar de 60 tiendas gasta cuota diaria de `KV.put`.
    - *Fix quirúrgico:* Debouncear en memoria del Worker las escrituras a `sonar:<shell>` y `canario:<shell>` a máximo 1 escritura cada 10 minutos por shell.

---

## Horizonte 3 · Largo Plazo (6 Meses a 5 Años: Degradación Crónica, Bloat CRDT, Topes de Disco y Licencias de 5 Años) — `B26` a `B40`

26. **`B26` — Inflación de tombstones e historial Yjs en `y-indexeddb` tras 1–2 años (`docs/sync-yjs.js:2822`):**
    - *Causa:* Yjs conserva metadatos de cada edición histórica; tras `200.000+` ediciones de stock/precios en 2 años, el documento binario tarda varios segundos en hidratar al abrir la app.
    - *Fix quirúrgico:* Compactación segura periódica (al superar `500` updates en `y-indexeddb` con `pendingStructs === null`): re-instanciar el estado sobre un `Y.Doc({ gc: true })`, verificar igualdad exacta de huella de negocio y guardar el snapshot único compactado.
27. **`B27` — Límite duro `MAX_EVENTS = 25000` en `API.opsMap` y `frozen-ops-baseline.mjs:7` (`cloudflare-yparty-worker/src/frozen-ops-baseline.mjs:46`):**
    - *Causa:* Una tienda que vende 35 artículos diarios alcanza `25.000` eventos en ~2 años; al llegar a `25.001`, `frozen-ops-baseline.mjs` y `merge-frozen-into-existing.mjs:108` lanzan `refuse('too many events')`.
    - *Fix quirúrgico:* Archivar por cierre trimestral/anual los eventos de `opsMap` y `actividad` con `> 180 días` que ya están consolidados en el balance sellado, manteniendo `opsMap` vivo siempre por debajo de `10.000` eventos.
28. **`B28` — Límite duro `MAX_ITEMS = 10000` en proyección de catálogo público (`cloudflare-yparty-worker/src/catalog-safe-projection.mjs:8,77`):**
    - *Causa:* Como el catálogo es add-only (los productos borrados quedan como lápidas `eliminado: true`), en 2–5 años una tienda con alta rotación de modelos puede superar `10.000` entradas sumando activos + lápidas, disparando `RangeError('too many productos; limit 10000')`.
    - *Fix quirúrgico:* No incluir en la proyección pública `-cat` las lápidas (`eliminado === true`) con más de `90 días` de antigüedad, o subir el techo a `50.000`.
29. **`B29` — Límites duros `MAX_FACTS = 20000` y `MAX_SOURCES = 24` en `current-state-union.mjs:11`:**
    - *Causa:* A lo largo de 5 años de licencia, una tienda superará `20.000` hechos financieros y puede haber reemplazado/usado más de `24` celulares o navegadores (`MAX_SOURCES = 24`), bloqueando futuras uniones de estado.
    - *Fix quirúrgico:* Subir `MAX_SOURCES` a `128` y compactar `hechos_financieros` cerrados de años anteriores en un asiento de apertura anual sellado con SHA-256.
30. **`B30` — Techo de `5 MB` de `localStorage` para el estado JSON de la tienda a los 12–24 meses (`docs/mock-backend.js`):**
    - *Causa:* Todos los navegadores imponen un límite estricto de `~5 MB` por origen en `localStorage`. En 1–2 años de ventas, `ventas` + `actividad` en `localStorage` superarán `5 MB` y lanzarán `QuotaExceededError`.
    - *Fix quirúrgico:* Guardar el historial completo en IndexedDB y mantener en `localStorage` únicamente el catálogo activo, clientes con saldo pendiente, totales contables sellados y los últimos `90 días` de ventas/actividad.
31. **`B31` — Purga de 7 días de IndexedDB en Safari iOS si el usuario no solicitó almacenamiento persistente (`docs/auth-ui.js` / `docs/index.html`):**
    - *Causa:* WebKit puede limpiar IndexedDB en pestañas de Safari no abiertas en 7 días si no tienen permiso `navigator.storage.persist()`.
    - *Fix quirúrgico:* Invocar `navigator.storage.persist()` tras `oc-login`; además, con `friendly123-relay-privado` (`C224`), si iOS limpia el almacenamiento local, el aparato recupera todo su historial cifrado en `< 1 s` desde Cloudflare DO.
32. **`B32` — Respaldo local sellado con SHA-256 (`wt-export` C199 `64344e88`) pendiente de integrar en `master`:**
    - *Causa:* El trabajo de exportación local sellada con SHA-256 quedó en el worktree `wt-export` sin fusionar.
    - *Fix quirúrgico:* Integrar el botón/exportación automática no bloqueante sellada con SHA-256 para que el dueño tenga copia física auditable en su teléfono/PC.
33. **`B33` — Barrido lexicográfico de `limit: 128` en `cleanup()` de tickets en DO `REGISTROS` (`cloudflare-worker/ws-capability-issuer.mjs:36`):**
    - *Causa:* `tx.list({ prefix: 'ws-ticket-v1:', limit: 128 })` ordena por `jti` aleatorio, no por fecha de expiración `exp`; si hay `> 128` tickets vigentes cuando se limpia, los tickets expirados al final del alfabeto tardan en borrarse.
    - *Fix quirúrgico:* Indexar o prefijar por minuto de expiración (`ws-ticket-v1:<expMinuteHex>:<jti>`) para que los primeros 128 registros listados sean siempre los más antiguos.
34. **`B34` — Escrituras KV en `/checkin` por cambio de IP móvil 4G/5G (`cloudflare-worker/worker.js:346`):**
    - *Causa:* En redes celulares, la IP pública cambia varias veces al día; aunque `_sinVolatiles` ya ignora `ip` para el historial, la escritura principal de KV `inst:<id>` se ejecuta en cada check-in.
    - *Fix quirúrgico:* Si `_soloLatido === true` y `Date.now() - Number(registroAnterior.lastSeen || 0) < 6 * 3600_000`, omitir `env.LICENCIAS.put("inst:" + instanceId)` para ahorrar 90 % de escrituras KV en 5 años.
35. **`B35` — Dependencia de URLs de proyectos gratuitos de terceros (Supabase/Firebase) a 2–5 años (`docs/firebase-relay.js`, `docs/vendor/supabase-relay.min.js`):**
    - *Causa:* Los planes gratuitos externos pueden pausarse por inactividad o cambiar políticas en 2 años.
    - *Fix quirúrgico:* Con `friendly123-relay-privado` (Capa 0 en Cloudflare Durable Objects bajo la cuenta propia de JFC), la app opera 100 % sobre infraestructura propia y solo usa Supabase/Firebase como fallbacks B/C opcionales.
36. **`B36` — Variables `WS_*_QA=1` del servidor 2.0 pasadas por CLI en vez de estar fijas en `wrangler.jsonc` (`cloudflare-yparty-worker/wrangler.jsonc`):**
    - *Causa:* Si dentro de 1 año alguien despliega `cloudflare-yparty-worker` sin pasar los 7 `--var WS_*_QA:1`, desactiva las rutas 2.0.
    - *Fix quirúrgico:* Declarar las 7 variables no secretas (`WS_AUTHORITY_QA: "1"`, `WS_SEPARATE_ROOMS_QA: "1"`, `WS_TYPED_COMMANDS_QA: "1"`, `WS_BUSINESS_EXECUTOR_QA: "1"`, `WS_PHOTO_BLOBS_QA: "1"`, `WS_OPEN_EXISTING_QA: "1"`, `WS_ABRIR_SIN_HISTORIA: "1"`) dentro de `"vars"` en `cloudflare-yparty-worker/wrangler.jsonc`.
37. **`B37` — Hash SHA-256 manual de `yparty-piloto.min.js` hardcoded en `.github/workflows/qa-port2-v785-shell-seal.yml:55`:**
    - *Causa:* Cada cambio legítimo en `src/yparty-piloto.js` rompe ese workflow si no se actualiza a mano la constante hex en el YAML.
    - *Fix quirúrgico:* Verificar en el workflow que `sha256(docs/vendor/yparty-piloto.min.js)` coincida con `docs/version-manifest.json` y con la compilación reproducible de `scripts/build-yparty-piloto.cjs`.
38. **`B38` — Ruido y gasto de minutos CI por workflows legacy de Sync3 (`v670` con 30+ corridas rojas):**
    - *Causa:* Workflows históricos de pruebas experimentales de Sync3 corren en cada push a `master`.
    - *Fix quirúrgico:* Cambiar los workflows históricos de Sync3 a `on: workflow_dispatch` y dejar en `push`/`pull_request` solo las 7 compuertas obligatorias de release + `p0-c224-cf-relay-privado`.
39. **`B39` — Garantía de Lectura y Exportación Incondicional al Vencer los 5 Años de Licencia (`docs/auth-ui.js` + `docs/mock-backend.js`):**
    - *Causa:* Al cumplirse los 5 años de una licencia comercial (o los 30 días de prueba), el cliente jamás debe sentir sus datos secuestrados.
    - *Fix quirúrgico:* Mantener siempre habilitados en modo solo-lectura la visualización de inventario/contabilidad y el botón de exportar copia completa cuando la licencia esté vencida.
40. **`B40` — Limpieza garantizada de todas las generaciones históricas `f123-shell-*` en `CacheStorage` a lo largo de cientos de releases (`docs/sw.js`):**
    - *Causa:* En 2–5 años habrá cientos de actualizaciones de shell (`golden438` → `golden900`); cualquier caché huérfana consume `~6 MB` en el teléfono.
    - *Fix quirúrgico:* En el evento `activate` de `docs/sw.js`, borrar toda caché cuyo nombre no sea exactamente la constante `CACHE_ACTUAL` vigente.
