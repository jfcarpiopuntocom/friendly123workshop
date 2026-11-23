# Auditoría completa de los 77 micropasos Sync4 sobre `v0.8.98` (`8d1519df`)

**Fecha verificada:** 2026-11-22 22:31 GMT-5 (Ecuador)  
**Base auditada:** `friendly-123` `master = estable = 8d1519df` (`v0.8.98`, `f123-shell-v898`, `golden434`), `fix/c218-pin-aparato-nuevo` (`94096dde`), y Workers Cloudflare desplegados (`friendly123-licencias` v`63e8617f` a las `22:21 GMT-5`; `friendly123-yparty-port2-canary-qa` v`bd21ee64` a las `21:25 GMT-5`).

---

## Resumen ejecutivo (77 micropasos)

- **Cerrados ya en `v0.8.98` (`8d1519df`) + Workers vivos:** **32 / 77**
- **Resueltos con parches listos y probados en `friendly123workshop` (`patches-v895/01..10`, 38/38 PASS + 19/19 `p0-central-pin-authority`):** **31 / 77**
- **Pendientes solo de ejecución operativa / despliegue / prueba física (Cloudflare multi-tienda + Safari/Opera real):** **14 / 77**

---

## Tramo 1 · 01–11 (Corte de alcance y RED)

| # | Estado | Evidencia en `v0.8.98` / Workshop |
|---|---|---|
| 01 | ✅ HECHO | `master = estable = 8d1519df` (`v0.8.98`) + Scope Lock publicado en Notion (`4211642b-67f3-8109-b543-c84fa13a0205`). |
| 02 | ✅ HECHO | Reglas S18/C16/C17 + `SPEC-SCOPE-LOCK-C213-C215.md` + `verify-scope-lock.cjs` congelados. |
| 03 | ✅ HECHO | Lista blanca cerrada por corte (`C220` Sync4 vs `C221` Rollout + ≤ 40 % boot). |
| 04 | ✅ HECHO | PR #1067 (`v0.8.94`), #1070 (`v0.8.95`), #1071 (`v0.8.96`), #1072 (`v0.8.97`), #1074 (`v0.8.98`) ya integradas sin duplicar. |
| 05 | ✅ HECHO | Pages verificado en vivo (móvil `390×664`, `0` errores consola, `50/50` HTTP 200, PIN horizontal, `reenganchar.html` 200). |
| 06 | ✅ HECHO | `commercialGo.certifiedGates: 0/6` inventariado sin inflación sintética. |
| 07 | ✅ HECHO | Puntos de corte exactos ubicados en `docs/sync-yjs.js:3434,3651`, `docs/sync-realtime.js:2110`, `src/yparty-piloto.js:152`. |
| 08 | ✅ HECHO | Retorno legacy en `src/yparty-piloto.js` preservado solo para `Y.Doc` privado; rutas públicas/tipadas separadas. |
| 09 | ✅ HECHO | Comprobado vía Cloudflare API: `friendly123-licencias` (`63e8617f`, `22:21 GMT-5`) y `friendly123-yparty-port2-canary-qa` (`bd21ee64`, 7 flags ON, `WS_ABRIR_SIN_HISTORIA=1`). |
| 10 | ✅ HECHO | Pruebas RED sobre `v0.8.90`, `v0.8.95`, `v0.8.97`, `v0.8.98` y `94096dde` (`tests/02,07,13`). |
| 11 | ✅ HECHO | Invariantes congeladas: cero datos privados en `-cat`/`-fotos`, único escritor, `opId` inmutable. |

## Tramo 2 · 12–22 (Contrato de negocio y persistencia)

