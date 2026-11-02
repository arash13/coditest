const MAX_SAFE_CENTS = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Calculate a cart total in integer cents without floating-point rounding loss.
 * @param {{ unitPriceCents: number, quantity: number }[]} items
 * @param {number} [discountPercent=0]
 * @returns {{ subtotalCents: number, discountCents: number, totalCents: number }}
 */
export function calculateCartTotal(items, discountPercent = 0) {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }

  if (
    !Number.isSafeInteger(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    throw new TypeError('discountPercent must be an integer from 0 to 100');
  }

  let subtotal = 0n;

  for (const item of items) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new TypeError('each item must be an object');
    }

    const { unitPriceCents, quantity } = item;
    if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
      throw new TypeError('unitPriceCents must be a non-negative safe integer');
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new TypeError('quantity must be a positive safe integer');
    }

    subtotal += BigInt(unitPriceCents) * BigInt(quantity);
  }

  if (subtotal > MAX_SAFE_CENTS) {
    throw new RangeError('subtotalCents exceeds Number.MAX_SAFE_INTEGER');
  }

  // Adding 50 before division by 100 implements half-up rounding in cents.
  const discount = (subtotal * BigInt(discountPercent) + 50n) / 100n;
  const total = subtotal - discount;

  return {
    subtotalCents: Number(subtotal),
    discountCents: Number(discount),
    totalCents: Number(total),
  };
}
