# C86 · `frozen-ops-baseline.mjs` compatible con decimales históricos 1.0 (`abono.monto`) y llaves `undefined` (`USD 0,00`, cero colisión)

- **Branch / commit:** `port2/20261120-c86-frozen-ops-legacy-decimals` (`f9d651a` sobre `master@65d7a90`, cero colisión con `#885`, `#871`, `#868`, `#841`, runtime cliente, shell ni scores).
- **Causa raíz reproducida en TDD RED:** `docs/mock-backend.js:9385-9391` emite `OCSyncEmit("abono", { opId, clienteId, movimientoId, amountCents, monto })`, donde `monto` es dólares con decimales (ej. `12.5`) dentro del `Y.Map('eventos')` de `-ops`. En `cloudflare-yparty-worker/src/frozen-ops-baseline.mjs:14`, `canonical()` rechazaba cualquier número no entero con `'frozen ops baseline refused: unsafe economic amount'`, bloqueando `prepareFrozenImport`, `packFrozenR2Archive` y `Tienda.onStart` en historiales reales 1.0 de Firebase. Además, llaves opcionales con valor `undefined` en objetos disparaban `'unsupported economic payload type'`.
- **Arreglo Ponytail en `frozen-ops-baseline.mjs`:**
  - Aceptar `Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER`, normalizando `-0` → `'0'`; mantener rechazo estricto de `NaN`, `Infinity`, `-Infinity` y desbordes.
  - Omitir llaves con valor `undefined` en objetos planos (`Object.prototype`), manteniendo rechazo estricto de `undefined` dentro de arreglos y de objetos no planos (`Date`, etc.).
- **Verificación local RED → GREEN:**
  - RED: `1/2 PASS, 1/2 FAIL` (`frozen ops baseline refused: unsafe economic amount` en `abono.monto = 12.5`).
  - GREEN: **35/35 PASS** en `p0-c86`, `p0-c14`, `p0-gated4`, `p0-gated5`, `p0-gated7`, `p0-c68`, `p0-c71` (incluyendo Miniflare `Tienda` DO SQLite cold import + cold reopen) + `1/1` `p0-architecture-2-port-score.test.cjs`.
- **Advertencia crítica paralela documentada para Sol6 (sin editar todavía para no colisionar con `#868` / bundle `docs/vendor/yparty-piloto.min.js`):**
  - `cloudflare-yparty-worker/src/catalog-safe-projection.mjs` (`maybeText`) rechaza `""` y `null` en `sku`, `barcode`, `categoria`, `ubicacionId` y `shelf.tipo`, mientras `docs/mock-backend.js:216, 5704, 6000` guarda `sku: ""`, `barcode: ""` y campos opcionales vacíos/nulos en productos reales 1.0 de Firebase `-y`. Como `catalog-safe-projection.mjs` entra en `docs/vendor/yparty-piloto.min.js`, conviene abordarlo en `projectPublicCatalog` apenas aterrice `#868`.
