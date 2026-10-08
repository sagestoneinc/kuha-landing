import { describe, expect, it } from 'vitest';
import { buyLinkUrl, checkoutRequestBody, parseOrderEvent, sign, verifySignature, type CheckoutInput } from '../src/lib/lemonsqueezy-core';

const input: CheckoutInput = {
  plan: 'elite',
  customer: { email: 'bea@example.com', name: 'Bea Santos', eventName: "Bea's 18th", eventDate: '2026-12-12', mobile: '09171234567' },
  discountCode: 'KUHAFIRST20',
  utm: { utm_source: 'facebook', utm_campaign: 'oct' }
};

describe('checkoutRequestBody', () => {
  const body = checkoutRequestBody(input, { storeId: '123', variantId: '456', redirectUrl: 'https://x.test/thank-you', testMode: true });

  it('targets the store and variant', () => {
    expect(body.data.type).toBe('checkouts');
    expect(body.data.relationships.store.data).toEqual({ type: 'stores', id: '123' });
    expect(body.data.relationships.variant.data).toEqual({ type: 'variants', id: '456' });
    expect(body.data.attributes.product_options.enabled_variants).toEqual([456]);
  });

  it('prefills the buyer, discount and custom data', () => {
    const cd = body.data.attributes.checkout_data;
    expect(cd.email).toBe('bea@example.com');
    expect(cd.name).toBe('Bea Santos');
    expect(cd.discount_code).toBe('KUHAFIRST20');
    expect(cd.custom).toMatchObject({ plan: 'elite', event_name: "Bea's 18th", event_date: '2026-12-12', utm_source: 'facebook' });
    expect(Object.values(cd.custom).every(v => typeof v === 'string')).toBe(true);
  });

  it('enables the overlay and test mode', () => {
    expect(body.data.attributes.checkout_options.embed).toBe(true);
    expect(body.data.attributes.test_mode).toBe(true);
  });

  it('omits the discount when the promo is off', () => {
    const b = checkoutRequestBody({ ...input, discountCode: '' }, { storeId: '1', variantId: '2', redirectUrl: 'https://x.test', testMode: false });
    expect('discount_code' in b.data.attributes.checkout_data).toBe(false);
    expect('test_mode' in b.data.attributes).toBe(false);
  });
});

describe('buyLinkUrl', () => {
  it('adds prefill query params to the hosted link', () => {
    const u = new URL(buyLinkUrl('https://store.kuha.app/checkout/buy/abc', input));
    expect(u.searchParams.get('embed')).toBe('1');
    expect(u.searchParams.get('checkout[email]')).toBe('bea@example.com');
    expect(u.searchParams.get('checkout[discount_code]')).toBe('KUHAFIRST20');
    expect(u.searchParams.get('checkout[custom][event_name]')).toBe("Bea's 18th");
  });
});

describe('verifySignature', () => {
  const raw = JSON.stringify({ hello: 'world' });
  it('accepts a valid signature', () => {
    expect(verifySignature(raw, sign(raw, 's3cret'), 's3cret')).toBe(true);
  });
  it('rejects a wrong secret, tampered body or missing header', () => {
    expect(verifySignature(raw, sign(raw, 'other'), 's3cret')).toBe(false);
    expect(verifySignature(raw + ' ', sign(raw, 's3cret'), 's3cret')).toBe(false);
    expect(verifySignature(raw, null, 's3cret')).toBe(false);
    expect(verifySignature(raw, 'not-hex', 's3cret')).toBe(false);
  });
});

describe('parseOrderEvent', () => {
  const payload = {
    meta: { event_name: 'order_created', custom_data: { plan: 'elite', event_name: "Bea's 18th" } },
    data: {
      type: 'orders',
      id: '999',
      attributes: {
        identifier: 'uuid-1',
        order_number: 42,
        status: 'paid',
        user_email: 'bea@example.com',
        user_name: 'Bea Santos',
        total: 79920,
        discount_total: 19980,
        currency: 'PHP',
        test_mode: false,
        created_at: '2026-10-08T00:00:00Z',
        first_order_item: { variant_id: 456 }
      }
    }
  };

  it('maps the variant to a plan', () => {
    const o = parseOrderEvent(payload, { vip: '111', elite: '456', luxxe: '789' });
    expect(o).toMatchObject({ event: 'order_created', orderId: '999', plan: 'elite', email: 'bea@example.com', totalCents: 79920, currency: 'PHP' });
    expect(o?.custom.event_name).toBe("Bea's 18th");
  });

  it('falls back to the plan in custom data', () => {
    expect(parseOrderEvent(payload, { vip: '', elite: '', luxxe: '' })?.plan).toBe('elite');
  });

  it('ignores non-order payloads', () => {
    expect(parseOrderEvent({ data: { type: 'subscriptions' } }, { vip: '', elite: '', luxxe: '' })).toBeNull();
  });
});
