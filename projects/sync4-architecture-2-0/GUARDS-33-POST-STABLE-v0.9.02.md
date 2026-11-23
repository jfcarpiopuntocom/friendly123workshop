# 33 Recomendaciones de Guards y Failbacks Post-Stable (`v0.9.02+`)

**Autor:** Google Gemini (bajo reglas Ponytail full, Durable Objects, Workers Best Practices y Security & Hardening)
**Regla de ejecución para Codex / Sol6:** **NO interrumpir `C224` (`v0.9.02`) en curso (`WIP = 1`).** Aplicar estos 33 refuerzos en lotes quirúrgicos cerrados **después** de publicar y verificar `v0.9.02`, con prueba rojo→verde por lote y cero borrado de datos locales.

---

## Bloque I (G01–G06) · Guards del Buzón Cifrado Cloudflare 2.0 (`docs/cf-relay.js` + `cloudflare-relay-worker/`)

1. **G01 — Guard Anti-Checkpoint Vacío en Aparato Nuevo (`docs/cf-relay.js` + `docs/sync-yjs.js`):**
   - *Riesgo:* Un aparato recién abierto con IndexedDB vacía podría intentar subir un `ckpt` vacío antes de terminar su primer `pull`.
   - *Guard:* Bloquear cualquier `POST /ckpt` hacia `f123_relay_cupo_cf_v1` mientras `canal.recuperando === true` o hasta haber recibido al menos un `pull-page` con `more: false` (o tener datos locales no vacíos verificados).
2. **G02 — Compactación Automática `N-2` en SQLite del Durable Object (`cloudflare-relay-worker/src/priv-relay-core.mjs`):**
   - *Riesgo:* Acumular cientos de checkpoints históricos de `1–2 MiB` a lo largo de los 5 años de licencia podría acercar una tienda grande al tope de `64 MiB`.
   - *Guard/Failback:* Dentro de `putCkpt()`, tras confirmar `nextRev >= 3` y `await storage.sync()`, podar únicamente `relay_ckpt_blocks` y `relay_ckpt_meta` con `rev <= nextRev - 2` (conservando siempre las 2 últimas revisiones completas y todas las `relay_ops` posteriores al `seq` del checkpoint `nextRev - 1`) y recalcular `total_bytes` exacto con `SUM(bytes)`.
3. **G03 — Tolerancia de Desfase de Reloj (`±60 s`) en Token de Sesión HMAC (`cloudflare-relay-worker/src/priv-relay-core.mjs`):**
   - *Riesgo:* Un desfase de milisegundos entre isolates de Cloudflare al emitir y validar `iat` podría provocar un `401` falso.
   - *Guard:* En `verifySessionToken()`, aceptar `now + 60_000 >= p.iat && now < p.exp`.
4. **G04 — Backoff con Jitter en `429` de `/ws/ticket` y `/session` (`docs/cf-relay.js`):**
   - *Riesgo:* Si un usuario recarga 30 veces seguidas y alcanza el tope de `32 tickets/min` en `friendly123-licencias`, reintentar sin pausa prolonga el `429`.
   - *Failback:* Si `/ws/ticket` o `/session` devuelve `429`, respetar `Retry-After` (mínimo `5 s` + jitter aleatorio `0..1500 ms`) y ceder lectura inmediata a Capa 1 (Supabase) / Capa 2 (Firebase) sin bloquear la UI.
5. **G05 — Reuso de Token de Sesión en Memoria entre Pestañas del Mismo Origen (`docs/cf-relay.js`):**
   - *Riesgo:* Abrir 3 pestañas de la tienda en la misma PC consumía 3 tickets `/ws/ticket`.
   - *Guard:* Compartir el token HMAC en memoria entre pestañas vía `BroadcastChannel("f123-cf-sess-" + room)` (jamás en `localStorage`), invalidándolo instantáneamente en todas las pestañas al recibir `oc-logout`.
6. **G06 — Failback Automático ante `507 Store Quota Exceeded` (`docs/cf-relay.js` + `docs/relay-selector.js`):**
   - *Riesgo:* Si una tienda excepcionalmente grande llena su buzón DO (`507`), el cliente no debe perder la operación ni quedarse reintentando en bucle.
   - *Failback:* Al recibir `507`, cerrar el socket virtual de `cf-relay` con código `1013` para que `relay-selector.js` pase de inmediato a Capa 1 (Supabase) / Capa 2 (Firebase), conservando intacto el `_outbox.pending` local y emitiendo canario fijo `cf-relay-cupo-lleno` (cero PII).

