# Reporte real · PORT2 C21a · Coordinador de corte certificado y failback reversible 2.0 ↔ 1.0 entre dispositivos (Workerd 2-device + IndexedDB real)

- **Fecha:** 2026-11-19
- **PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/815
- **Rama:** `port2/20261119-c21a-cross-device-failback`
- **Commit exacto verificado:** `2ab607f` (sobre `master@8bdbf32`, 0 conflictos con `master` actual tras `#811`–`#814`)
- **Estado de merge:** 14/14 CI PASS, listo para auditoría y merge de Sol6 (0 colisiones; no fusionado por Antigravity).
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema resuelto (enfoque Ponytail)

Según `docs/engineering/architecture-2-port-score.md` (líneas 24 y 41) y `architecture-2-port-score.json` (`offline-failback / verified-cross-device-downpath`, `+2.0` pts):
- Al alternar entre el piloto 2.0 y el relay legacy 1.0 (por pérdida de red, conflicto C10 `1008` de escritor único o retorno manual), la tienda necesita dos garantías estrictas:
  1. **Cero ventas duplicadas entre motores (`same-do-only` fence):** ningún `opId` comercial que haya entrado a la cola durable IndexedDB 2.0 (`sameDoLocked: true`, ya sea `HTTP 202`, `503`, `timeout`, `quarantined` `409` o `committed` `200`) puede jamás enviarse por el outbox legacy 1.0 ni siquiera después de caer a `'failback-legacy-1.0'` o recargar el navegador; debe drenarse exclusivamente contra el **mismo Durable Object `-ops`**, mientras que operaciones nuevas creadas después del failback sí pueden fluir por legacy 1.0.
  2. **Liberación inmediata del lock `-cat` entre aparatos:** al caer a `'failback-legacy-1.0'`, el Dispositivo A debe cerrar al instante su sesión `-cat` para liberar el lock de escritor único C10 en el DO y permitir que el Dispositivo B (p. ej. iPhone Safari / PWA) tome el relevo de inmediato sin esperar expiración de socket.

## 2. Archivos entregados (`+1115` líneas, 4 archivos nuevos, 0 colisiones)

1. `src/port2-cross-device-failback.mjs`:
   - `createVerifiedCrossDeviceFailbackCoordinator({ store, reconciler, openCatalogSession, isVisible, onModeChange })`:
   - `activate20()`: exige `reconciler.ready()` (hidratación real desde IndexedDB C16b) **y** sesión `-cat` certificada con `frozenHead` válido y pestaña visible; si falla cualquiera, cierra recursos parciales y permanece en `'failback-legacy-1.0'`.
   - `submitCommercial(command)`, `isLatchedToSameDo(opId)`, `canDispatchOnLegacy(opId)`, `assertLegacyAllowed(opId)`: mantiene la valla permanente `same-do-only` respaldada por `store.loadAll()` + `reconciler.pending()` + `reconciler.quarantined()` + memoria de sesión de `opId`s confirmados en 2.0. Si IndexedDB falla o está corrupto, `canDispatchOnLegacy` falla cerrado (`false`) y `assertLegacyAllowed` rechaza con `code: 'durable-store-unavailable'`.
   - `failbackToLegacy(reason)` y `drainLatchedSameDo()`: cierra de inmediato la sesión `-cat` (liberando C10) y permite drenar en segundo plano los `opId`s ya enganchados contra el mismo DO `-ops`.
2. `test/p0-c21a-cross-device-failback.test.cjs`: **7/7 PASS** con `fake-indexeddb` real + `createTypedOpsIdbStore` (C16b) + `createTypedOpsReconciler` (C16a).
3. `cloudflare-yparty-worker/qa/p0-c21a-cross-device-failback-workerd.test.mjs`: prueba real en **Miniflare/Workerd con 2 dispositivos (`pc-opera-a` y `iphone-safari-b`) + `fake-indexeddb` + `authorityWorker` + `Tienda` DO SQLite**:
   - Dispositivo A activa 2.0 y toma el lock C10 en `-cat` (Dispositivo B es rechazado por C10 mientras A tiene el lock).
   - Dispositivo A envía `sale.record` (`op_c21a_cross_sale_01`), recibe `HTTP 202` y queda persistido en IndexedDB (`sameDoLocked: true`).
   - Dispositivo A ejecuta `failbackToLegacy`: libera el lock C10 de `-cat` y bloquea `op_c21a_cross_sale_01` para legacy 1.0 (`latched-same-do-only`), permitiendo un nuevo `op_c21a_fresh_legacy_02`.
   - Dispositivo B activa 2.0 de inmediato, toma el lock C10 liberado en `-cat` y publica un delta `product.upsert`.
   - Tras reinicio completo de Workerd con ejecutor de negocio activo (`0 R2`), Dispositivo A ejecuta `drainLatchedSameDo()` → `op_c21a_cross_sale_01` se confirma (`HTTP 200 business-committed`) en el mismo DO `-ops` con **1 sola venta aplicada en SQLite** (`stock: 5 → 4`, `cash: 500 → 2000`, `effects: 1`, `receipts: 1`).
4. `.github/workflows/qa-port2-real-c21a-cross-device-failback.yml`: gate dedicado `c21a`.

## 3. Evidencia verificada en el SHA exacto `2ab607f` — **14/14 CI PASS, 0 FAIL**

- `c21a`: **PASS** (31s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601806865/job/135834897156
- `yparty-worker`: **PASS** (1m56s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601806971/job/135834899203
- `P0 Hotfix Gate`: **PASS** (1m36s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601806676/job/135834898540
- `Release continuity gate`: **PASS** (1m13s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601806552/job/135834897094
- `Synthetic sync + real-browser contracts (no customer data)`: **PASS** (1m0s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601806857/job/135834900991
- `app`: **PASS** (51s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601806971/job/135834898375
- `gate-d-real-app`: **PASS** (38s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601807072/job/135834898468
- `two-tab-sales`: **PASS** (1m17s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601806994/job/135834898657
- `hex-boundary`: **PASS** (23s) — https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44601807089/job/135834898807
- `private-health`: **PASS** (16s)
- `twice`: **PASS** (16s)
- `integrated`: **PASS** (9s)
- `mixed-shell`: **PASS** (8s)
- `Workers Builds: friendly-123`: **PASS**

## 4. Estado de puntajes y costo

- En `master` actual (tras `#813` C22 y `#814` C20 score): **PORT `81.5/100.0`**, **Calidad `74.9/100.0` (`+0.3`)**, **GO `0/6`**.
- **Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.**
