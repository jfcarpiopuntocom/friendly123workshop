// Sync4 Exact-Cents Idempotent Commercial Accounting Ledger (Micropasos 48-52).
// Pure integer-cents arithmetic: zero floating-point drift, strict opId idempotency,
// single source of truth for inventory stock, revenue, partial payments, returns,
// and artist/house commissions.

function assertInt(n, name, { min = -1e12, max = 1e12 } = {}) {
  if (!Number.isSafeInteger(n) || n < min || n > max) {
    throw new TypeError(`Invalid integer ${name}: ${n}`);
  }
}

export function createSync4AccountingLedger({ initialProducts = [] } = {}) {
  const products = new Map();
  const appliedOps = new Map(); // opId -> canonical fact + receipt
  const receipts = [];
  const paymentsByCustomer = new Map(); // clienteId -> totalPaidCents
  const receivablesByCustomer = new Map(); // clienteId -> totalChargedCents
  const returnsBySale = new Map(); // saleOpId -> returnedQty

  for (const p of initialProducts) {
    assertInt(p.stockActual, 'stockActual', { min: 0 });
    assertInt(p.unitPriceCents, 'unitPriceCents', { min: 0 });
    products.set(p.id, {
      id: p.id,
      stockActual: p.stockActual,
      unitPriceCents: p.unitPriceCents,
      artistCommissionBps: p.artistCommissionBps || 0 // basis points: 2500 = 25.00%
    });
  }

  function applyOp(opId, payload) {
    if (typeof opId !== 'string' || !opId) throw new TypeError('opId required');
    const canonical = JSON.stringify(payload);
    if (appliedOps.has(opId)) {
      const prev = appliedOps.get(opId);
      if (prev.canonical !== canonical) {
        return { committed: false, conflict: true, reason: 'opid-payload-conflict', opId };
      }
      return { committed: true, duplicate: true, stage: 'business-committed', opId, receipt: prev.receipt };
    }

    switch (payload.kind) {
      case 'sale.record': {
        const prod = products.get(payload.productId);
        if (!prod) return { committed: false, conflict: true, reason: 'unknown-product', opId };
        assertInt(payload.quantity, 'quantity', { min: 1, max: 100_000 });
        assertInt(payload.amountCents, 'amountCents', { min: 0 });
        const expectedCents = prod.unitPriceCents * payload.quantity;
        if (payload.amountCents !== expectedCents) {
          return { committed: false, conflict: true, reason: 'amount-mismatch', opId };
        }
        const bps = payload.artistCommissionBps ?? prod.artistCommissionBps ?? 0;
        assertInt(bps, 'artistCommissionBps', { min: 0, max: 10_000 });
        // Exact integer cent split: artistShare + houseShare === amountCents ALWAYS!
        const artistCents = Math.round((payload.amountCents * bps) / 10_000);
        const houseCents = payload.amountCents - artistCents;
        prod.stockActual -= payload.quantity;

        if (payload.credit && payload.clienteId) {
          receivablesByCustomer.set(
            payload.clienteId,
            (receivablesByCustomer.get(payload.clienteId) || 0) + payload.amountCents
          );
        }

        const receipt = Object.freeze({
          opId,
          kind: 'sale.record',
          productId: prod.id,
          quantity: payload.quantity,
          amountCents: payload.amountCents,
          artistCents,
          houseCents,
          stockAfter: prod.stockActual
        });
        receipts.push(receipt);
        appliedOps.set(opId, { canonical, receipt });
        return { committed: true, duplicate: false, stage: 'business-committed', opId, receipt };
      }

      case 'credit.customer.payment.record': {
        if (!payload.clienteId) return { committed: false, conflict: true, reason: 'missing-clienteId', opId };
        assertInt(payload.amountCents, 'amountCents', { min: 1 });
        // Micropaso 50: partial payment updates money ONLY, ZERO stock decrement!
        const paid = (paymentsByCustomer.get(payload.clienteId) || 0) + payload.amountCents;
        paymentsByCustomer.set(payload.clienteId, paid);
        const charged = receivablesByCustomer.get(payload.clienteId) || 0;
        const receipt = Object.freeze({
          opId,
          kind: 'credit.customer.payment.record',
          clienteId: payload.clienteId,
          amountCents: payload.amountCents,
          balanceCents: charged - paid,
          stockChanged: false
        });
        receipts.push(receipt);
        appliedOps.set(opId, { canonical, receipt });
        return { committed: true, duplicate: false, stage: 'business-committed', opId, receipt };
      }

      case 'sale.return': {
        // Micropaso 51: compensatory fact with exact integer cents, rejects over-return!
        const origEntry = appliedOps.get(payload.saleOpId);
        if (!origEntry || origEntry.receipt.kind !== 'sale.record') {
          return { committed: false, conflict: true, reason: 'unknown-sale', opId };
        }
        const orig = origEntry.receipt;
        assertInt(payload.quantity, 'quantity', { min: 1 });
        const alreadyReturned = returnsBySale.get(payload.saleOpId) || 0;
        if (alreadyReturned + payload.quantity > orig.quantity) {
          return { committed: false, conflict: true, reason: 'return-exceeds-sold-qty', opId };
        }
        const prod = products.get(orig.productId);
        const unitCents = orig.amountCents / orig.quantity;
        const returnCents = Math.round(unitCents * payload.quantity);
        const artistReversalCents = Math.round((orig.artistCents * payload.quantity) / orig.quantity);
        const houseReversalCents = returnCents - artistReversalCents;

        prod.stockActual += payload.quantity;
        returnsBySale.set(payload.saleOpId, alreadyReturned + payload.quantity);

        const receipt = Object.freeze({
          opId,
          kind: 'sale.return',
          saleOpId: payload.saleOpId,
          productId: orig.productId,
          quantity: payload.quantity,
          amountCents: -returnCents,
          artistCents: -artistReversalCents,
          houseCents: -houseReversalCents,
          stockAfter: prod.stockActual
        });
        receipts.push(receipt);
        appliedOps.set(opId, { canonical, receipt });
        return { committed: true, duplicate: false, stage: 'business-committed', opId, receipt };
      }

      case 'stock.adjust': {
        const prod = products.get(payload.productId);
        if (!prod) return { committed: false, conflict: true, reason: 'unknown-product', opId };
        assertInt(payload.delta, 'delta');
        prod.stockActual += payload.delta;
        const receipt = Object.freeze({
          opId,
          kind: 'stock.adjust',
          productId: prod.id,
          delta: payload.delta,
          stockAfter: prod.stockActual
        });
        receipts.push(receipt);
        appliedOps.set(opId, { canonical, receipt });
        return { committed: true, duplicate: false, stage: 'business-committed', opId, receipt };
      }

      default:
        return { committed: false, conflict: true, reason: 'unsupported-kind', opId };
    }
  }

  function summary() {
    let grossSalesCents = 0;
    let returnsCents = 0;
    let artistCents = 0;
    let houseCents = 0;
    let paymentsCollectedCents = 0;
    for (const r of receipts) {
      if (r.kind === 'sale.record') {
        grossSalesCents += r.amountCents;
        artistCents += r.artistCents;
        houseCents += r.houseCents;
      } else if (r.kind === 'sale.return') {
        returnsCents += Math.abs(r.amountCents);
        artistCents += r.artistCents;
        houseCents += r.houseCents;
      } else if (r.kind === 'credit.customer.payment.record') {
        paymentsCollectedCents += r.amountCents;
      }
    }
    const netRevenueCents = grossSalesCents - returnsCents;
    return Object.freeze({
      grossSalesCents,
      returnsCents,
      netRevenueCents,
      artistCents,
      houseCents,
      splitBalanced: artistCents + houseCents === netRevenueCents,
      paymentsCollectedCents,
      uniqueOpsCount: appliedOps.size,
      stockByProduct: Object.fromEntries([...products.entries()].map(([id, p]) => [id, p.stockActual]))
    });
  }

  return Object.freeze({ applyOp, summary, getProduct: (id) => products.get(id) || null });
}
