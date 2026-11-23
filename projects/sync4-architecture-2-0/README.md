# friendly-123 — Sync4 (Arquitectura 2.0) + Parches C214 sobre v0.8.95

Paquete verificado en laboratorio (`friendly123workshop`, rama `feat/sync4-architecture-2-0`) alineado con:
- **Regla S18:** cero reparaciones de Sync3; **Sync4** sobre arquitectura interna 2.0 (ruta primaria **A**) + **2 fallbacks B/C no bloqueantes**.
- **Regla C16:** todos los roles comerciales (`dueno`, `admin`, `empleado`) entran a Sync4 / 2.0.
- **Regla C17:** verificación central de PIN (`/pin/verify` + `/team/verify` solo con PIN de 3 dígitos) contra `friendly123-licencias.jfcarpio.workers.dev`.
- **Plan de 77 micropasos Sync4** y **presupuesto JS de arranque ≤ 40 %** (`≤ 1,482,506 B` vs baseline 22-nov `3,706,265 B`).

---

## 1. Estado de adopción en `friendly-123`

- **C212 (`v0.8.94`, `9fe50b58`, live en Pages):** adoptó arranque post-PIN y optimización Hoy (`app-inline-01.js`, `business-read-model.js`, `mock-backend.js`).
- **C213 (`v0.8.95`, `f13c0a7d`, rama `feat/c213-sync4-todos-roles-pin-panel`):** adoptó los **7 parches Sync4** previos (`patches/01..07`) para roles `dueno`/`admin`/`empleado` y `/team/verify` PIN-only.

## 2. Nuevos parches C214 listos sobre `v0.8.95` (`f13c0a7d`) — `patches-v895/`

Auditando `f13c0a7d` línea por línea aparecieron **4 bloqueos reales en `v0.8.95`**, todos con prueba RED→GREEN contra los blobs exactos de `f13c0a7d` y `git apply --check` limpio:

| Parche en `patches-v895/` | Archivo en `friendly-123` | Bloqueo real en `v0.8.95` (`f13c0a7d`) | Solución mínima (Ponytail) |
|---|---|---|---|
| `01-v895-readonly-catalog-salavacia-empty-roots.patch` | `src/port2-readonly-catalog-session.mjs` | `admin`/`empleado` que entra a una sala nueva `sala-vacia` (antes de que el dueño suba el 1er producto) falla con `throw fail()` en línea 119 porque `publicDoc.share` aún no tiene `'productos'`/`'ubicaciones'`. | Cuando `body.frozenHead === 'sala-vacia'`, materializa `publicDoc.getMap('productos')` y `publicDoc.getMap('ubicaciones')` y conserva `assertPublicCatalogTransportDoc` (bloqueando cualquier raíz privada). |
| `02-v895-sync-realtime-allow-cold-device-pause.patch` | `docs/sync-realtime.js` | `pausarParaArquitectura20(licencia)` devuelve `{ ok: false }` si `!leerSala()` — todo aparato nuevo o recién vinculado sin sala Sync3 previa aborta la activación de Sync4. | Permite pausar el relay legado cuando `!sala` (sin sala Sync3) manteniendo la guarda de licencia coincidente y `tienePendientesDurables()`. |
| `03-v895-yparty-piloto-ruta-efectiva-diagnostico.patch` | `src/yparty-piloto.js` | Sin observabilidad unificada `rutaEfectiva` (Micropasos 23 y 32) para QA Safari/Opera. | Expone `window.OCSync4Diagnostico()` y `diagnostico()` con `{ motor, rutaEfectiva, modoCorte20Activo, coordMode, rol, host, privadoExpuesto: false }` — cero PII/PINs, cero acceso al `Y.Doc` privado. |
| `04-v895-carga-tardia-40pct-boot.patch` | `docs/index.html`, `docs/carga-tardia.js` | `v0.8.95` aún carga `2,522,894 B` (`68.07 %`) de JS síncrono pre-PIN. | Difiere 44 scripts post-PIN / bajo demanda (100 % presentes en `sw.js` `SHELL`, 0 faltantes offline). Combinado con split `i18n-es` y minificación de kept scripts cruza **≤ 40 %** (`≤ 1,482,506 B`) con `i18n` EN/ES verificado en VM. |

