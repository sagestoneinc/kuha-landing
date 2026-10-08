import { describe, expect, it } from 'vitest';
import { countdown, discounted, formatPeso, isPromoLive, priceFor, type Promo } from '../src/lib/pricing';

const promo: Promo = { code: 'KUHAFIRST20', percent: 20, endsAt: Date.parse('2026-10-31T23:59:59+08:00'), endsLabel: 'Oct 31' };
const before = Date.parse('2026-10-08T12:00:00+08:00');
const after = Date.parse('2026-11-01T00:00:00+08:00');

describe('promo', () => {
  it('is live until the deadline', () => {
    expect(isPromoLive(promo, before)).toBe(true);
    expect(isPromoLive(promo, after)).toBe(false);
  });
  it('is off without a code', () => {
    expect(isPromoLive({ ...promo, code: '' }, before)).toBe(false);
  });
  it('applies the discount only while live', () => {
    expect(priceFor(99900, promo, before)).toBe(79920);
    expect(priceFor(99900, promo, after)).toBe(99900);
  });
});

describe('discounted', () => {
  it('rounds to whole centavos', () => {
    expect(discounted(49900, 20)).toBe(39920);
    expect(discounted(199900, 20)).toBe(159920);
    expect(discounted(1999, 15)).toBe(1699);
  });
});

describe('formatPeso', () => {
  it('drops .00 but keeps real centavos', () => {
    expect(formatPeso(99900)).toBe('₱999');
    expect(formatPeso(199900)).toBe('₱1,999');
    expect(formatPeso(79920)).toBe('₱799.20');
  });
});

describe('countdown', () => {
  it('formats days, hours and minutes', () => {
    expect(countdown(1000 * 60 * (60 * 26 + 5), 0)).toBe('1d 02h 05m');
    expect(countdown(0, 1000)).toBe('00h 00m');
  });
});