---

## Bloque II (G07–G12) · Failbacks de la Cascada Multicapa y Retorno Automático a 2.0 (`docs/relay-selector.js` + `docs/sync-yjs.js` + `src/port2-*`)

7. **G07 — Sonda Multicapa en Frío (`capaVaciaSigue` para 3 Capas en `docs/relay-selector.js`):**
   - *Riesgo:* Cuando una de las 60 tiendas cliente entra por primera vez a `v0.9.02` desde un aparato nuevo antes de que el aparato viejo haya subido su checkpoint a Cloudflare (`rev: 0, seq: 0`), `capaVaciaSigue` debe consultar tanto Supabase como Firebase.
   - *Failback:* Si Capa 0 (`cf-relay`) devuelve `rev === 0 && seq === 0`, pausar Capa 0 solo por `OTRA_CAPA_LEER_MS` (`3 min`, no `15 min`) cuando Firebase o Supabase tengan `rev > 0 || seq > 0`, hidratar desde la capa con historia y regresar a Capa 0 al terminar.
8. **G08 — Auto-Siembra (Re-Seed) de Capa 0 tras Recuperación desde Capa 1/2 (`docs/relay-selector.js` + `docs/sync-yjs.js`):**
   - *Riesgo:* Si un aparato nuevo se hidrató desde Firebase porque el aparato viejo estaba apagado, el buzón Cloudflare seguiría vacío para el tercer aparato.
   - *Failback:* Cuando `ws.markRecovered()` confirma que el pull cifrado desde Firebase/Supabase terminó sin `pendingStructs`, limpiar la marca de checkpoint de `f123_relay_cupo_cf_v1` y disparar `checkpointTrasPull` al reconectar a Capa 0 para dejar el buzón Cloudflare sembrado automáticamente.
9. **G09 — Listener `online`/`offline` en el Indicador del Encabezado bajo Sync4 (`docs/help-ui.js`):**
   - *Riesgo:* Con Sync3 pausado por Sync4 (`OCSyncControl.estado() === "apagado"`), cortar el Wi-Fi no disparaba `OCSyncControl.onEstado`, dejando la píldora blanca hasta el siguiente recibo.
   - *Guard:* Suscribir `window.addEventListener("online", function () { pintarMini(); })` y `window.addEventListener("offline", function () { pintarMini(); })` en `docs/help-ui.js`.
10. **G10 — Coalescencia (`400 ms`) en `_intentarActivarCorte20SiElegible` (`docs/sync-yjs.js`):**
    - *Riesgo:* Al desbloquear el PIN o volver de segundo plano en iOS se disparan casi al mismo milisegundo `oc-login`, `visibilitychange` y `online`.
    - *Guard:* Debounce de `400 ms` y candado de promesa única para evitar peticiones duplicadas de certificados `-cat` y tickets `/ws/ticket`.
11. **G11 — Cerca Estricta contra HTTP `202` sin Persistencia Probada (`src/port2-typed-ops-client.mjs`):**
    - *Riesgo:* Un `202` (`stage: "stored-for-application"`) solo indica encolado, no ejecución contable en SQL.
    - *Guard:* Jamás marcar `committed: true` con `202`; mantener la operación en `port2-typed-ops-idb-store.mjs` con `reconcileRequired: true` hasta confirmar recibo `business-committed` (`200`/`201`) o activar failback seguro.
12. **G12 — Barrera FIFO Estricta en Reconciliación Parcial (`src/port2-typed-ops-reconciler.mjs`):**
    - *Riesgo:* Si hay 5 operaciones encoladas offline y la #2 recibe `503`/`429`, despachar la #3 (por ejemplo, un abono sobre una venta fiada aún no confirmada) rompería el orden causal.
    - *Guard:* Detener el bucle de `drainLatchedSameDo()` en el primer error transitorio (`429`/`5xx`/red) preservando el orden FIFO exacto.

---

## Bloque III (G13–G18) · Guards de Identidad, PIN Central y Revocación de Equipo (`docs/auth-ui.js` + `cloudflare-worker/`)

13. **G13 — Desarme Síncrono al Cambiar de Rol sin Recargar (`docs/sync-yjs.js` + `docs/auth-ui.js`):**
    - *Riesgo:* Si un dueño cambia a sesión de empleado en el mismo aparato, ningún cliente con permisos de escritura de dueño (`-cat` PUT o sesión `dueno` en `cf-relay`) puede sobrevivir ni un milisegundo.
    - *Guard:* Llamar a `F123CloudflareRelay.clearSessions()` tanto en `oc-logout` como al inicio de `oc-login` cuando `rol` cambia respecto al rol anterior.
