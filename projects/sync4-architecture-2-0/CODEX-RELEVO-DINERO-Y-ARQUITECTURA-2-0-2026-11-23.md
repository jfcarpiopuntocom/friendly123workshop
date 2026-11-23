# Relevo Técnico para Codex · Dinero Impecable y Paso Completo a Arquitectura 2.0 (`friendly-123`)

- **Fecha/Hora (GMT-5):** `2026-11-23 10:45 -05:00`
- **Autoría / Apoyo:** Google Gemini (análisis directo sobre código publicado `4a6d038f`, kit `C242` `0a24e439` en `friendly123workshop`, Notion War Room / handoff Claude, e inspección viva read-only de `https://jfcarpiopuntocom.github.io/friendly-123/`).
- **Directiva del propietario (JFC, `2026-11-23 10:42 GMT-5`):**
  > *«ahora Codex entra a la cancha! apoyale! dinero debe funcionar ya bien bien bien!!! pasa todo a arquitectura 2.0 carajo!»*
- **Reglas permanentes vigentes:** Ponytail `full` 100 % · cero pérdida/borrado/truncado de datos de clientes · cero saturación de plataformas gratuitas (Supabase/Firebase/Cloudflare) · pruebas RED→GREEN sobre código real y verificación en WebKit/A→B→A antes de cantar GO · ninguna huella de IA ni coautoría en commits/código de producto.

---

## 1. Foto exacta de producción ahora mismo (`4a6d038f`, `23 nov 2026`)

| Componente | Estado real verificado | Referencia |
| :--- | :--- | :--- |
| **App publicada (`Pages`)** | `v0.9.11` (`f123-shell-v911`, `golden447`, commit `4a6d038f`) | `docs/version.json`, `docs/sw.js` |
| **Kit `C242` (`v0.9.12`)** | **Listo en `friendly123workshop` (`0a24e439`)**, aún **NO** aplicado en `4a6d038f` | `apply-c242.cjs` (`133/133` + `WEBKIT_C242_PASS`) |
| **Supabase (`sb`)** | **DORMANT** (`C240`, `52d13b5b`) — proyecto restringido hasta diciembre por bucle cada 10 s de `realtime-js`; `<script src="./vendor/supabase-relay.min.js">` comentado | `docs/index.html:941-946`, `docs/peer-sync.js:491`, `docs/relay-selector.js:11-12` |
| **Cloudflare Private Relay (`cf`)** | **Capa 0 activa (`C224`)** en `friendly123-relay-privado.jfcarpio.workers.dev` (E2E AES-GCM, `ckptFrameBytes = 1536 KiB`, `docs/cf-relay.js`) | `docs/cf-relay.js`, `docs/relay-selector.js:24` |
| **Firebase RTDB (`fb`)** | **Capa 1 respaldo (`C234`)** con primera carga exenta del tope diario 20 MB hasta `10x` (`200 MB/día/sala`) | `docs/firebase-relay.js`, `docs/relay-selector.js:78` |
| **Servidor 2.0 (`cloudflare-yparty-worker`)** | `C232` (`e9f5154b`) fusionado en repo (filtra raíces privadas en `-cat`), **pendiente de `wrangler deploy`** (requiere autorización escrita de deploy) | Notion `4211642b-67f3-811d-8f71-db22bf6b81be` |
| **Score 2.0 (`scripts/architecture-2-port-score.cjs`)** | `PORT 100.0/100 \| calidad 84.0/100 \| GO 0/6` | Ejecutado sobre repo local |
| **Pestaña viva (`agent-tab-1`)** | Bloqueada en `#oc-gate` (`My small shop USA · License ••••2J24`, `v0.9.11`). Detrás del candado solo se veían `6` ventas (`$51.00` brutos, `$8.91` comisiones). | Captura `browser` (`0ac05722`) |

---

## 2. Por qué AÚN NO salen todo el dinero y movimientos anteriores en `••••2J24` (`lord`)

