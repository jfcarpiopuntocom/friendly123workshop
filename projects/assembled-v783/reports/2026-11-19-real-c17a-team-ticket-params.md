# Reporte · PORT2 C17a · Cliente de tickets comerciales one-use para Team (`admin` / `empleado`) + Workerd real

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios Cloudflare/R2:** NINGUNO.
- **PR producto (`jfcarpiopuntocom/friendly-123`):** [#799](https://github.com/jfcarpiopuntocom/friendly-123/pull/799)
- **Rama:** `port2/20261119-c17a-team-ticket-params` (4 archivos nuevos; CERO colisión con `#800` y `#801`)
- **HEAD exacto verificado en CI:** `850e59a`
- **PRECODE:** [`projects/assembled-v783/plans/2026-11-19-real-c17a-team-ticket-params.md`](../plans/2026-11-19-real-c17a-team-ticket-params.md) (`c95ab1e`)
- **Reserva Notion:** `41d1642b-67f3-81b4-a3d4-f99d959a9c13` (Liberada, lista para fusión de Sol6)

## Qué entrega (`src/ws-team-ticket-params.mjs`)
- Cliente de tickets one-use de **un solo scope HTTP (`oneScope`)** para `admin` (`ops:sale`, `ops:adjust`, `ops:payment`, `fotos:read`) y `empleado` (`ops:sale`, `ops:payment`, `fotos:read`; **`ops:adjust` denegado localmente con 0 red**).
- Rechazo síncrono de salas Yjs crudas (`-cat`, `-priv`, `ops:read`), `fotos:write`, `ops:expense`, y roles no autorizados (`contador`, `artista`, `demo`, `owner` en este cliente) más PINs por defecto (`456`/`789`).
- `ISSUER` fijado a `https://friendly123-licencias.jfcarpio.workers.dev/ws/ticket`; verificación de credenciales antes y después del vuelo; cero persistencia de PIN/subject/token.

## Evidencia verificada (RED → GREEN → Workerd real CI)
- **RED local:** `test/p0-c17a-team-ticket-params.test.cjs` 0/7 antes de crear el módulo.
- **GREEN local:** 7/7 PASS (228 ms), incluido emisor central real (`ws-capability-issuer.mjs` + `team-authority.mjs` + `pin-authority.mjs`) con emisión, consumo único y revocación inmediata.
- **GitHub Actions CI en HEAD exacto `850e59a`:** **14/14 PASS, 0 FAIL** (`CodeRabbit` skipping):
  - `c17a` (Workerd real `Tienda` DO: `empleado` `sale.record` + `credit.payment.record` `200 business-committed`, `empleado` `ops:adjust` denegado, `admin` `stock.adjust` `200 business-committed`, WebSocket `-ops`/`-cat` `403`, revocación fail-closed) PASS (`44587182734`, 14 s)
  - `yparty-worker` PASS (`44587182394`), `app` PASS (`44587182394`), `gate-d-real-app` PASS (`44587182387`)
  - `P0 Hotfix Gate`, `Release continuity gate`, `Synthetic sync`, `two-tab-sales`, `hex-boundary`, `integrated`, `mixed-shell`, `private-health`, `twice`, `Workers Builds` PASS

## Métricas
- **PORT 2.0:** `81.5/100.0` · **Calidad:** `72.7/100.0` (pendiente merge `#800` a `74.1/100.0`) · **GO comercial:** `0/6` (se acreditará `commercial-role-switch` al cablear en `src/yparty-piloto.js` en C17b).
