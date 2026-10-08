import 'server-only';
import { lemon, lemonApiReady, siteUrl } from './config';
import { LS_API, buyLinkUrl, checkoutRequestBody, type CheckoutInput } from './lemonsqueezy-core';
import { PLANS, PLAN_KEYS, type Plan, type PlanKey } from './plans';

export class LemonSqueezyError extends Error {
  constructor(message: string, readonly status: number, readonly detail?: unknown) {
    super(message);
  }
}

async function lsFetch<T>(path: string, init: RequestInit & { next?: { revalidate?: number } } = {}): Promise<T> {
  const res = await fetch(LS_API + path, {
    ...init,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${lemon.apiKey}`,
      ...(init.headers || {})
    }
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const first = (body as { errors?: { detail?: string; title?: string }[] } | null)?.errors?.[0];
    throw new LemonSqueezyError(first?.detail || first?.title || `Lemon Squeezy API ${res.status}`, res.status, body);
  }
  return body as T;
}

type VariantResponse = { data: { id: string; attributes: { price: number; status?: string } } };

/**
 * Plans with live prices from Lemon Squeezy, so the page always matches checkout.
 * Cached for an hour; falls back to the prices in plans.ts if a lookup fails.
 */
export async function getPlans(): Promise<Record<PlanKey, Plan>> {
  const entries = await Promise.all(
    PLAN_KEYS.map(async (key): Promise<[PlanKey, Plan]> => {
      const c = PLANS[key];
      let priceCents = c.fallbackPriceCents;
      const variantId = lemon.variants[key];
      if (lemon.apiKey && variantId) {
        try {
          const v = await lsFetch<VariantResponse>(`/variants/${encodeURIComponent(variantId)}`, { next: { revalidate: 3600 } });
          if (Number.isFinite(v.data.attributes.price) && v.data.attributes.price > 0) priceCents = v.data.attributes.price;
        } catch (err) {
          console.error(`[lemonsqueezy] price lookup failed for ${key}; using fallback`, err);
        }
      }
      return [key, { key, name: c.name, lines: c.lines, meta: c.meta, priceCents }];
    })
  );
  return Object.fromEntries(entries) as Record<PlanKey, Plan>;
}

type CheckoutResponse = { data: { id: string; attributes: { url: string } } };

/** Creates a checkout and returns its URL (opened in the Lemon.js overlay). */
export async function createCheckoutUrl(input: CheckoutInput, priceCents: number): Promise<string> {
  const redirectUrl = `${siteUrl}/thank-you?plan=${input.plan}&value=${(priceCents / 100).toFixed(2)}`;

  if (!lemonApiReady() || !lemon.variants[input.plan]) {
    return buyLinkUrl(PLANS[input.plan].buyUrl, input);
  }

  const body = checkoutRequestBody(input, {
    storeId: lemon.storeId,
    variantId: lemon.variants[input.plan],
    redirectUrl,
    testMode: lemon.testMode
  });
  const res = await lsFetch<CheckoutResponse>('/checkouts', { method: 'POST', body: JSON.stringify(body), cache: 'no-store' });
  return res.data.attributes.url;
}