Verificado directamente en el código `4a6d038f` y en las pruebas en vivo de Claude de hoy (`4:40 am` y `9:46 am GMT-5`):

1. **Pre-PIN `401` pausa Cloudflare antes de digitar el PIN (`docs/cf-relay.js:244` + `docs/relay-selector.js:141-160, 637-649`):**
   - Mientras el usuario está en `#oc-gate`, `cf-relay.js` (`readSessionCredentials()`) devuelve `null`, cierra `1008` y `relay-selector.js` pausa `f123_relay_cupo_cf_v1` `PAUSA_MS = 15 min`.
   - **Aclaración verificada en `4a6d038f` (confirmada también por Codex 10:53 am):** `docs/relay-selector.js:637-649` **sí** limpia `pausaHasta = 0` al dispararse `oc-login` y cierra sockets que no sean CF (`1012`) para subir a Cloudflare. El riesgo ocurre **durante/antes** del login si el aparato cayó en otra capa y luego choca con el punto #2 abajo.
2. **Trampa de capa parcial + `_pullCursor` único por canal sin capa (`docs/relay-selector.js:242` + `docs/sync-yjs.js:1169-1174, 1355`):**
   - `capaVaciaSigue` (`docs/relay-selector.js:242`) **solo** baja de capa si `Number(h.rev) === 0 && Number(h.seq) === 0`. Con 1 sola escritura en Cloudflare DO (p. ej. las 6 ventas de prueba visibles detrás de `#oc-gate`), ya no salta automático.
   - **Bug confirmado por Codex en arnés sintético (`docs/sync-yjs.js:1355`):** `_pullCursor` (`f123_yjs_pull_cursor_v2` + suffix) guarda `{ rev, seq }` sin identificar la capa (`cf` vs `fb`). Al cambiar de proveedor cuando ambos coinciden en el mismo par numérico `rev/seq`, `procesarHead` (`:1355`) lo da por aplicado y **omite `pedirPagina`**, y `guardarPullCursor` (`:1172`) ignora cursores con `rev` menor aunque vengan de otro backend.
   - **Ceguera de fallo en corte 2.0 (`docs/sync-yjs.js:3472-3479`):** `_intentarActivarCorte20SiElegible` envuelve `pausarParaArquitectura20` + `activarCorte20Runtime` (`coord.activate20()`) en `.catch(function () {})` sin registrar motivo diagnóstico cuando revierte a legado, lo que oculta por qué `modoCorte20Activo` no encendió en los perfiles de lectura que probó Codex.
3. **Historial en Supabase (`C240`) o en dispositivo antiguo que aún no subió checkpoint (`C225`):**
   - Como confirmó Claude a las `4:40 am`, el buzón Cloudflare DO (`C224`) **no tenía** todavía el historial privado completo de `••••2J24` hasta que el aparato antiguo que guarda todo en local abra `>= v0.9.05` (y suba su `ckpt` >768 KiB) o se recupere vía Firebase/respaldo `.json`.
   - Lo que haya quedado **exclusivamente** en Supabase no es accesible hoy mientras Supabase esté `DORMANT` (restringido hasta diciembre).
   - Nota adicional de sala (`docs/sync-yjs.js:2803`, `docs/sync-realtime.js:525`): la huella `6583453063440131` (`••••2J24`) enruta a `<codigo>::limpio-2026-09-16`. Datos de salas previas sin ese sufijo no se mezclan ahí automáticamente.
4. **Topes de UI que ocultan historial aunque sí esté en local:**
   - `Sold` (`src/app/app-inline-01.js`, `C239`): monta `120` filas iniciales + botón *«Show more sales / Mostrar más ventas»*.
   - `Inventory → Log de movimientos` (`src/app/app-inline-01.js`): pinta `movs.slice(0, 20)`.
   - `/api/actividad` (`docs/mock-backend.js:8562`): corta en `.slice(0, 100)`; los movimientos anteriores se mueven a `IndexedDB` `f123_archivo` (`docs/idb-archivo.js`) y no tienen paginador completo en UI.
   - `Expenses` (`src/app/app-inline-01.js:6417`): tarjetas mensuales (*Dinero recibido este mes*) filtran por `_mesActual`.

