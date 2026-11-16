// Dinero.js 2.0.2 source pinned to 76b969e519dc44675d4af898d25629995d0b16f2.
// Historical sale splits are never recalculated. Only an explicit caller uses this adapter.
import { dinero, multiply, transformScale, halfUp, toSnapshot } from './vendor/dinero-imported/bigint/index';
const USD = { code: 'USD', base: 10n, exponent: 2n };
function decimal(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new RangeError('Invalid money input');
  const [mantissa, power = '0'] = String(value).toLowerCase().split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  let amount = BigInt(whole + fraction), scale = fraction.length - Number(power);
  if (scale < 0) { amount *= 10n ** BigInt(-scale); scale = 0; }
  if (scale > 20) throw new RangeError('Unsafe money input');
  return { amount, scale: BigInt(scale) };
}
function cents(value) {
  const input = decimal(value);
  return toSnapshot(transformScale(dinero({ ...input, currency: USD }), 2n, halfUp)).amount;
}
window.F123MoneyImported = Object.freeze({
  percentage(base, percentage) {
    if (percentage > 100) throw new RangeError('Invalid percentage');
    const input = decimal(base), ratio = decimal(percentage);
    const commission = multiply(dinero({ ...input, currency: USD }), { amount: ratio.amount, scale: ratio.scale + 2n });
    const commissionCents = Number(toSnapshot(transformScale(commission, 2n, halfUp)).amount);
    const baseCents = Number(cents(base));
    if (!Number.isSafeInteger(commissionCents) || !Number.isSafeInteger(baseCents)) throw new RangeError('Unsafe money result');
    return { baseCents, commissionCents };
  }
});
