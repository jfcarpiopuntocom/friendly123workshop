# Reporte · PORT2 C16b-store · Almacén durable IndexedDB para el reconciliador `-ops`

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios Cloudflare/R2:** NINGUNO.
- **PR producto (`jfcarpiopuntocom/friendly-123`):** [#803](https://github.com/jfcarpiopuntocom/friendly-123/pull/803)
- **Rama:** `port2/20261119-c16b-typed-ops-idb-store` (3 archivos nuevos; única PR activa en cola, cero conflictos con `master@a9995a6`)
- **HEAD exacto verificado en CI:** `67e97a4`
- **PRECODE:** [`projects/assembled-v783/plans/2026-11-19-real-c16b-typed-ops-idb-store.md`](../plans/2026-11-19-real-c16b-typed-ops-idb-store.md) (`8c59852`)
- **Reserva Notion:** `41d1642b-67f3-810a-81f4-d22ee42620e9` (Liberada, lista para fusión de Sol6)

## Qué entrega (`src/port2-typed-ops-idb-store.mjs`)
- Adaptador IndexedDB durable (`createTypedOpsIdbStore({ indexedDB, namespace })`) exigido por `createTypedOpsReconciler` (`#798`):
  - Resuelve únicamente en `tx.oncomplete` (rechaza en `tx.onabort`, `tx.onerror`, `req.onblocked`, cierra `db.close()` en `finally`).
  - Aislamiento criptográfico por `namespace` SHA-256 `64-hex` (clave `[namespace, opId]`, nunca licencia en texto plano).
  - Inmutabilidad del comando canónico por `opId`, tope `32 KiB`, bloqueo recursivo de claves de secretos (`pin`, `token`, `cap`, `authorization`, `password`, `secret`).
- Integración real end-to-end contra `createTypedOpsReconciler` + `fake-indexeddb` real (`CI=true`): recuperación tras cierre de Safari durante `202` y bloqueo de HTTP con `0` llamadas si aborta la transacción IDB pre-send.

## Evidencia verificada (RED → GREEN → CI GitHub con `fake-indexeddb` real)
- **RED local:** `test/p0-c16b-typed-ops-idb-store.test.cjs` 0/6 antes de crear el módulo.
- **GREEN local:** 23/23 pruebas PASS (6/6 C16b-store + 17/17 C16a reconciliador) + `node --check` OK.
- **GitHub Actions CI en HEAD exacto `67e97a4`:** `c16b-store` PASS (`44588564765`, 41 s con `fake-indexeddb` real), `Synthetic sync`, `two-tab-sales`, `hex-boundary`, `integrated`, `mixed-shell`, `private-health`, `twice`, `Workers Builds`, `P0 Hotfix Gate`, `Release continuity gate` PASS (`CodeRabbit` skipping).

## Métricas
- **PORT 2.0:** `81.5/100.0` · **Calidad:** `74.1/100.0` · **GO comercial:** `0/6` (desbloquea el cableado final en `src/yparty-piloto.js` en el siguiente corte tras fusión de `#803`).
