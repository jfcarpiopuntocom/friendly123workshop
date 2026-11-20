# PORT2 C70 RED→GREEN · Continuidad vectorial Yjs en unión ocupada (`merge-frozen-into-existing.mjs`, PR #871)

- **Producto:** `jfcarpiopuntocom/friendly-123`, rama `port2/20261120-c69-union-vector-cold-reopen`, **PR #871** (rebasada sobre `master@df43c24` / C68 fusionada por Sol6).
- **Costo Cloudflare/R2:** **USD 0.00** (sin R2, sin deploys, sin flags QA encendidas; Sync3 intacto como 2.0).

## Causas raíz corregidas (Ponytail)
1. **Reapertura sin vector causal inmutable en unión ocupada (`f123_frozen_unions`):** `verifyDocumentAgainstCert` únicamente comparaba `union_sha256` cuando `rows.size === cert.union_events` y nunca verificaba el `StateVector` Yjs (`cert.vector_sha256`) contra el documento vivo en SQLite. Tras al menos una operación post-corte (`rows.size > cert.union_events`), un snapshot compactado o corrupto que re-emitiera claves `eventos` con un escritor impostor (perdiendo los relojes causales originales de `frozen` o `local`) obtenía `{ opened: true, already: true }`.
2. **Falso rechazo tras creación+borrado legítimo post-corte:** si una operación creada después del corte era borrada posteriormente con Yjs `delete()`, `rows.size` volvía a coincidir con `cert.union_events` pero el binario `Y.encodeStateAsUpdate(doc)` avanzaba legítimamente su hash, disparando un falso error `union SHA mismatch after SQL readback`.

## Cambio mínimo completo
- `cloudflare-yparty-worker/src/merge-frozen-into-existing.mjs`:
  - Crea e inserta en la misma transacción `transactionSync` la tabla inmutable `f123_frozen_union_vectors (frozen_vector, union_vector, union_vector_sha256)`.
  - Valida en cada reapertura (`verifyDocumentAgainstCert`): existencia no retro-rellenable de tabla/fila vectorial, `sha256Sync(frozen_vector) === cert.vector_sha256`, `sha256Sync(union_vector) === row.union_vector_sha256`, y dominancia estricta `union >= frozen` y `live >= union`.
  - Compara `union_sha256` estrictamente cuando `sha256Sync(liveVector) === union_vector_sha256` (compactación pura), permitiendo altas+bajas post-corte que preservan los relojes históricos.
- `cloudflare-yparty-worker/qa/p0-c69-union-vector-cold-reopen.test.mjs` + `.github/workflows/qa-port2-c69-union-vector-continuity.yml`.

## Evidencia RED → GREEN
- **RED (`a06aa62` antes del arreglo):** `1/6 PASS, 5/6 FAIL` en `node --test cloudflare-yparty-worker/qa/p0-c69-union-vector-cold-reopen.test.mjs` (reprodujo los 4 ataques vectoriales/legado + el falso rechazo en delete post-corte).
- **GREEN tras rebase en `origin/master@df43c24`:** **43/43 PASS, 0 FAIL** (`p0-c69-union-vector-cold-reopen`, `p0-gated4-merge-nonempty-sql`, `p0-gated5-merge-pitr-budget-sql`, `p0-gated4-real-onstart-workerd`, `p0-c66-frozen-vector-cold-reopen`, `p0-gate-d-real-onstart-workerd`, `p0-architecture-2-port-score`), más `node scripts/release-control.cjs validate origin/master` (`PASS 31 protected capabilities; identity consistent`) y `check-sw.sh` (`OK`).

## Cero colisiones
- Sin tocar `docs/vista-perchas.js` / `docs/sync-yjs.js` / shell (**PR #868**), `authoritative-business-sql.mjs` (**PR #869**), `docs/core/ledger.js` (**PR #841**), ni `docs/engineering/*`.
