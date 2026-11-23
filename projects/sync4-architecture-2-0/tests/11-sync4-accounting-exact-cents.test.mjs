import test from 'node:test';
import assert from 'node:assert/strict';
import { createSync4AccountingLedger } from '../src/sync4-accounting-ledger.mjs';
import { createSync4Engine, createJsonOutbox } from '../src/sync4-engine.mjs';

test('Micropasos 48-52: Sale, partial payments (0 stock change), return with exact cents, commissions parity & 100x replay', async () => {
  const ledger = createSync4AccountingLedger({
    initialProducts: [
      { id: 'ceramic-vase', stockActual: 15, unitPriceCents: 1999, artistCommissionBps: 2500 } // $19.99, 25% artist
    ]
  });

  const engine = createSync4Engine({
    licenseCode: 'F123-ACCT-4852-01',
    role: 'dueno',
    outbox: createJsonOutbox(),
    primaryA: { async send({ opId, payload }) { return ledger.applyOp(opId, payload); } }
  });

  // 1. Micropaso 49: Credit sale of 3 units ($19.99 x 3 = $59.97 = 5997 cents)
  const saleRes = await engine.submit({
    opId: 'sale-vase-001',
    payload: {
      kind: 'sale.record',
      productId: 'ceramic-vase',
      quantity: 3,
      amountCents: 5997,
      credit: true,
      clienteId: 'cli-hugo-01'
    }
  });
  assert.equal(saleRes.committed, true);
  assert.equal(saleRes.receipt.stockAfter, 12);
  assert.equal(saleRes.receipt.artistCents + saleRes.receipt.houseCents, 5997);

  // 2. Micropaso 50: Two partial customer payments ($20.00 + $39.97) -> ZERO stock decrement!
  const pay1 = await engine.submit({
    opId: 'customer-payment:pay-001',
    payload: { kind: 'credit.customer.payment.record', clienteId: 'cli-hugo-01', amountCents: 2000 }
  });
  assert.equal(pay1.committed, true);
  assert.equal(pay1.receipt.balanceCents, 3997);
  assert.equal(pay1.receipt.stockChanged, false);
  assert.equal(ledger.getProduct('ceramic-vase').stockActual, 12, 'Partial payment MUST NOT touch inventory stock');

  const pay2 = await engine.submit({
    opId: 'customer-payment:pay-002',
    payload: { kind: 'credit.customer.payment.record', clienteId: 'cli-hugo-01', amountCents: 3997 }
  });
  assert.equal(pay2.committed, true);
  assert.equal(pay2.receipt.balanceCents, 0);
  assert.equal(ledger.getProduct('ceramic-vase').stockActual, 12);

  // 3. Micropaso 51: Return 1 unit (-$19.99 = -1999 cents), stock 12 -> 13; over-return (>2 more) rejected!
  const ret1 = await engine.submit({
    opId: 'ret-vase-001',
    payload: { kind: 'sale.return', saleOpId: 'sale-vase-001', quantity: 1 }
  });
  assert.equal(ret1.committed, true);
  assert.equal(ret1.receipt.amountCents, -1999);
  assert.equal(ret1.receipt.stockAfter, 13);

  const overRet = await engine.submit({
    opId: 'ret-vase-over-002',
    payload: { kind: 'sale.return', saleOpId: 'sale-vase-001', quantity: 3 }
  });
  assert.equal(overRet.committed, false);
  assert.equal(overRet.conflict, true);
  assert.equal(overRet.reason, 'return-exceeds-sold-qty');

  // 4. Micropaso 52: Commissions, revenue, and stock parity (exact integer cents, zero float drift!)
  const s = ledger.summary();
  assert.equal(s.grossSalesCents, 5997);
  assert.equal(s.returnsCents, 1999);
  assert.equal(s.netRevenueCents, 3998);
  assert.equal(s.splitBalanced, true, 'artistCents + houseCents MUST equal netRevenueCents exactly');
  assert.equal(s.paymentsCollectedCents, 5997);
  assert.equal(s.stockByProduct['ceramic-vase'], 13);
});