| # | Estado | Evidencia / Parche que lo cierra |
|---|---|---|
| 12 | ✅ HECHO | `src/port2-typed-ops-idb-store.mjs` activo en `v0.8.98` con `tx.oncomplete` real. |
| 13 | ✅ HECHO | `opId` generado antes de emitir y conservado en reintentos (`port2-typed-ops-reconciler.mjs` + `sync4-engine.mjs`). |
| 14 | ✅ HECHO | Namespace IDB por `SHA-256(licencia + ':' + sala)` en `yparty-piloto.js:77` (sin texto plano). |
| 15 | ✅ HECHO | `crearDespachadorComercialTipado` unificado para `dueno`, `admin`, `empleado` en `v0.8.98`. |
| 16 | 🔧 PARCHE 06 + 08 | `v0.8.98` tiene C213, pero faltan: `admin` con hash local en `/team/verify` + bloqueo `403` + wipe al logout (**Parche 06**), y auto-registro `inst:<id>` tras PIN central verificado en aparato nuevo (**Parche 08**, 19/19 PASS en `p0-central-pin-authority.test.mjs`). |
| 17 | ✅ HECHO | Persistencia IDB previa al envío HTTP en `port2-typed-ops-reconciler.mjs`. |
| 18 | 🔧 PARCHE 02 | `v0.8.98` bloquea el corte en aparatos nuevos sin sala Sync3 (`!leerSala()`). **Parche 02** lo cierra conservando la guarda de único escritor y `tienePendientesDurables()`. |
| 19 | ✅ HECHO | Proyección pública allowlist (`catalog-safe-projection.mjs` + `sync4-catalog-bridge.mjs`). |
| 20 | ✅ HECHO | Rechazo de `pin`, `costo`, `margen`, `clientes`, `ventas`, `__proto__` probado (`tests/08,12`). |
| 21 | 🔧 PARCHE 01 | `v0.8.98` falla si `admin`/`empleado` abre `sala-vacia` sin raíces `'productos'`/`'ubicaciones'`. **Parche 01** lo corrige conservando `assertPublicCatalogTransportDoc`. |
| 22 | ✅ HECHO | Idempotencia `opId` probada con reenvío concurrente y tormenta 100× (`tests/01,09,10`). |

## Tramo 3 · 23–33 (Transporte principal Sync4-A real)

| # | Estado | Evidencia / Parche que lo cierra |
|---|---|---|
| 23 | 🔧 PARCHE 03 + 07 | **Parche 03** expone `rutaEfectiva` explícita sin exponer `Y.Doc` privado; **Parche 07** desbloquea la tienda piloto (`yparty: true`) que seguía frenada por `pendingStructs` legado. |
| 24 | ✅ HECHO | `AuthorizedYProvider` conectado únicamente a proyección pública `-cat` en `v0.8.98`. |
| 25 | ✅ HECHO | `ws-capability-issuer.mjs` + `ws-authority-client.js` desplegados y verificados con HMAC real (`tests/09,10,12`). |
| 26 | ✅ HECHO | CORS exacto `approvedHttpOrigin` + `Vary: Origin` para `https://jfcarpiopuntocom.github.io` en `cloudflare-yparty-worker/src/index.js`. |
| 27 | ✅ HECHO | `roomForLicense` y `frozenHead` validados por negocio en Worker y cliente. |
| 28 | ✅ HECHO | `publicarOpLocal` en `docs/sync-yjs.js:3678` despacha `sale.record`, `stock.adjust`, `credit.payment.record`, `credit.customer.payment.record`. |
| 29 | ✅ HECHO | Reconciliador preserva `opId` exacto de filas IDB recuperadas tras reinicio. |
| 30 | ✅ HECHO | Distingue HTTP `200 business-committed` de `202 stored-for-application` (`port2-typed-ops-client.mjs` + `sync4-engine.mjs`). |
| 31 | ✅ HECHO | Fotos SHA-256 con `fotos:write` (Dueño) / `fotos:read` (Equipo) verificado con HMAC real (`tests/12`). |
| 32 | 🔧 PARCHE 03 | **Parche 03** agrega `window.OCSync4Diagnostico()` y `diagnostico()` cero-PII en `src/yparty-piloto.js`. |
| 33 | 🚦 OPERATIVO | Repetir prueba viva en tienda piloto tras publicar `C220` (`v0.8.99`) comprobando `OCSync4Diagnostico().rutaEfectiva === "sync4-a-2.0"`. |

## Tramo 4 · 34–44 (Dos fallbacks B/C no bloqueantes)

| # | Estado | Evidencia / Parche que lo cierra |
|---|---|---|
| 34 | 🔧 ENGINE + PARCHE 09 | A principal + B/C sobre el mismo `opId` (`src/sync4-engine.mjs` + **Parche 09** retorno automático a A). |
| 35 | 🚦 OPERATIVO | Seleccionar/confirmar cuota de proveedor B disponible (Supabase reportado sin egress hasta 16-dic; no activar B sin salud/cuota). |
| 36 | 🔧 ENGINE | Circuit breaker 429/403/5xx + cuota diaria de bytes implementados y probados en `src/sync4-engine.mjs` (`tests/01`). |
| 37 | 🔧 PARCHE 09 | Conmutación no bloqueante sin recargar el documento + retorno programado (`15s`) a Sync4-A (**Parche 09**). |
| 38 | ✅ HECHO | Reutiliza el mismo `opId` y `canonicalPayload`; conflicto de payload falla cerrado (`OPID_PAYLOAD_CONFLICT`). |
| 39 | ✅ HECHO | Rechaza HTTP `202` / `connected` sin persistencia probada tanto en A como en B (`tests/10`). |
| 40 | 🔧 ENGINE + PARCHE 10 | BroadcastChannel / peer como refuerzo C no bloqueante + drenaje automático al despertar (**Parche 10**). |
| 41 | 🔧 PARCHE 10 | IDB durable cuando A, B y pares C caen + drenaje automático en `visibilitychange`/`online` (**Parche 10**). |
| 42 | ✅ HECHO | Colas aisladas por `SHA-256(licencia:sala)`; fallo de una tienda nunca bloquea a otra (`tests/10`). |
| 43 | 🔧 PARCHE 07 + 09 + 10 | Retorno B/C→A solo tras `drainLatchedSameDo()` + reintentos en `visibilitychange`/`online` (**Parches 07, 09, 10**). |
| 44 | ✅ HECHO | Simulación A y B caídos conservando cola local sin inventar ACK remoto (`tests/01,09,10`). |

