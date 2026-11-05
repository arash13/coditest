import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateCartTotal } from '../src/cart.js';

const MAX = Number.MAX_SAFE_INTEGER;

test('empty cart returns exact zero values with the specified shape', () => {
  const result = calculateCartTotal([], 0);
  assert.deepEqual(result, {
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
  });
  assert.deepEqual(Object.keys(result), [
    'subtotalCents',
    'discountCents',
    'totalCents',
  ]);
  assert.ok(Object.values(result).every(Number.isSafeInteger));
});

test('multiple line items and a 10% discount match the acceptance example', () => {
  assert.deepEqual(
    calculateCartTotal([
      { unitPriceCents: 1999, quantity: 2 },
      { unitPriceCents: 250, quantity: 3 },
    ], 10),
    { subtotalCents: 4748, discountCents: 475, totalCents: 4273 },
  );
});

test('discount rounds half up to the nearest cent', () => {
  assert.deepEqual(calculateCartTotal([{ unitPriceCents: 105, quantity: 1 }], 10), {
    subtotalCents: 105,
    discountCents: 11,
    totalCents: 94,
  });
  assert.deepEqual(calculateCartTotal([{ unitPriceCents: 104, quantity: 1 }], 10), {
    subtotalCents: 104,
    discountCents: 10,
    totalCents: 94,
  });
  assert.deepEqual(calculateCartTotal([{ unitPriceCents: 1, quantity: 1 }], 50), {
    subtotalCents: 1,
    discountCents: 1,
    totalCents: 0,
  });
});

test('discount is applied once to the entire subtotal, not per item', () => {
  assert.deepEqual(
    calculateCartTotal([
      { unitPriceCents: 1, quantity: 1 },
      { unitPriceCents: 1, quantity: 2 },
    ], 50),
    { subtotalCents: 3, discountCents: 2, totalCents: 1 },
  );
});

test('the default and 0% discounts agree; 100% removes the total', () => {
  const items = [{ unitPriceCents: 987, quantity: 2 }];
  const zero = { subtotalCents: 1974, discountCents: 0, totalCents: 1974 };
  assert.deepEqual(calculateCartTotal(items), zero);
  assert.deepEqual(calculateCartTotal(items, undefined), zero);
  assert.deepEqual(calculateCartTotal(items, 0), zero);
  assert.deepEqual(calculateCartTotal(items, 100), {
    subtotalCents: 1974,
    discountCents: 1974,
    totalCents: 0,
  });
  assert.deepEqual(calculateCartTotal([], 100), {
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
  });
});

test('safe-integer boundary is calculated exactly despite large intermediates', () => {
  assert.deepEqual(calculateCartTotal([{ unitPriceCents: MAX, quantity: 1 }], 50), {
    subtotalCents: MAX,
    discountCents: 4503599627370496,
    totalCents: 4503599627370495,
  });
  assert.deepEqual(
    calculateCartTotal([{ unitPriceCents: MAX - 1, quantity: 1 }], 1),
    {
      subtotalCents: MAX - 1,
      discountCents: 90071992547410,
      totalCents: 8917127262193580,
    },
  );
});

test('the function preserves frozen input arrays and line objects', () => {
  const first = Object.freeze({ unitPriceCents: 105, quantity: 2 });
  const second = Object.freeze({ unitPriceCents: 0, quantity: 5 });
  const items = Object.freeze([first, second]);
  assert.deepEqual(calculateCartTotal(items, 10), {
    subtotalCents: 210,
    discountCents: 21,
    totalCents: 189,
  });
  assert.deepEqual(items, [
    { unitPriceCents: 105, quantity: 2 },
    { unitPriceCents: 0, quantity: 5 },
  ]);
});

test('invalid items containers always throw TypeError', () => {
  for (const items of [undefined, null, 3, 'items', {}, { length: 0 }, true, 1n]) {
    assert.throws(() => calculateCartTotal(items), TypeError);
  }
});

test('non-object and incomplete line items always throw TypeError', () => {
  const invalid = [
    undefined, null, 3, 'item', true, [],
    {}, { unitPriceCents: 1 }, { quantity: 1 },
    { unitPriceCents: undefined, quantity: 1 },
    { unitPriceCents: 1, quantity: undefined },
  ];
  for (const item of invalid) {
    assert.throws(() => calculateCartTotal([item]), TypeError);
  }
  assert.throws(() => calculateCartTotal(new Array(1)), TypeError);
});

test('invalid unit prices always throw TypeError', () => {
  const invalid = [
    -1, 0.1, NaN, Infinity, -Infinity,
    MAX + 1, '100', null, undefined, 1n, {},
  ];
  for (const unitPriceCents of invalid) {
    assert.throws(
      () => calculateCartTotal([{ unitPriceCents, quantity: 1 }]),
      TypeError,
    );
  }
  assert.deepEqual(calculateCartTotal([{ unitPriceCents: 0, quantity: 1 }]), {
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
  });
});

test('invalid quantities always throw TypeError', () => {
  const invalid = [
    -1, 0, 0.5, NaN, Infinity, -Infinity,
    MAX + 1, '2', null, undefined, 2n, {},
  ];
  for (const quantity of invalid) {
    assert.throws(
      () => calculateCartTotal([{ unitPriceCents: 1, quantity }]),
      TypeError,
    );
  }
});

test('invalid discount percentages always throw TypeError, including empty carts', () => {
  const invalid = [
    -1, 101, 0.5, 99.9, NaN, Infinity, -Infinity,
    MAX + 1, '10', null, true, 10n, {},
  ];
  for (const discountPercent of invalid) {
    assert.throws(() => calculateCartTotal([], discountPercent), TypeError);
  }
});

test('safe-integer overflow in a line or the sum throws RangeError', () => {
  const overflowing = [
    [{ unitPriceCents: MAX, quantity: 2 }],
    [{ unitPriceCents: MAX, quantity: MAX }],
    [{ unitPriceCents: MAX, quantity: 1 }, { unitPriceCents: 1, quantity: 1 }],
    [{ unitPriceCents: MAX - 1, quantity: 1 }, { unitPriceCents: 2, quantity: 1 }],
  ];
  for (const items of overflowing) {
    for (const discountPercent of [0, 100]) {
      assert.throws(
        () => calculateCartTotal(items, discountPercent),
        RangeError,
      );
    }
  }
});
