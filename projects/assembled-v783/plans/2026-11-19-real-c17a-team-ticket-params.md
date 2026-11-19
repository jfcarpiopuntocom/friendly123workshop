# PRECODE · PORT2 C17a · Cliente de tickets comerciales one-use para Team (`admin` / `empleado`) + prueba Workerd real

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios en Cloudflare/R2:** NINGUNO (100% local + Miniflare/Workerd CI).
- **Base:** `jfcarpiopuntocom/friendly-123` `origin/master@d00a52c` (incluye `#795` C15 y `#797` deploy-gate ya fusionados por Sol6).
- **Colisión con #796 y #798:** CERO (solo 4 archivos nuevos: `src/ws-team-ticket-params.mjs`, `test/p0-c17a-team-ticket-params.test.cjs`, `cloudflare-yparty-worker/qa/p0-c17a-team-commercial-workerd.test.mjs`, `.github/workflows/qa-port2-real-c17a-team-commercial.yml`).

## Contrato real verificado en fuentes del servidor
- `cloudflare-worker/team-authority.mjs` + `ws-capability-issuer.mjs`:
  - `credentials`: `{ kind: 'team', licenseCode, instanceId, subject, role, pin }` (`subject` `/^[A-Za-z0-9_-]{5,120}$/`, `pin` 3 dígitos distinto de `456`/`789`).
  - `scopes`: array de **1 solo scope** (`oneScope` exigido por `cloudflare-yparty-worker/src/ws-authority-client.js`).
- `cloudflare-yparty-worker/src/ws-authority-client.js`:
  - `admin`: `ops:sale`, `ops:adjust`, `ops:payment` en `-ops` (HTTP tipado); `fotos:read` en `-fotos` (HTTP).
  - `empleado`: `ops:sale`, `ops:payment` en `-ops` (HTTP tipado); `fotos:read` en `-fotos` (HTTP). **Prohibido `ops:adjust`**.
  - **Team NUNCA accede a WebSockets Yjs crudos (`-cat`, `-ops` WS, `-priv`) ni a `fotos:write` ni a `ops:read`.**
  - `contador`, `artista`, `demo`, `dueno` (en este módulo dedicado a Team): denegados en cerrado sin emitir red.

## Diseño Ponytail (`src/ws-team-ticket-params.mjs`)
- Exporta `createTeamTicketParams({ licenseCode, instanceId, room, scope, getCredentials, fetch })`:
  - `ISSUER` fijado a `'https://friendly123-licencias.jfcarpio.workers.dev/ws/ticket'` (nunca sobrescribible por llamador).
  - Valida formato estricto de `licenseCode`, `instanceId` (6..120), `room` (`-ops` para `ops:*`, `-fotos` para `fotos:read`), y tabla de permisos por rol (`TEAM_SCOPES`: `admin` vs `empleado`).
  - Lee credenciales transitorias `getCredentials()` **antes y después** del `POST /ws/ticket`; si `pin`, `subject`, `role`, `licenseCode` o `instanceId` cambiaron en vuelo, falla en cerrado (`WS authorization unavailable`) sin entregar token.
  - Verifica formato de token HMAC, longitud `<= 3500`, y `expiresAt` dentro de `(now, now + 60000]`.
  - Timeout acotado `2400 ms` (`AbortController`), `cache: 'no-store'`, `credentials: 'omit'`, `redirect: 'error'`, `referrerPolicy: 'no-referrer'`.
  - Devuelve `Object.freeze({ licencia: licenseCode, instancia: instanceId, cap: data.token })` — jamás persiste ni devuelve PIN/subject.

## Plan TDD (RED → GREEN → Workerd real)
1. **RED:** `test/p0-c17a-team-ticket-params.test.cjs` falla antes de crear `src/ws-team-ticket-params.mjs`.
2. **GREEN unitario + emisor real:** pruebas con `ws-capability-issuer.mjs` + `team-authority.mjs` reales verificando emisión para `admin` (`ops:sale`, `ops:adjust`, `ops:payment`, `fotos:read`), `empleado` (`ops:sale`, `ops:payment`, `fotos:read`), denegación local sin red de `empleado`+`ops:adjust`, `fotos:write`, `-cat`/`-priv`/`ops:read`, `contador`/`artista`, cambio de PIN en vuelo y revocación de miembro en servidor.
3. **GREEN Workerd real (`Tienda` DO):** `cloudflare-yparty-worker/qa/p0-c17a-team-commercial-workerd.test.mjs` demostrando:
   - `admin` ejecuta `sale.record`, `stock.adjust` y `credit.payment.record` vía `-ops` HTTP → `200 business-committed`;
   - `empleado` ejecuta `sale.record` y `credit.payment.record` → `200 business-committed`, pero es rechazado en `stock.adjust` y rechazado (`403`) si intenta abrir WebSocket Yjs en `-ops` o `-cat` usando su ticket `ops:sale`;
   - tras revocar al miembro en `teamAuthority`, su siguiente intento falla en cerrado (`403`).
4. **Métricas:** sin cambios en PORT (`81.5/100.0`), Calidad (`72.7/100.0`) ni GO (`0/6`) — se acreditará al cablear en `src/yparty-piloto.js` + bundle sellado en C17b.
