import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCheckoutTotal } from '../src/checkout.js';

const MAX = Number.MAX_SAFE_INTEGER;

test('checkout preserves the exact merchandise discount and adds shipping afterwards', () => {
  assert.deepEqual(
    calculateCheckoutTotal([{ unitPriceCents: 105, quantity: 1 }], 10, 200),
    { subtotalCents: 105, discountCents: 11, shippingCents: 200, payableCents: 294 },
  );
});

test('shipping is excluded from a full merchandise discount', () => {
  assert.deepEqual(
    calculateCheckoutTotal([{ unitPriceCents: 900, quantity: 2 }], 100, 299),
    { subtotalCents: 1800, discountCents: 1800, shippingCents: 299, payableCents: 299 },
  );
});

test('empty cart with shipping retains shipping', () => {
  assert.deepEqual(
    calculateCheckoutTotal([], 0, 299),
    { subtotalCents: 0, discountCents: 0, shippingCents: 299, payableCents: 299 },
  );
});

test('omitted, undefined and explicit zero parameters agree', () => {
  const items = [{ unitPriceCents: 1999, quantity: 2 }];
  const expected = {
    subtotalCents: 3998, discountCents: 0, shippingCents: 0, payableCents: 3998,
  };
  assert.deepEqual(calculateCheckoutTotal(items), expected);
  assert.deepEqual(calculateCheckoutTotal(items, undefined, undefined), expected);
  assert.deepEqual(calculateCheckoutTotal(items, 0, 0), expected);
});

test('multiple items receive a single half-up merchandise discount', () => {
  assert.deepEqual(
    calculateCheckoutTotal([
      { unitPriceCents: 1999, quantity: 2 },
      { unitPriceCents: 250, quantity: 3 },
    ], 10, 150),
    { subtotalCents: 4748, discountCents: 475, shippingCents: 150, payableCents: 4423 },
  );
});

test('invalid shipping is rejected with TypeError', () => {
  for (const shipping of [-1, 0.1, NaN, Infinity, -Infinity, MAX + 1, null, '20', 1n, {}, true]) {
    assert.throws(() => calculateCheckoutTotal([], 0, shipping), TypeError);
  }
});

test('payable overflow is rejected even for individually safe values', () => {
  assert.throws(
    () => calculateCheckoutTotal([{ unitPriceCents: MAX, quantity: 1 }], 0, 1),
    RangeError,
  );
  assert.deepEqual(
    calculateCheckoutTotal([{ unitPriceCents: MAX - 1, quantity: 1 }], 0, 1),
    { subtotalCents: MAX - 1, discountCents: 0, shippingCents: 1, payableCents: MAX },
  );
});

test('input arrays and entries are never mutated', () => {
  const entry = Object.freeze({ unitPriceCents: 105, quantity: 2 });
  const items = Object.freeze([entry]);
  assert.deepEqual(
    calculateCheckoutTotal(items, 10, 200),
    { subtotalCents: 210, discountCents: 21, shippingCents: 200, payableCents: 389 },
  );
  assert.deepEqual(items, [{ unitPriceCents: 105, quantity: 2 }]);
});

test('cart validation is unchanged', () => {
  assert.throws(() => calculateCheckoutTotal(null, 0, 0), TypeError);
  assert.throws(() => calculateCheckoutTotal([{ unitPriceCents: -1, quantity: 1 }], 0, 0), TypeError);
  assert.throws(() => calculateCheckoutTotal([], 101, 0), TypeError);
});