14. **G14 — Bloqueo Limpio ante Revocación Central de PIN de Equipo en Caliente (`docs/cf-relay.js` + `docs/auth-ui.js`):**
    - *Riesgo:* Si JFC revoca o rota el PIN de un empleado en el panel mientras el teléfono del empleado tiene la app abierta, el siguiente `/ws/ticket` devuelve `403`.
    - *Guard/Failback:* Si `/ws/ticket` responde `403` con `reason: "authority-changed"` o `"team-not-verified"`, limpiar `window.__f123CentralTeamPrincipal = null`, limpiar `OCSecure` en memoria y pedir el nuevo PIN en pantalla **sin borrar un solo dato local**.
15. **G15 — Ventana Offline para PIN Ya Verificado + Revalidación al Reconectar (`docs/auth-ui.js`):**
    - *Riesgo:* En una feria sin señal (`navigator.onLine === false`), el vendedor necesita desbloquear con el PIN ya conocido localmente, pero al volver la señal debe respetarse cualquier rotación hecha en el panel.
    - *Failback:* Si `navigator.onLine === false`, permitir desbloqueo con el hash local ya sellado y programar una verificación silenciosa contra `/pin/verify` o `/team/verify` a los `5 s` del evento `online`.
16. **G16 — Guard de Instancia `bloqueada` en `verify-unmatched` (`cloudflare-worker/pin-worker-api.mjs`):**
    - *Riesgo:* Un aparato previamente marcado como `estado: "bloqueada"` no debe reactivarse por la ruta `verify-unmatched`.
    - *Guard:* En `pin-worker-api.mjs` (Parche 08), el `if (!prev)` dentro de `storage.transaction` ya impide sobrescribir un registro existente; añadir además rechazo explícito `403 instance-blocked` si `prev && String(prev.estado).toLowerCase() === "bloqueada"`.
17. **G17 — Aislamiento de Rate-Limit entre Bucket de Equipo y PIN de Dueño (`cloudflare-worker/team-worker-api.mjs` + `pin-worker-api.mjs`):**
    - *Riesgo:* Diez intentos fallidos de un empleado distraído en `/team/verify` jamás deben bloquear el PIN central `5-5-5` del dueño en `/pin/verify`.
    - *Guard:* Verificar y mantener prefijos de rate-limit completamente disjuntos (`team-rate:` vs `pin-owner:`) en el Durable Object `REGISTROS`.
18. **G18 — Prohibición de PIN de Fábrica (`789` / `456`) tras Sellar Licencia Comercial (`docs/auth-ui.js`):**
    - *Riesgo:* Durante un arranque en frío antes de que cargue `_meta`, un fallback accidental al PIN de fábrica permitiría entrar con `789`.
    - *Guard:* Si `f123_owned.licenseCode` existe y el servidor central ya respondió alguna vez que la licencia tiene PIN central (`f123_pin_central_activo_<lic>`), rechazar `789` y `456` localmente incluso sin red.

---

## Bloque IV (G19–G24) · Integridad Financiera, Centavos Exactos, Ventas, Créditos y Comisiones (`docs/mock-backend.js` + `src/`)

19. **G19 — Guard de Centavos Enteros (`Number.isSafeInteger`) en Ventas, Abonos, Gastos y Comisiones (`docs/mock-backend.js`):**
    - *Riesgo:* Multiplicaciones en coma flotante IEEE-754 (`19.99 * 3 = 59.97000000000001`) pueden desfasar 1 centavo entre el cálculo local y SQL del servidor 2.0.
    - *Guard:* Normalizar todo importe con `Math.round((Number(x) + Number.EPSILON) * 100)` antes de dividir/multiplicar y redondear de vuelta a 2 decimales al persistir en `ventas`, `gastos`, `abonos` y `comisiones`.
20. **G20 — Deduplicación Cruzada `1.0 ↔ 2.0` por `opId` (`docs/sync-yjs.js` + `docs/mock-backend.js`):**
    - *Riesgo:* Si una operación comercial se despachó por 2.0 (`recibosComerciales20`) y también viajó en el checkpoint cifrado de `API.doc` / `API.opsDoc`, aplicarla dos veces duplicaría caja o restaría stock doble.
    - *Guard:* En `procesarEventos()` y `aplicarCatalogo()`, verificar `opId` contra el conjunto durable de `opId` ya aplicados (`_opsProcesadas` + `recibosComerciales20` + IDs de `ventas`/`hechos_financieros` existentes) antes de mutar stock o caja.
