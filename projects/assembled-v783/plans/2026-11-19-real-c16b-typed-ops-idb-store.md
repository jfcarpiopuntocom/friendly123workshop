# PRECODE · PORT2 C16b-store · Almacén durable IndexedDB para el reconciliador `-ops` (`src/port2-typed-ops-idb-store.mjs`)

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios en Cloudflare/R2:** NINGUNO (100% local + CI GitHub).
- **Base:** `jfcarpiopuntocom/friendly-123` `origin/master@e64c657` (incluye `#795` C15, `#796` Belén CAS, `#797` deploy-gate, `#798` C16a reconciliador async, `#800` calidad `74.1/100`).
- **Colisión con #799, #801 y #802:** CERO (solo 3 archivos nuevos: `src/port2-typed-ops-idb-store.mjs`, `test/p0-c16b-typed-ops-idb-store.test.cjs`, `.github/workflows/qa-port2-real-c16b-typed-ops-idb-store.yml`).

## Problema que resuelve (prerrequisito inmediato de C16b en `src/yparty-piloto.js`)
En PR `#798`, Sol6 eliminó el fallback volátil en memoria de `createTypedOpsReconciler` (`src/port2-typed-ops-reconciler.mjs:51`): el reconciliador **exige** un almacén durable real `{ loadAll, save, remove }` cuyas promesas resuelvan **únicamente tras `tx.oncomplete`** de IndexedDB (si `save` rechaza o la transacción aborta, nunca se emite HTTP). Hoy ese adaptador IndexedDB todavía no existe en `src/`.

## Diseño Ponytail (`src/port2-typed-ops-idb-store.mjs`)
Siguiendo el patrón auditado de `src/pago-intento-idb.mjs`:
- `createTypedOpsIdbStore({ indexedDB, namespace })`:
  - Exige `indexedDB.open` y `namespace` SHA-256 64-hex (`/^[a-f0-9]{64}$/`) — jamás usa licencia en texto plano como clave.
  - DB `f123_port2_typed_ops_v1`, store `pending_ops`, `keyPath: 'key'` con clave canónica `JSON.stringify([namespace, opId])`.
  - **Transacciones estrictas:** cada operación resuelve **SOLO en `tx.oncomplete`**, rechaza en `tx.onabort` / `tx.onerror` / `req.onblocked`, y cierra `db.close()` en `finally`.
  - **`loadAll()`:** devuelve solo las entradas pertenecientes al `namespace` actual (aislamiento total entre tiendas en el mismo navegador).
  - **`save(entry)`:** valida `opId` válido, `sameDoLocked === true`, `command` objeto canónico cuyo `command.opId === entry.opId`, tamaño serializado `<= 32 KiB`, **bloquea cualquier campo secreto** (`pin`, `token`, `cap`, `authorization`, `password`, `secret`), y si ya existe un registro previo para `[namespace, opId]` verifica que el payload canónico de `command` sea idéntico (impide corrupción/sobrescritura de un `opId` en vuelo).
  - **`remove(opId)`:** elimina `[namespace, opId]` en transacción `readwrite` y resuelve solo en `tx.oncomplete`.

## Plan TDD (RED → GREEN → integración C15 + C16a + fake-indexeddb real)
1. **RED:** `test/p0-c16b-typed-ops-idb-store.test.cjs` falla antes de crear `src/port2-typed-ops-idb-store.mjs`.
2. **GREEN:**
   - Aislamiento estricto por `namespace` SHA-256 (negocio A nunca lee ni borra ops de negocio B).
   - Bloqueo de `sameDoLocked !== true`, secretos (`pin`/`token`/`cap`), payload oversize y sobrescritura de `command` para un `opId` ya guardado.
   - Integración real con `createTypedOpsReconciler` (`src/port2-typed-ops-reconciler.mjs`) + `fake-indexeddb`:
     - Persistencia **ANTES** del HTTP (`202` / timeout → cierre de Safari → nueva instancia del store + reconciliador → recupera `opId` exacto → reintenta mismo `opId` → `200 business-committed` → limpia IDB).
     - Aborto de transacción IDB en `save()` → **0 llamadas HTTP emitidas**.
     - `tx.oncomplete` real (nunca resuelve prematuramente en `req.onsuccess`).
3. **Métricas:** sin cambios en PORT (`81.5/100.0`), Calidad (`74.1/100.0`) ni GO (`0/6`) — deja listo el último ladrillo de `src/` antes de cablear C16b + C17b en `src/yparty-piloto.js` tras merge de `#799` y `#801`.
