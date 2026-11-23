# friendly-123 · Sync4 / Arquitectura 2.0 (`friendly123workshop`)

Paquete completo (cliente + Worker + puente de catálogo + PIN central + rendimiento ≤40 %) y verificado RED→GREEN + E2E criptográfico para migrar **friendly-123** a **Sync4** (arquitectura interna 2.0 principal **A** + 2 fallbacks no bloqueantes **B/C**), según `S18`, `C16` y `C17` de Notion. **Cero trabajo de rehabilitación de Sync3.**

## 10 parches listos para aplicar (`git apply --check` OK sobre `friendly-123`)

| # | Archivo objetivo en `friendly-123` | Regla | Qué corrige |
|---|---|---|---|
| `01` | `src/yparty-piloto.js` | **C16 + C17** | `crearCoordinadorCorte20` y `leerCatalogoPublicoCertificado` admiten `dueno`, `admin` y `empleado`; lee `window.__f123CentralTeamPrincipal`; agrega `cat:read` en `solicitarTicketComercialEquipo`. |
| `02` | `docs/sync-yjs.js` | **C16 + S18** | Desbloquea `empleado` y pasa `permitirDespachoEquipo: true` en `_intentarActivarCorte20SiElegible`; en modo Sync4 / `sala-vacia` no queda rehén de `pendingStructs` del Sync3 viejo. |
| `03` | `src/app/app-inline-01.js` | **Opera OOM** | Detiene `cargarDashboardInicial(0)` antes del candado PIN y coalescea `oc-login`. |
| `04` | `docs/core/business-read-model.js` | **Opera OOM** | Caché acotada `Intl.DateTimeFormat` (`1.320 → 1`) + fast-path `unique()` (`10×+` más rápido, exactitud monetaria bit a bit). |
| `05` | `docs/mock-backend.js` | **Opera OOM** | Índices `Map` $O(n)$ en `/api/dashboard` (elimina `ajustesComision.find` y `ventas.find`). |
| `06` | `src/ws-team-ticket-params.mjs` | **C16** | Permite `cat:read` sobre `-cat` para `admin` y `empleado` (mantiene prohibidos `cat:write`, `priv:*` y `fotos:write`). |
| `07` | `src/port2-readonly-catalog-session.mjs` | **C16** | Enruta `kind === 'team'` por `createTeamTicketParams(cat:read)`, acepta `sala-vacia` y permite cold-join de aparatos nuevos/vinculados sin Sync3 preservando `assertPublicCatalogTransportDoc`. |
| `08` | `cloudflare-worker/ws-worker-api.mjs` | **C16** | Grants seguros por defecto para `admin` y `empleado` cuando `WS_QA_ROLE_GRANTS` no está definido (siempre acotados por `CEILING` y sobrescribibles por env). |
| `09` | `docs/auth-ui.js` | **C17** | Resuelve PIN de `admin`/`empleado` contra `OC_WORKER_URL + "/team/verify"` (`friendly123-licencias.jfcarpio.workers.dev`) para entrar directo en aparatos nuevos sin esperar a Sync3. |
| `10` | `cloudflare-worker/team-authority.mjs` | **C17** | Permite `verify()` solo con PIN de 3 dígitos (sin `subject`) para el teclado de aparatos nuevos/vinculados, con comparación tiempo constante y rate-limit por licencia (máx. 10 intentos / 15 min). |

## Módulos nuevos Sync4 (`src/`)

- **`sync4-engine.mjs` (S18):** ruta principal **A (2.0)** + **B** (relay durable con circuit breaker en 429/403/5xx y tope diario de bytes) + **C** (outbox local durable + refuerzo peer). Coalescing síncrono por `licencia + opId` y rechazo `OPID_PAYLOAD_CONFLICT` antes de tocar transporte.
- **`sync4-catalog-bridge.mjs`:** puente vivo hacia `port2-catalog-delta-writer::applyDelta()` con allowlist pública estricta (elimina `costo`, `margen`, `proveedor`, `pin`, `clientes`) y refuerzo no bloqueante vía `Sync4Engine`.
- **`sync4-central-pin-client.mjs` (C17):** cliente centralizado `/pin/verify` + `/team/verify` con allowlist de origen HTTPS estricto.
- **`carga-tardia-v2.js` + `audit-js-budget.cjs`:** baja el arranque JS de **`2.513.304 B` (`67,81 %`)** a **`1.460.590 B` (`39,41 %`) ≤ `40 %`** con **0 violaciones pre-PIN**.

## Suite completa (`tests/`)

```bash
node --test projects/sync4-architecture-2-0/tests/*.test.mjs projects/sync4-architecture-2-0/tests/*.test.cjs
```

Incluye **`tests/09-sync4-3device-aba-x2-real-crypto-e2e.test.mjs`**: simulación de **3 aparatos (Owner PC + Admin iPhone + Employee iPhone)** usando `pin-authority.mjs`, `team-authority.mjs` y `ws-capability-issuer.mjs` reales (HMAC-SHA256 + nonces de un uso + revocación inmediata al rotar PIN) a través de **2 ciclos A→B→A completos** con fallas inyectadas (A 503, B 429 cuota agotada, doble toque y payload alterado).
