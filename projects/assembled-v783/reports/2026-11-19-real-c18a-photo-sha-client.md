# Reporte real · PORT2 C18a · Cliente endurecido de fotos SHA (Owner PUT/GET + Team read-only, Workerd DO SQLite)

- **Fecha:** 2026-11-19
- **PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/807
- **Rama:** `port2/20261119-c18a-photo-sha-client`
- **Commit exacto verificado:** `6c810d641e7947caac706341b9869d091ce48e64` (`6c810d6`)
- **Base `master`:** `f5f400d` (`v0.8.05`)
- **Estado de merge:** Listo para auditoría y merge de Sol6 (0 colisiones con `#805` y `#806`; no fusionado por Antigravity).
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema resuelto (enfoque Ponytail)

Hasta `master@f5f400d`:
- El Worker real (`cloudflare-yparty-worker/src/index.mjs`) y el Durable Object real `Tienda` (`cloudflare-yparty-worker/src/photo-blob-store.mjs`) ya exponen `/fotos/:room/:sha` sobre SQLite persistente del DO (chunking 60 KiB, hasta 1.5 MiB, verificación SHA-256 en servidor, fail-closed con `WS_PHOTO_BLOBS_QA !== '1'`, cero R2).
- El emisor central (`ws-capability-issuer.mjs`) ya soporta `fotos:write` + `fotos:read` para `owner` y `fotos:read` (read-only) para `admin`/`empleado` (C17a `#799`).
- Faltaba el módulo cliente endurecido y reutilizable para el navegador que consuma ese contrato sin exponer secretos, sin abrir `PUT` a roles `team`, con host pineado, timeout acotado, single-flight por `(method, sha)` y verificación SHA-256 de extremo a extremo.

## 2. Archivos entregados (`+625` líneas, 4 archivos nuevos, 0 colisiones)

1. `src/port2-photo-sha-client.mjs` (`+208`):
   - `createOwnerPhotoShaClient`: solicita tickets one-use `fotos:write` (PUT) y `fotos:read` (GET) contra el emisor oficial (`friendly123-licencias.jfcarpio.workers.dev/ws/ticket`), host pineado estrictamente a `friendly123-yparty-port2-canary-qa.jfcarpio.workers.dev`, validación SHA-256 hex64, tamaño `1..1_572_864` bytes, verificación SHA-256 del cuerpo en `PUT` y en respuesta `GET`, `AbortController` acotado (`500..15000 ms`), guard `isVisible()`, single-flight por `(method, sha)`, `cache: 'no-store'`, `credentials: 'omit'`, `redirect: 'error'`, `referrerPolicy: 'no-referrer'`, cero persistencia de PIN/tokens.
   - `createTeamPhotoShaReader`: cliente estrictamente **read-only** (`get()` únicamente; `put` ausente/`undefined`), usando `requestTeamScopedTicket` de C17a (`src/ws-team-ticket-params.mjs`) con scope exclusivo `fotos:read` para `admin` y `empleado`, bloqueando roles fuera de contrato (`contador`/`artista`/`demo`) antes de tocar red.
2. `test/p0-c18a-photo-sha-client.test.cjs` (`+244`): 6 pruebas unitarias P0 (validación fail-closed, timeout, single-flight, corrupción SHA en GET, host mismatch, read-only estricto para `team`).
3. `cloudflare-yparty-worker/qa/p0-c18a-photo-sha-client-workerd.test.mjs` (`+143`): prueba real en **Miniflare/Workerd** contra el Worker y `Tienda` DO SQLite reales (foto de **600 KiB** multi-chunk subida por `owner` → reinicio en frío del DO → lectura exacta con SHA-256 verificado por `empleado` con `fotos:read` → denegación `403` para `contador` → `WS_PHOTO_BLOBS_QA=0` fail-closed `404`).
4. `.github/workflows/qa-port2-real-c18a-photo-sha-client.yml` (`+30`): gate dedicado `c18a` corriendo unitarias + Workerd real en Ubuntu 24.04 + Node 22.

## 3. Evidencia verificada en el SHA exacto `6c810d6`

### Local (TDD RED → GREEN)
- **RED:** `node --test test/p0-c18a-photo-sha-client.test.cjs` → `0/6` (falló por ausencia del módulo `src/port2-photo-sha-client.mjs`).
- **GREEN unitario:** `6/6 PASS`.
- **GREEN Workerd real (`Tienda` DO SQLite):** `node --test cloudflare-yparty-worker/qa/p0-c18a-photo-sha-client-workerd.test.mjs` → `PASS` (2.9s, persistencia multi-chunk 600 KiB tras reinicio en frío, cero R2).

### GitHub Actions CI en PR #807 (`6c810d6`) — **14/14 PASS, 0 FAIL**
- `c18a`: **PASS** (20s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092698/job/135800492401
- `yparty-worker`: **PASS** (1m55s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092348/job/135800490386
- `gate-d-real-app`: **PASS** (42s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092227/job/135800489763
- `P0 Hotfix Gate`: **PASS** (1m19s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092135/job/135800491077
- `Release continuity gate`: **PASS** (1m18s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092216/job/135800490054
- `Synthetic sync + real-browser contracts (no customer data)`: **PASS** (53s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092406/job/135800492359
- `app`: **PASS** (47s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092348/job/135800491204
- `hex-boundary`: **PASS** (30s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092350/job/135800490594
- `twice`: **PASS** (16s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44592092223/job/135800490453
- `integrated`: **PASS** (8s)
- `mixed-shell`: **PASS** (6s)
- `private-health`: **PASS** (6s)
- `two-tab-sales`: **PASS** (1m27s)
- `Workers Builds: friendly-123`: **PASS**

## 4. Impacto honesto en puntajes y siguiente paso

- En `master@f5f400d` los marcadores oficiales permanecen en **PORT `81.5/100.0`**, **Calidad `74.1/100.0`**, **GO `0/6`** (hasta que Sol6 audite y fusione `#805`, `#806`, `#807` y recalcule).
- Este PR desbloquea **C18b (`photo-sha/browser-photo-cutover`, +2.0 pts)**, que cableará `createOwnerPhotoShaClient` y `createTeamPhotoShaReader` en `src/yparty-piloto.js` + `docs/vendor/yparty-piloto.min.js` (`esbuild 0.28.2`) + `docs/sync-yjs.js` detrás del interruptor QA en OFF una vez que Sol6 fusione `#805` y `#807`.
- **Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.**