## Tramo 5 · 45–55 (Integridad completa, cold-join y tiendas)

| # | Estado | Evidencia / Parche que lo cierra |
|---|---|---|
| 45 | ✅ HECHO | `open-existing-store.mjs` + `WS_ABRIR_SIN_HISTORIA=1` activos en Worker `bd21ee64`. |
| 46 | 🚦 OPERATIVO | Código multi-tienda (`licenciasAutorizadas` + `salasPiloto`) ya está en código; falta cargar la lista de licencias clientes en `TEAM_AUTHORITY_LICENSES`, `SALAS_PILOTO` y `docs/sync-rollout.json` con `--keep-vars` (Corte `C221`). |
| 47 | ✅ HECHO | Aislamiento estricto Shop Alpha vs Shop Beta probado con `ws-capability-issuer.mjs` real (`tests/10,12`). |
| 48–52 | 🔧 LEDGER (`tests/11`) | Libro exacto en centavos enteros (`src/sync4-accounting-ledger.mjs`): venta, 2 abonos parciales (`stockChanged: false`), devolución exacta + rechazo sobre-devolución, paridad artista+casa = neto (**tests/11 PASS**). *Brecha en `v0.8.98` Worker:* `typed-commercial-ledger.mjs` aún no tiene `sale.return` como comando tipado propio (las devoluciones disparan failback temporal en `sync-yjs.js:3694`; **Parche 09** evita que eso saque al aparato de Sync4-A para el resto del turno). |
| 53 | ✅ HECHO | Fotos SHA-256 sin fuga privada probadas con HMAC real (`tests/12`). |
| 54 | ✅ HECHO | `C217` (`v0.8.97`) + `reenganchar.html` conservan IDB/localStorage/PIN/sesión sin borrar negocio. |
| 55 | 🔧 PARCHE 01 + 02 + 08 | Unión fría de aparato nuevo (Dueño o Equipo) cerrada con **Parches 01, 02 y 08**. |

## Tramo 6 · 56–66 (Pruebas adversariales con navegadores y fallos)

| # | Estado | Evidencia |
|---|---|---|
| 56–61, 65 | ✅ HECHO (workshop) | Tormenta 100× replay, 202 + ACK perdido + reinicio frío, fallo A / A+B, failback con ACK parcial FIFO y aislamiento 2 tiendas (`tests/09,10,11,12`). |
| 62–64 | 🚦 OPERATIVO | Ejecución física / Playwright WebKit + Opera Air con **A→B→A × 2** tras publicar `C220` (`v0.8.99`). |
| 66 | 🔧 PARCHE 04 + 05 | Presupuesto JS arranque `v0.8.98` medido: `2,522,894 B` (`68.07 %`) → **Parches 04 + 05** lo bajan a **≤ 40 % (`≤ 1,482,506 B`)** con 44/44 scripts en `sw.js` `SHELL` y 100 % paridad ES en VM. |

## Tramo 7 · 67–77 (Sellado, publicación y GO/NO-GO)

| # | Estado | Qué falta exactamente |
|---|---|---|
| 67–74 | 🚦 2 CORTES FINALES | **Corte `C220` (`v0.8.99`):** aplicar `patches-v895/01, 02, 03, 06, 07, 08, 09, 10` sobre `8d1519df` + `94096dde`, recompilar `.min.js` + `version-manifest.json`, deploy `friendly123-licencias` y validar **A→B→A × 2** en tienda piloto.<br>**Corte `C221` (`v0.8.100`):** aplicar `patches-v895/04, 05` (≤ 40 % JS boot) + encender tiendas clientes (`TEAM_AUTHORITY_LICENSES`, `SALAS_PILOTO`, `docs/sync-rollout.json`). |
| 75–77 | 🚦 CIERRE JFC | Registrar aceptación física Safari iPhone + Opera Air, actualizar `commercialGo.certifiedGates` con evidencia real y emitir GO final. |
