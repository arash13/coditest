import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCheckoutTotal } from '../src/checkout.js';

const MAX = Number.MAX_SAFE_INTEGER;

test('adding shipping to an empty cart works', () => {
  assert.deepEqual(
    calculateCheckoutTotal([], 0, 299),
    { subtotalCents: 0, discountCents: 0, shippingCents: 299, payableCents: 299 },
  );
});

test('zero discount adds the shipping charge to the merchandise amount', () => {
  assert.deepEqual(
    calculateCheckoutTotal([{ unitPriceCents: 1999, quantity: 2 }], 0, 200),
    { subtotalCents: 3998, discountCents: 0, shippingCents: 200, payableCents: 4198 },
  );
});

test('merchandise percentages retain half-up rounding', () => {
  assert.deepEqual(
    calculateCheckoutTotal([{ unitPriceCents: 105, quantity: 1 }], 10, 0),
    { subtotalCents: 105, discountCents: 11, shippingCents: 0, payableCents: 94 },
  );
});

test('omitted and undefined parameters use default zero', () => {
  const items = [{ unitPriceCents: 250, quantity: 3 }];
  const expected = {
    subtotalCents: 750, discountCents: 0, shippingCents: 0, payableCents: 750,
  };
  assert.deepEqual(calculateCheckoutTotal(items), expected);
  assert.deepEqual(calculateCheckoutTotal(items, undefined, undefined), expected);
});

test('full merchandise discount can reduce merchandise payable to zero', () => {
  assert.deepEqual(
    calculateCheckoutTotal([{ unitPriceCents: 105, quantity: 2 }], 100, 0),
    { subtotalCents: 210, discountCents: 210, shippingCents: 0, payableCents: 0 },
  );
});

test('invalid shipping inputs throw TypeError', () => {
  for (const value of [-1, 1.5, NaN, Infinity, MAX + 1, null, '20', 1n]) {
    assert.throws(() => calculateCheckoutTotal([], 0, value), TypeError);
  }
});

test('overflow of total payable remains a RangeError', () => {
  assert.throws(
    () => calculateCheckoutTotal([{ unitPriceCents: MAX, quantity: 1 }], 0, 1),
    RangeError,
  );
});

test('frozen input is preserved', () => {
  const item = Object.freeze({ unitPriceCents: 200, quantity: 2 });
  const items = Object.freeze([item]);
  assert.deepEqual(
    calculateCheckoutTotal(items, 0, 99),
    { subtotalCents: 400, discountCents: 0, shippingCents: 99, payableCents: 499 },
  );
  assert.deepEqual(items, [{ unitPriceCents: 200, quantity: 2 }]);
});

test('invalid merchandise and discount arguments reuse cart validation', () => {
  assert.throws(() => calculateCheckoutTotal(null), TypeError);
  assert.throws(() => calculateCheckoutTotal([{ unitPriceCents: 1, quantity: 0 }]), TypeError);
  assert.throws(() => calculateCheckoutTotal([], 101), TypeError);
});
