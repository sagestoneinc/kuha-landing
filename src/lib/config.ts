import 'server-only';
import type { PlanKey } from './plans';
import type { Promo } from './pricing';

// Server-side configuration, read from environment variables.
// See .env.example for what each one does.

const env = (k: string) => (process.env[k] || '').trim();

export const siteUrl = (env('NEXT_PUBLIC_SITE_URL') || 'https://www.kuha.app').replace(/\/+$/, '');

export function getPromo(): Promo {
  const endsAt = Date.parse(env('PROMO_ENDS_AT') || '2026-10-31T23:59:59+08:00');
  const percent = Number(env('PROMO_PERCENT') || 20);
  return {
    code: process.env.PROMO_CODE === undefined ? 'KUHAFIRST20' : env('PROMO_CODE'),
    percent: Number.isFinite(percent) ? percent : 0,
    endsAt: Number.isFinite(endsAt) ? endsAt : 0,
    endsLabel: env('PROMO_ENDS_LABEL') || 'Oct 31'
  };
}

export const lemon = {
  apiKey: env('LEMONSQUEEZY_API_KEY'),
  storeId: env('LEMONSQUEEZY_STORE_ID'),
  webhookSecret: env('LEMONSQUEEZY_WEBHOOK_SECRET'),
  testMode: env('LEMONSQUEEZY_TEST_MODE') === 'true',
  variants: {
    vip: env('LEMONSQUEEZY_VARIANT_VIP'),
    elite: env('LEMONSQUEEZY_VARIANT_ELITE'),
    luxxe: env('LEMONSQUEEZY_VARIANT_LUXXE')
  } as Record<PlanKey, string>
};

/** True when checkouts can be created through the API (otherwise hosted buy links are used). */
export function lemonApiReady(): boolean {
  return Boolean(lemon.apiKey && lemon.storeId);
}

export const fulfilment = {
  url: env('FULFILLMENT_WEBHOOK_URL'),
  secret: env('FULFILLMENT_WEBHOOK_SECRET')
};