21. **G21 — Empate Causal Determinista en `promotoras` / Comisiones (`docs/mock-backend.js`):**
    - *Riesgo:* Dos celulares con el reloj de pared desfasado editando el porcentaje o nombre de una comisionista podrían pisarse si se usa `Date.now()`.
    - *Guard:* En `aplicarCatalogo()`, resolver ediciones de `promotoras` por orden causal Lamport `(rev, deviceId)` y conservar siempre la unión add-only de comisiones generadas por `ventaId`.
22. **G22 — Guard contra Sobre-Abono Concurrente en Fiados/Créditos (`src/credit-payment-command.mjs` + `docs/mock-backend.js`):**
    - *Riesgo:* Dos cajeros cobrando el mismo saldo pendiente de un cliente mientras uno está offline podrían dejar el saldo del cliente en negativo.
    - *Guard:* En `aplicarOpRemota()` para abonos, limitar la reducción de deuda a `Math.min(saldoActualCents, abonoCents)` sin borrar el hecho financiero del cobro recibido (registrando cualquier excedente como saldo a favor / nota auditable).
23. **G23 — Respaldo Síncrono de Emergencia si IndexedDB Falla en Plena Venta (`docs/mock-backend.js`):**
    - *Riesgo:* En iPhone con poco espacio libre, Safari puede rechazar una escritura en IndexedDB justo al pulsar `Confirm Sale`.
    - *Failback:* Si la escritura primaria falla o tarda `> 1200 ms`, volcar el recibo firmado de la venta en `localStorage.setItem("f123_emergencia_ventas_v1", ...)` antes de mostrar el modal negro de confirmación (< 2 s) y drenarlo a IndexedDB / `cf-relay` en el siguiente turno.
24. **G24 — Monotonicidad de Testigos de Stock por Aparato (`_stock_pn_testigos_v1` en `docs/sync-yjs.js`):**
    - *Riesgo:* Un snapshot viejo jamás debe rebajar el contador `PN` (incrementos/decrementos por `deviceId`) de un aparato que ya vendió más unidades.
    - *Guard:* En `incorporarTestigosStock()`, tomar siempre `Math.max(contadorLocal, contadorRemoto)` para cada par `(productoId, deviceId, signo)`.

---

## Bloque V (G25–G29) · Fotos SHA-256, Safari iOS/PWA Storage y Arranque Ligero (`src/port2-photo-sha-client.mjs` + `docs/sw.js` + `docs/carga-tardia.js`)

25. **G25 — Verificación SHA-256 en el Navegador al Descargar Fotos 2.0 (`src/port2-photo-sha-client.mjs`):**
    - *Riesgo:* Un portal cautivo de Wi-Fi de centro comercial que devuelva HTTP `200` con HTML corrupto podría guardarse en `idb-fotos` bajo el hash de una foto.
    - *Guard:* Antes de guardar en `OCFotos`, calcular `crypto.subtle.digest("SHA-256", bytes)` en el cliente y rechazar si no coincide exactamente con el parámetro `sha` de 64 hex.
26. **G26 — Recuperación ante `AbortError` de IndexedDB al Pasar a Segundo Plano en iOS (`docs/sync-yjs.js`):**
    - *Riesgo:* iOS suspende transacciones IndexedDB abiertas cuando el usuario bloquea la pantalla mientras se hidratan fotos.
    - *Failback:* En `volcarFotosAlStore()`, capturar `AbortError`/`InvalidStateError`, mantener ` API.fotosMap` en RAM para que las perchas pinten la foto de inmediato y reintentar la escritura en disco al recibir `visibilitychange` (`!document.hidden`) o `pageshow`.
27. **G27 — Reintento `force-cache` en Carga Tardía Post-PIN (`docs/carga-tardia.js` — Parches 04 y 05):**
    - *Riesgo:* Al activar el arranque ligero (`≤ 40 %` JS inicial), si el usuario pierde señal justo al abrir un modal secundario por primera vez, la inserción del `<script>` debe salir del Service Worker sin fallar.
    - *Failback:* Si la carga de un script diferido falla una vez, reintentar automáticamente tras `150 ms` verificando la caché `f123-shell-v902` del Service Worker antes de rechazar la promesa.
