# PORT2 C71 RED→GREEN · Cotejo criptográfico SHA-256 entre `f123_business_effects`, `typed_commercial_ops` y `typed_commercial_payloads`

- **Producto:** `jfcarpiopuntocom/friendly-123`, rama `port2/20261120-c71-economic-payload-cryptographic-audit` (sobre `master@8b83e1c` / C69 `79,4`), **PR #873** (SHA GREEN `7a8df90`).
- **Costo Cloudflare/R2:** **USD 0.00**, flags QA OFF, Sync3 intacto como 2.0.

## Causa raíz cerrada (aviso previo de Sol6 en C69)
Sol6 señaló en [2026-11-20-c69-business-quality-79_4-source-audit-ci-cloudflare.md](2026-11-20-c69-business-quality-79_4-source-audit-ci-cloudflare.md) que `reconcileCertifiedBusinessReadback` (C68E) verificaba sumas sobre `f123_business_effects`, pero faltaba el cotejo criptográfico contra `typed_commercial_ops`/`typed_commercial_payloads`, así como la ley de precio unitario en efectos de venta (`q < 0 && c > 0`).

## Cambio mínimo completo (`cloudflare-yparty-worker/src/authoritative-business-sql.mjs`)
1. Conserva exactamente la firma y tokens auditados por C69 en `scripts/architecture-2-port-score.cjs`.
2. Exige `BigInt(c) === BigInt(-q) * priceMap.get(product_id)` en toda venta (`q < 0 && c > 0`).
3. Cuando existen tablas del ledger tipado (`typed_commercial_ops` / `typed_commercial_payloads`, camino real de DO `-ops`), falla cerrado si falta una de ellas y verifica síncronamente vía `Sha256Sync`:
   - `sha256(payload_json) === payload_hash`
   - `receipt.stage === 'business-committed'`, `receipt.receiptId === payload_hash.slice(0, 24)`
   - serialización canónica idéntica y equivalencia semántica (`sale.record`, `stock.adjust`, `credit.payment.record`) contra `f123_business_effects`
   - cero recibos `business-committed` huérfanos sin fila de efecto (preservando intents `stored-for-application` HTTP 202 pendientes de promoción).
4. Incluye `typed_commercial_payloads` y `f123_frozen_unions` en el guard de tablas no vacías de `installBusinessBaseline`.

## Evidencia RED → GREEN
- **RED (`c88f47a`):** `1/7 PASS, 6/7 FAIL` en `cloudflare-yparty-worker/qa/p0-c71-economic-payload-cryptographic-audit.test.mjs`.
- **GREEN (`7a8df90`):** **21/21 PASS** (`p0-c71` 7/7 + `p0-c68` 8/8 + `p0-gate-a-typed-payment-sql` + `p0-gate-a-business-sql-workerd` + `p0-gate-a-real-router-business` + `p0-architecture-2-port-score`), `release-control` (`31` PASS) y `check-sw.sh` (`OK`).
