# PRECODE · PORT2 C21a · Coordinador de corte certificado y failback reversible 2.0 ↔ 1.0 entre dispositivos (`verified-cross-device-downpath`)

- **Fecha:** 2026-11-19
- **Rama propuesta:** `port2/20261119-c21a-cross-device-failback` (base `master@8bdbf32`)
- **Colisiones:** **CERO** (4 archivos nuevos; NO toca `src/port2-catalog-delta-writer.mjs` de `#811`, NO toca los archivos C20 de `#812` de Sol6, NO toca `docs/*` ni `src/yparty-piloto.js`).
- **Hito PORT 2.0 que aborda:** `offline-failback / verified-cross-device-downpath` (`+2.0` pts) y la barrera anti-duplicación de `typed-economics / production-business-dispatch` al alternar entre 2.0 y legacy 1.0.
- **Regla de costo JFC:** Gasto nuevo autorizado: `USD 0,00`; cambios Cloudflare/R2: ninguno.

---

## 1. Problema raíz (enfoque Ponytail)

En `docs/engineering/architecture-2-port-score.md` (líneas 24 y 41) y `architecture-2-port-score.json` (`verified-cross-device-downpath`, `+2.0` pts):
- Cuando una tienda activa el piloto 2.0 y ocurre una caída de red, conflicto de escritor único C10 (`1008`) o retorno explícito a 1.0 (`failback`), existen dos peligros críticos:
  1. **Doble cobro / duplicación de `opId` entre motores (2.0 → 1.0):** si una venta o abono ya se grabó en el almacén durable IndexedDB C16b (`sameDoLocked: true`) o tocó `-ops` (HTTP 202 / timeout / 5xx) y el aparato cae a legacy 1.0, el outbox legacy 1.0 **jamás** debe reenviar ese mismo `opId`; ese `opId` debe drenarse exclusivamente contra el **mismo Durable Object `-ops`** (`same-do-only`), mientras que operaciones nuevas posteriores al failback sí pueden fluir por legacy 1.0.
  2. **Bloqueo huérfano entre dispositivos en `-cat`:** al caer a legacy 1.0, el Dispositivo A debe cerrar de inmediato su sesión `-cat` (liberando el lock de escritor único C10 en el DO) para que el Dispositivo B (p. ej. iPhone Safari / PWA) pueda asumir o sincronizar sin esperar expiración de socket, sin perder ni duplicar `opId`s pendientes en el Dispositivo A.

## 2. Diseño mínimo completo (`src/port2-cross-device-failback.mjs`)

`createVerifiedCrossDeviceFailbackCoordinator({ store, reconciler, openCatalogSession, isVisible })`:
1. **Barrera de activación certificada (`activate20()`):**
   - Exige `await reconciler.ready()` (hidratación real desde IndexedDB C16b) **y** sesión de catálogo `-cat` certificada (`openCatalogSession()`, lector C12 o escritor C19a con `frozenHead` verificado).
   - Si falla la certificación o la pestaña está oculta antes de activar 2.0, cae limpiamente a `failback-legacy-1.0` cerrando cualquier recurso parcial.
2. **Valla anti-duplicación 2.0 ↔ 1.0 por `opId` (`submitCommercial(command)`, `canDispatchOnLegacy(opId)`, `assertLegacyAllowed(opId)`):**
   - Consulta tanto las entradas vivas del reconciliador (`pending()`, `quarantined()`) como el almacén durable IndexedDB (`await store.loadAll()`).
   - Todo `opId` que haya entrado a la cola durable 2.0 (`sameDoLocked: true`) queda **permanentemente vedado para legacy 1.0** (`canDispatchOnLegacy(opId) === false`; `assertLegacyAllowed(opId)` lanza error con `code: 'latched-same-do-only'`).
   - En modo `active-2.0`, `submitCommercial(command)` despacha por `reconciler.submit(command)`. Si devuelve `fallbackLegacy: true` (rechazo previo al envío sin latching en DO ni en IDB), autoriza legacy 1.0 para ese comando; si queda `reconcileRequired: true` / `retryTarget: 'same-do-only'`, mantiene el candado `same-do-only`.
3. **Failback reversible entre aparatos (`failbackToLegacy(reason)` + drenaje `drainLatchedSameDo()`):**
   - Cierra de inmediato la sesión `-cat` activa (liberando el lock C10 en el DO para que otro aparato de la tienda tome el relevo al instante).
   - Pasa el modo a `'failback-legacy-1.0'`, pero **conserva intacta la cola IndexedDB C16b** y permite drenar los `opId`s ya enganchados exclusivamente contra el mismo DO `-ops` (`drainLatchedSameDo()` → `reconciler.reconcileNow()`), sin permitir jamás que pasen al relay 1.0.

## 3. Archivos (4 archivos NUEVOS, 0 colisiones)

1. `src/port2-cross-device-failback.mjs`
2. `test/p0-c21a-cross-device-failback.test.cjs`
3. `cloudflare-yparty-worker/qa/p0-c21a-cross-device-failback-workerd.test.mjs`
4. `.github/workflows/qa-port2-real-c21a-cross-device-failback.yml`