---

## 3. Auditoría exacta: ¿qué dinero SÍ está en 2.0 y qué sigue en 1.0 dentro de `4a6d038f`?

Para pasar **todo dinero** a Arquitectura 2.0 sin alucinar avances ni romper dinero real, este es el mapa exacto del código en `4a6d038f`:

### A. Qué SÍ ejecuta ya el ledger SQL autoritativo 2.0 (`cloudflare-yparty-worker/src/authoritative-business-sql.mjs:100-185`)
Solo **3 contratos** generan efecto económico `business-committed` (`HTTP 200`) hoy:
1. `sale.record` (`op.tipo === "venta"`) — valida precio unitario certificado (`BigInt`), cantidad (`>= 1`), suma `cash_delta_cents` y resta `quantity_delta` en SQLite del DO.
2. `stock.adjust` (`op.tipo === "ajuste"`) — intención absoluta física (`money === 0`, `amountCents === 0`).
3. `credit.payment.record` (`op.tipo === "abono" | "pago-credito"` con `receivableId`).

### B. Qué está en `queuedOnly: true` (`HTTP 202`, **NO** ejecuta efecto económico real todavía en 2.0 SQL)
- `expense.record` (`gastos`): guardado en inbox tipado como `stored-for-application` (`202`), **`queuedOnly: true`** en `contracts` (`authoritative-business-sql.mjs:106`).
- `credit.customer.payment.record` (`abono` por `clienteId`, prefijo `customer-payment:...`): **`queuedOnly: true`** en `contracts` (`authoritative-business-sql.mjs:107`).

### C. Qué cae en `unmapped-typed-command` (`null`) -> `C196` desarma 2.0 y regresa a 1.0 (`docs/sync-yjs.js:3057, 3697`)
- Edición y anulación de ventas / devoluciones / notas de crédito (`aj-dev-...`)
- Liquidaciones y pagos de comisiones a asociados (`payouts` / `ajustesComision`)
- Caja chica por percha (`caja-chica.js`: `caja_chica_ingreso`, `caja_chica_retiro`)
- Cargos/abonos manuales directos en `cartera.js`
- Transferencias de stock entre perchas (`transferencias`)
- Altas/bajas de clientes y cierres de caja

### D. Por qué 2.0 no arranca para todas las tiendas aún (`docs/sync-rollout.json`, `docs/sync-yjs.js`)
- `docs/sync-rollout.json` solo habilita `"yparty": true` para la huella única `e048094f...` con `frozenHead: "fb-7d8e5559ecb3eb245c73f7c5"` (las ~60 licencias reales preparadas en `_privado/rollout-entradas.json` aún no están activadas).
- `docs/sync-yjs.js:2988`: **`API.opsCanal`** (`-ops`) y **`API.canalSombra`** siguen siendo la vía real del historial privado E2E cifrado (Cloudflare Private Relay `C224` + Firebase `fb`).
- `cloudflare-yparty-worker` con filtro `C232` (`e9f5154b`) sigue pendiente de `wrangler deploy`.

---

## 4. Ruta de apoyo concreto para Codex (Ponytail `full`, cero pérdidas, orden estricto)

