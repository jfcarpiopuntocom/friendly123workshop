# PRECODE · Historial `-ops` 1.0 con montos decimales (`abono.monto`) y propiedades `undefined` en `frozen-ops-baseline.mjs`

**20-nov-2026 · Ecuador.** Para la **MISMA** `jfcarpiopuntocom/friendly-123` (PORT 1.0→2.0, Sync3 intacto).

## Causa raíz verificada en fuente

- En `docs/mock-backend.js:9385-9391`, la app 1.0 emite pagos de clientes por `OCSyncEmit("abono", { opId, clienteId, movimientoId, amountCents, monto })`, donde `monto` está en dólares decimales (p. ej. `12.5`) junto a `amountCents: 1250`.
- `docs/sync-realtime.js:1713-1717` + `docs/sync-yjs.js:3543/3562/3566` persisten ese evento en el `Y.Map('eventos')` de `-ops` en Firebase RTDB.
- `cloudflare-yparty-worker/src/frozen-ops-baseline.mjs:14` exige `!Number.isSafeInteger(value)` (`'unsafe economic amount'`), lo cual rechaza **todo** historial `-ops` real de Firebase que contenga cualquier `abono` con centavos u otra propiedad finita decimal (o propiedades opcionales `undefined`).
- Afecta toda la cadena Gate D: `prepareFrozenImport`, `packFrozenR2Archive` y `Tienda.onStart` (`verifyImportedOpsBaseline`).

## Corrección Ponytail

- Editar únicamente `cloudflare-yparty-worker/src/frozen-ops-baseline.mjs` (0 cambios de runtime cliente, bundle, `src/index.js`, `authoritative-business-sql.mjs`, scores ni R2; `USD 0,00`):
  - En `canonical()`: aceptar números finitos acotados (`Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER`), normalizando `-0` → `'0'` con `JSON.stringify`, y seguir rechazando `NaN`, `Infinity`, `-Infinity` y desbordes (`|value| > MAX_SAFE_INTEGER`) con `'unsafe economic amount'`.
  - En objetos planos: omitir llaves cuyo valor sea `undefined` (consistente con JSON) sin aceptar `undefined` en arreglos ni objetos con prototipo distinto de `Object.prototype`.
- TDD RED → GREEN con evento literal 1.0 `OCSyncEmit("abono")` en `Y.Map('eventos')` + `packFrozenR2Archive` + Miniflare DO SQLite (`installFrozenImport` + reopen `verifyImportedOpsBaseline`) + regresiones `p0-c14`, `p0-gated4`, `p0-gated5`, `p0-c68`, `p0-c71`.
