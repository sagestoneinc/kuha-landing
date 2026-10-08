// Pure pricing helpers, safe to import on the server and in the browser.

export type Promo = {
  /** Discount code as set up in Lemon Squeezy. Empty string = no promo. */
  code: string;
  percent: number;
  /** End of the promo, epoch milliseconds. */
  endsAt: number;
  /** Short human label, e.g. "Oct 31". */
  endsLabel: string;
};

export function isPromoLive(promo: Promo, now: number = Date.now()): boolean {
  return Boolean(promo.code) && promo.percent > 0 && now < promo.endsAt;
}

/** Same rounding Lemon Squeezy uses for percentage discounts (whole centavos). */
export function discounted(priceCents: number, percent: number): number {
  return Math.round((priceCents * (100 - percent)) / 100);
}

export function priceFor(priceCents: number, promo: Promo, now: number = Date.now()): number {
  return isPromoLive(promo, now) ? discounted(priceCents, promo.percent) : priceCents;
}

/** ₱799 for whole pesos, ₱799.20 otherwise, so the page never rounds away what checkout charges. */
export function formatPeso(cents: number): string {
  const whole = cents % 100 === 0;
  return (
    '₱' +
    (cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2
    })
  );
}

/** "5d 04h 12m" until the deadline. */
export function countdown(endsAt: number, now: number = Date.now()): string {
  const left = Math.max(0, endsAt - now);
  const d = Math.floor(left / 864e5);
  const h = Math.floor(left / 36e5) % 24;
  const m = Math.floor(left / 6e4) % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return (d ? d + 'd ' : '') + p(h) + 'h ' + p(m) + 'm';
}
