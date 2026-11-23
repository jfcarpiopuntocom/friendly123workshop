# friendly-123 · Sync4 / Arquitectura 2.0 (`friendly123workshop`)

Paquete ejecutable y probado RED→GREEN para pasar **friendly-123** a **Sync4** (arquitectura interna 2.0 como ruta principal A + 2 fallbacks no bloqueantes B y C que apoyan y refuerzan), cumpliendo las directivas vigentes de Notion (`S18`, `C16`, `C17` — 22 nov 2026). **Cero trabajo de rehabilitación de Sync3.**

## Componentes y evidencia verificada

| Módulo / Parche | Regla Notion | Qué resuelve | Verificación |
|---|---|---|---|
| `src/sync4-engine.mjs` | **S18** | Motor Sync4: ruta principal **A (2.0)** + **B (relay durable independiente con circuit breaker y presupuesto diario de bytes)** + **C (outbox local durable + refuerzo peer)**. Caídas o cuota 429/403 jamás bloquean ventas/PIN/UI ni fabrican ACK falso. Coalescing por `licencia + opId` y rechazo fail-closed ante conflicto de payload. | `tests/01-sync4-engine-nonblocking-fallbacks.test.mjs` (**4/4 PASS**) |
| `patches/01-yparty-piloto-sync4-all-roles.patch` + `patches/02-sync-yjs-sync4-all-roles.patch` | **C16** | **Todos pasan a Sync4 / 2.0**: `dueno` mantiene escritor certificado `-cat` (`cat:write`), mientras `admin` y `empleado` abren lectura certificada `-cat` (`cat:read`), despacho comercial tipado `-ops` y fotos `fotos:read` sin quedar en Sync3. Agrega `cat:read` en `solicitarTicketComercialEquipo` y pasa `permitirDespachoEquipo` en `docs/sync-yjs.js`. | `tests/02-sync4-all-roles-c16-red-green.test.cjs` (**RED→GREEN PASS**) + `git apply --check` OK |
| `src/sync4-central-pin-client.mjs` | **C17** | Resolución central de PIN contra el panel privado (`friendly123-licencias.jfcarpio.workers.dev`) para **todos los roles** (`/pin/verify` para dueño + `/team/verify` para admin y empleados). Elimina la espera a Sync3 en aparatos nuevos/vinculados. | `tests/03-sync4-central-pin-c17.test.mjs` (**2/2 PASS**) |
| `patches/03-app-inline-01-post-pin-boot.patch` | Opera OOM | Detiene `cargarDashboardInicial(0)` antes del PIN (`app-inline-01.js:8823`), coalesciendo el arranque tras `oc-login`. | `tests/04-post-pin-boot-red-green.test.cjs` (**RED→GREEN PASS**) + `git apply --check` OK |
| `patches/04-business-read-model-perf.patch` + `patches/05-mock-backend-hoy-index.patch` | Opera OOM | Caché acotada de `Intl.DateTimeFormat` (`1.320 → 1` asignaciones), fast-path `unique()` (`10×+` más rápido) e índices `Map` $O(n)$ en `/api/dashboard`. | `tests/05-hoy-perf-equivalence-red-green.test.cjs` (**RED→GREEN PASS**) + `git apply --check` OK |
| `src/carga-tardia-v2.js` + `src/audit-js-budget.cjs` | JS ≤40 % | Cargador diferido post-PIN + split `i18n.es` + minificación restante: baja arranque JS de **`2.513.304 B` (`67,81 %`)** a **`1.460.590 B` (`39,41 %`) ≤ `40 %` (`1.482.506 B`)** con **0 violaciones pre-PIN**. | `tests/06-js-boot-budget-under-40pct.test.cjs` (**PASS**) |

## Ejecutar suite completa

```bash
node --test projects/sync4-architecture-2-0/tests/*.test.mjs projects/sync4-architecture-2-0/tests/*.test.cjs
```
