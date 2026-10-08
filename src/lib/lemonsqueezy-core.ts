// Pure Lemon Squeezy helpers with no environment access, so they can be unit tested.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PlanKey } from './plans';

export const LS_API = 'https://api.lemonsqueezy.com/v1';

export type CheckoutCustomer = {
  email: string;
  name?: string;
  eventName?: string;
  eventDate?: string;
  mobile?: string;
};

export type CheckoutInput = {
  plan: PlanKey;
  customer: CheckoutCustomer;
  /** Discount code to pre-apply, or empty for none. */
  discountCode: string;
  /** utm_* params from the landing page URL. */
  utm: Record<string, string>;
};

/** Custom data travels with the order and comes back in webhook meta.custom_data. Values must be strings. */
export function customData(input: CheckoutInput): Record<string, string> {
  const out: Record<string, string> = { plan: input.plan, source: 'kuha_ads_paid' };
  const c = input.customer;
  if (c.eventName) out.event_name = c.eventName;
  if (c.eventDate) out.event_date = c.eventDate;
  if (c.mobile) out.mobile = c.mobile;
  for (const [k, v] of Object.entries(input.utm)) out[k] = v;
  return out;
}

/** JSON:API body for POST /v1/checkouts. */
export function checkoutRequestBody(
  input: CheckoutInput,
  opts: { storeId: string; variantId: string; redirectUrl: string; testMode: boolean }
) {
  const c = input.customer;
  return {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: c.email,
          ...(c.name ? { name: c.name } : {}),
          ...(input.discountCode ? { discount_code: input.discountCode } : {}),
          custom: customData(input)
        },
        checkout_options: {
          embed: true,
          media: false,
          logo: true,
          desc: true,
          discount: true,
          button_color: '#C23E22'
        },
        product_options: {
          enabled_variants: [Number(opts.variantId)],
          redirect_url: opts.redirectUrl,
          receipt_button_text: 'Set up your album',
          receipt_link_url: 'https://www.kuha.app/dashboard'
        },
        // Unused checkout links stop working after a day.
        expires_at: new Date(Date.now() + 24 * 3600e3).toISOString(),
        ...(opts.testMode ? { test_mode: true } : {})
      },
      relationships: {
        store: { data: { type: 'stores', id: String(opts.storeId) } },
        variant: { data: { type: 'variants', id: String(opts.variantId) } }
      }
    }
  };
}

/**
 * Hosted buy-link fallback for when no API key is configured. Lemon Squeezy
 * accepts the same prefill fields as query parameters on /checkout/buy links.
 */
export function buyLinkUrl(baseUrl: string, input: CheckoutInput): string {
  const u = new URL(baseUrl);
  const c = input.customer;
  u.searchParams.set('embed', '1');
  u.searchParams.set('media', '0');
  u.searchParams.set('checkout[email]', c.email);
  if (c.name) u.searchParams.set('checkout[name]', c.name);
  if (input.discountCode) u.searchParams.set('checkout[discount_code]', input.discountCode);
  for (const [k, v] of Object.entries(customData(input))) u.searchParams.set(`checkout[custom][${k}]`, v);
  return u.toString();
}

/** Verifies the X-Signature header: hex HMAC-SHA256 of the raw request body. */
export function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function sign(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export type OrderEvent = {
  event: string;
  orderId: string;
  orderNumber: number | null;
  identifier: string | null;
  status: string;
  email: string;
  name: string;
  plan: PlanKey | null;
  variantId: string | null;
  totalCents: number;
  currency: string;
  discountCents: number;
  testMode: boolean;
  custom: Record<string, string>;
  createdAt: string | null;
};

type LsOrderWebhook = {
  meta?: { event_name?: string; test_mode?: boolean; custom_data?: Record<string, unknown> };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: {
      identifier?: string;
      order_number?: number;
      status?: string;
      user_email?: string;
      user_name?: string;
      total?: number;
      discount_total?: number;
      currency?: string;
      test_mode?: boolean;
      created_at?: string;
      first_order_item?: { variant_id?: number | string };
    };
  };
};

/** Normalises an order_* webhook into the payload forwarded to fulfilment. */
export function parseOrderEvent(
  payload: unknown,
  variants: Record<PlanKey, string>,
  eventHeader?: string | null
): OrderEvent | null {
  const p = payload as LsOrderWebhook;
  if (!p || !p.data || p.data.type !== 'orders' || !p.data.attributes) return null;
  const a = p.data.attributes;
  const custom: Record<string, string> = {};
  for (const [k, v] of Object.entries(p.meta?.custom_data || {})) if (v != null) custom[k] = String(v);
  const variantId = a.first_order_item?.variant_id != null ? String(a.first_order_item.variant_id) : null;
  const fromVariant = (Object.keys(variants) as PlanKey[]).find(k => variants[k] && variants[k] === variantId) || null;
  const fromCustom = (['vip', 'elite', 'luxxe'] as const).find(k => k === custom.plan) || null;
  return {
    event: p.meta?.event_name || eventHeader || 'unknown',
    orderId: String(p.data.id ?? ''),
    orderNumber: a.order_number ?? null,
    identifier: a.identifier ?? null,
    status: a.status || '',
    email: a.user_email || '',
    name: a.user_name || '',
    plan: fromVariant || fromCustom,
    variantId,
    totalCents: a.total ?? 0,
    currency: a.currency || '',
    discountCents: a.discount_total ?? 0,
    testMode: Boolean(a.test_mode ?? p.meta?.test_mode),
    custom,
    createdAt: a.created_at ?? null
  };
}
