// Plan content shared by the landing page, checkout and API routes.
// Prices here are fallbacks only: when the Lemon Squeezy API is configured,
// the live variant price replaces them (see getPlans in lemonsqueezy.ts).

export const PLAN_KEYS = ['vip', 'elite', 'luxxe'] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === 'string' && (PLAN_KEYS as readonly string[]).includes(v);
}

export type PlanContent = {
  key: PlanKey;
  name: string;
  /** Fallback price in centavos, used when the API is not configured. */
  fallbackPriceCents: number;
  /** Ticked lines on the pricing card. */
  lines: string[];
  /** One-line summary on the checkout order card. */
  meta: string;
  /** Hosted Lemon Squeezy buy link, used when the API key is not set. */
  buyUrl: string;
};

export const PLANS: Record<PlanKey, PlanContent> = {
  vip: {
    key: 'vip',
    name: 'VIP',
    fallbackPriceCents: 49900,
    lines: ['1,000 photos', '30-day upload window', '3-month access', 'Permanent memory page'],
    meta: '1,000 photos · 30-day upload window · 3-month access',
    buyUrl: 'https://store.kuha.app/checkout/buy/5227be72-2a09-4e9f-b093-e400ed1cdf92'
  },
  elite: {
    key: 'elite',
    name: 'Elite',
    fallbackPriceCents: 99900,
    lines: ['3,000 photos', '60-day upload window', '6-month access', 'Permanent memory page'],
    meta: '3,000 photos · 60-day upload window · 6-month access',
    buyUrl: 'https://store.kuha.app/checkout/buy/b5846da2-d3ac-479f-b828-780dc9882453'
  },
  luxxe: {
    key: 'luxxe',
    name: 'Luxxe',
    fallbackPriceCents: 199900,
    lines: [
      '5,000 photos',
      '100-day upload window',
      '12-month access',
      'Permanent memory page',
      'Video guestbook',
      'Seat finder',
      'Invitation + RSVP'
    ],
    meta: '5,000 photos · 100-day upload window · 12-month access',
    buyUrl: 'https://store.kuha.app/checkout/buy/c527f63e-f4e4-41fe-8c33-c79cbea99c12'
  }
};

/** Display order on the pricing section: the featured plan first. */
export const PRICING_ORDER: PlanKey[] = ['elite', 'vip', 'luxxe'];
export const FEATURED_PLAN: PlanKey = 'elite';

/** A plan as sent to the browser, with its resolved price. */
export type Plan = Pick<PlanContent, 'key' | 'name' | 'lines' | 'meta'> & { priceCents: number };
