import { calculateCartTotal } from './cart.js';

const MAX_SAFE_CENTS = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Return merchandise subtotal/discount, shipping, and final payable cents.
 * A merchandise discount never reduces shipping.
 */
export function calculateCheckoutTotal(items, discountPercent = 0, shippingCents = 0) {
  if (!Number.isSafeInteger(shippingCents) || shippingCents < 0) {
    throw new TypeError('shippingCents must be a non-negative safe integer');
  }

  const cart = calculateCartTotal(items, discountPercent);
  const payable = BigInt(cart.totalCents) + BigInt(shippingCents);

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