28. **G28 — Cerca de Instalación Atómica del Service Worker (`docs/sw.js`):**
    - *Riesgo:* Si un archivo de `SHELL` (141 archivos) falla al descargarse durante una actualización en red inestable, activar el SW nuevo dejaría la PWA incompleta offline.
    - *Guard:* Verificar `response.ok && response.status === 200` para cada entrada de `SHELL` durante `install`; si una sola falla, abortar la instalación para que el Service Worker anterior (`golden437`/`golden438`) siga sirviendo la app completa sin interrupción.
29. **G29 — Blindaje No Destructivo de `reenganchar.html` (`docs/reenganchar.html`):**
    - *Riesgo:* Un botón de recuperación de emergencia jamás debe tocar datos del negocio ni la licencia.
    - *Guard:* Test estático permanente en CI que verifique que `docs/reenganchar.html` no contiene `deleteDatabase`, `localStorage.clear`, `removeItem("f123_owned")` ni `removeItem("f123_tienda_")` (solo limpia cachés `f123-shell-*` y recarga).

---

## Bloque VI (G30–G33) · Rollout Multi-Tienda (60 Clientes), Telemetría Cero-PII y Verificación en Vivo

30. **G30 — Sanitización Tolerante de `SALAS_PILOTO` y `TEAM_AUTHORITY_LICENSES` (`cloudflare-yparty-worker/src/salas-piloto.mjs` + `cloudflare-worker/team-worker-api.mjs`):**
    - *Riesgo:* Al cargar las 60 tiendas desde `C:\00 Projects\claude-f123\_privado\`, un salto de línea `\r\n`, comillas o espacio al final de un secreto en Cloudflare podría invalidar la última licencia/sala.
    - *Guard:* Limpiar `String(raw || '').replace(/[\r\n"']/g, ',').split(',')` y filtrar por regex exacta antes de poblar el `Set`.
31. **G31 — Diagnóstico Unificado `window.OCSync4Diagnostico()` Cero-PII con Estado de `cf-relay` (`src/yparty-piloto.js` + `docs/cf-relay.js`):**
    - *Riesgo:* Si un cliente reporta lentitud, soporte necesita saber en 1 segundo qué capa está activa sin exponer licencias, PINs ni montos.
    - *Guard:* Añadir a `window.OCSync4Diagnostico()` los campos de solo lectura `capaPrivadaActiva` (`"cf-do-2.0" | "supabase-b" | "firebase-c" | "peer"`), `colaDurablePendiente` (`boolean`) y `privadoExpuesto: false`.
32. **G32 — Guard Pre-Deploy contra Publicación en el Worker Equivocado (`scripts/verify-wrangler-target.cjs`):**
    - *Riesgo:* Ejecutar `npx wrangler deploy` sin `--config` dentro de un subdirectorio publicó accidentalmente en `friendly-123` (incidente de las 22:02 UTC).
    - *Guard:* Script verificador obligatorio que comprueba que el archivo `--config` existe en el directorio actual, que el `name` del config coincide con el Worker esperado (`friendly123-licencias`, `friendly123-yparty-port2-canary-qa` o `friendly123-relay-privado`) y que `--keep-vars` está presente.
33. **G33 — Verificador Smoke Post-Deploy No Destructivo (`projects/sync4-architecture-2-0/src/verify-c224-live-guards.cjs`):**
    - *Riesgo:* Declarar "listo" un despliegue sin comprobar en vivo que GitHub Pages y los 3 Workers de Cloudflare responden con los headers, CORS y versiones correctas.
    - *Guard:* Ejecutar tras cada despliegue el verificador de humo (`node src/verify-c224-live-guards.cjs`) que comprueba en vivo:
      1. `https://jfcarpiopuntocom.github.io/friendly-123/version.json` (`version === "v0.9.02"`, `shell === "f123-shell-v902"`),
      2. `https://jfcarpiopuntocom.github.io/friendly-123/cf-relay.min.js` (`HTTP 200`),
      3. `OPTIONS https://friendly123-relay-privado.jfcarpio.workers.dev/f123/<40hex>-y/head` (`HTTP 204` para origen oficial, `HTTP 403` para origen ajeno),
      4. `GET https://friendly123-relay-privado.jfcarpio.workers.dev/f123/<40hex>-y/head` sin token (`HTTP 401` fail-closed).
