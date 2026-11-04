import { calculateCartTotal } from './cart.js';

const MAX_SAFE_CENTS = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Calculate the checkout invoice in exact integer cents.
 */
export function calculateCheckoutTotal(items, discountPercent = 0, shippingCents = 0) {
  if (!Number.isSafeInteger(shippingCents) || shippingCents < 0) {
    throw new TypeError('shippingCents must be a non-negative safe integer');
  }

  const cart = calculateCartTotal(items, discountPercent);
  const shippingDiscount =
    (BigInt(shippingCents) * BigInt(discountPercent ?? 0) + 50n) / 100n;
  const payable =
    BigInt(cart.totalCents) + BigInt(shippingCents) - shippingDiscount;

  if (payable > MAX_SAFE_CENTS) {
    throw new RangeError('payableCents exceeds Number.MAX_SAFE_INTEGER');
  }

  return {
    subtotalCents: cart.subtotalCents,
    discountCents: cart.discountCents,
    shippingCents,
    payableCents: Number(payable),
  };
}