---

## 3. Cobertura de módulos y pruebas (30/30 PASS)

| Suite | Cobertura | Micropasos / Reglas |
|---|---|---|
| `01-sync4-nonblocking-engine.test.mjs` | Motor Sync4 A + Fallbacks B (circuit breaker 429/5xx + cuota diaria bytes) + C durable no bloqueante + coalescing `opId` | S18, 25–30, 41–44 |
| `02-sync4-all-roles-cutover.test.mjs` | RED→GREEN roles `dueno`, `admin`, `empleado` en Sync4 | C16 |
| `03-sync4-central-pin-panel.test.mjs` | Cliente central `/pin/verify` + `/team/verify` con origen estricto `friendly123-licencias.jfcarpio.workers.dev` | C17 |
| `04-post-pin-boot-and-hoy.test.cjs` | No-trabajo pre-PIN y coalescing `oc-login` | C212 |
| `05-hoy-read-model-perf.test.cjs` | Caché `Intl.DateTimeFormat` e índices `Map` `O(n)` | C212 |
| `06-js-boot-budget-40pct.test.cjs` | Cargador `carga-tardia-v2.js` y auditoría presupuesto ≤ 40 % | Boot ≤ 40 % |
| `07-sync4-deep-6-blockers-red-to-green.test.mjs` | RED→GREEN de los 6 bloqueos profundos (adoptados en C213 `v0.8.95`) | C16, C17, S18 |
| `08-sync4-catalog-bridge.test.mjs` | Puente de catálogo con allowlist pública estricta (borra `costo`, `margen`, `pin`, `clientes`, bloquea `__proto__`) | Privacidad, 17–19 |
| `09-sync4-3device-aba-x2-real-crypto-e2e.test.mjs` | E2E 3 dispositivos (Dueño/Admin/Empleado) A→B→A × 2 con `pin-authority.mjs`, `team-authority.mjs` y `ws-capability-issuer.mjs` reales, inyección de fallos A-503/B-429 y revocación inmediata por rotación de PIN | C16, C17, S18, 45–47 |
| `10-sync4-adversarial-stress-micropasos.test.mjs` | Tormenta 100× replay, HTTP 202/ACK perdido + reinicio frío vía outbox JSON, barrera failback parcial FIFO, aislamiento estricto entre 2 tiendas | 32, 39, 43, 47, 56–61, 65 |
| `11-sync4-accounting-exact-cents.test.mjs` | Libro contable exacto en centavos enteros: venta a crédito, 2 abonos parciales (`stockChanged: false`), devolución con reversión exacta y rechazo de sobre-devolución, paridad artista+casa = neto | 48–52 |
| `12-sync4-photo-blobs-and-private-isolation.test.mjs` | Blobs de foto SHA-256 con HMAC real: Dueño PUT + dedup, Empleado solo lectura `fotos:read`, bloqueo `fotos:write`, aislamiento cruzado entre tiendas y rechazo de metadatos privados | 31, 53 |
| `13-v895-c214-red-to-green-live-bugs.test.mjs` | RED→GREEN y `git apply --check` de los 4 parches C214 directamente sobre blobs reales de `friendly-123` `v0.8.95` (`f13c0a7d`) | C214 (`v0.8.95` → `v0.8.96`), 23, 32, Boot ≤ 40 % |

---

## 4. Verificación reproducible

```bash
node projects/sync4-architecture-2-0/src/generate-v895-c214-patches.cjs
node --test projects/sync4-architecture-2-0/tests/*.test.mjs projects/sync4-architecture-2-0/tests/*.test.cjs
```