### Fase 0 — Inmediata (recuperación segura del dinero/movimientos faltantes + estabilidad base)
1. **Coordinar `wt-sync4` antes de editar (`fix/c242-pagar-todas-fechas`):** actualmente `C:\00 Projects\claude-f123\wt-sync4` tiene trabajo en curso sobre `C242 v0.9.12` + `pagar-todas-fechas` (`docs/core/commission-history.js`, `src/app/app-inline-01.js`, `docs/estado-idb.js`, `docs/index.html`, `docs/reenganchar.html`, `docs/sync-yjs.js`). Trabajar en rama/worktree aislado y consultar Buzón antes de tocar esos archivos.
2. **Corregir las 2 brechas recién confirmadas en transporte privado y diagnóstico 2.0 (`docs/sync-yjs.js` + `docs/cf-relay.js`/`docs/relay-selector.js`):**
   - **Cursor por capa (`docs/sync-yjs.js:1169, 1355`):** indexar el cursor de pull `{ rev, seq }` **por capa durable** (`sock.relayLayer`: Cloudflare vs Firebase vs Supabase) para que cambiar de proveedor con igual `(rev, seq)` o `rev` menor **jamás** omita `pedirPagina()` ni trabe el backfill histórico.
   - **Pre-PIN `401` (`cf-relay.js`) + Diagnóstico de corte 2.0 (`docs/sync-yjs.js:3472-3479`):** no disparar socket CF autenticado sin PIN si ya se difiere a `oc-login` (evita pausa previa de 15 min antes de entrar), y registrar motivo cero-PII en el `.catch()` de `_intentarActivarCorte20SiElegible` cuando `activate20()` / `pausarParaArquitectura20` revierta `modoCorte20Activo` a `false`.
3. **Recuperación de historial de `••••2J24`:** confirmar desde qué dispositivo o respaldo `.json` tiene JFC sus movimientos anteriores completos para inyectarlos vía `C225` (`ckpt`) / `/respaldo/importar` hacia Cloudflare DO + Firebase (cero relecturas en bucle a Supabase).

### Fase 1 — Desbloqueo de servidor 2.0 (`C232`) y verdad única de dinero en 2.0
4. **Desplegar `C232` en `cloudflare-yparty-worker/`** (cuando JFC apruebe el `wrangler deploy` exacto) para proteger `-cat` contra raíces privadas antes de abrir `yparty: true` a más tiendas.
5. **Promover `queuedOnly` (`202`) y flujos de dinero faltantes en `authoritative-business-sql.mjs` + `_traducirOpLegadoAComando20` (RED → GREEN estricta):**
   - **Ola 1 (dinero directo):** `credit.customer.payment.record` (abonos de clientes sobre cartera/fiado real) y `expense.record` (gastos reales en SQLite DO con efectos deterministas e idempotentes por `opId`).
   - **Ola 2 (ciclo completo de dinero y movimientos):** edición/anulación/devolución de venta (`aj-dev`), liquidaciones/pagos de comisiones (`payouts`), `caja_chica_ingreso`/`retiro`, y `cartera` manual — con tabla de movimientos inmutables append-only y totales en **centavos enteros (`BigInt` / integer cents)** nunca floats.
   - **Invariante clave:** conservar la cerca C196/C38 (un solo escritor autoritativo activo por operación; `opId` idempotente en IDB + DO SQLite para garantizar **cero doble cobro y cero doble descuento** en reintentos/reconexión/failback).
6. **Reconciliación & Auditoría visible para el dueño (`readback` + historial sin recortes ciegos):**
   - Permitir paginación / consulta completa de movimientos archivados (`idb-archivo.js` + `/api/actividad` + ledger SQL 2.0) sin romper memoria en Safari.
   - Verificación A→B→A real en GitHub Pages (`PC ↔ Safari iPhone ↔ PC`) antes de activar `sync-rollout.json` para las 60 tiendas reales.

*(Ver el archivo compañero `RESEARCH-PLAYBOOK-ANTI-BUGS-FAILBACKS-2026-11-23.md` en esta misma carpeta para las prácticas probadas de Linear, Figma, Square, Stripe Terminal, Loyverse, PowerSync, WebKit y Cloudflare aplicadas a cada capa de `friendly-123`.)*
