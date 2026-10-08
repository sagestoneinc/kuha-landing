import { NextResponse } from 'next/server';
import { getPromo } from '@/lib/config';
import { LemonSqueezyError, createCheckoutUrl, getPlans } from '@/lib/lemonsqueezy';
import { isPlanKey } from '@/lib/plans';
import { isPromoLive, priceFor } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, '').trim().slice(0, max) : '');

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const plan = body.plan;
  if (!isPlanKey(plan)) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });

  const email = clean(body.email, 254).toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.', field: 'email' }, { status: 422 });
  }
  const eventDate = clean(body.eventDate, 10);

  const utm: Record<string, string> = {};
  if (body.utm && typeof body.utm === 'object') {
    for (const [k, v] of Object.entries(body.utm as Record<string, unknown>).slice(0, 10)) {
      if (/^utm_[a-z_]{1,20}$/.test(k)) {
        const s = clean(v, 200);
        if (s) utm[k] = s;
      }
    }
  }

  const promo = getPromo();
  const live = isPromoLive(promo);
  const plans = await getPlans();

  try {
    const url = await createCheckoutUrl(
      {
        plan,
        customer: {
          email,
          name: clean(body.name, 120),
          eventName: clean(body.eventName, 120),
          eventDate: DATE.test(eventDate) ? eventDate : '',
          mobile: clean(body.mobile, 30)
        },
        discountCode: live ? promo.code : '',
        utm
      },
      priceFor(plans[plan].priceCents, promo)
    );
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[checkout] create failed', err instanceof LemonSqueezyError ? { status: err.status, detail: err.detail } : err);
    return NextResponse.json(
      { error: 'We couldn’t start checkout. Please try again, or message us on Messenger.' },
      { status: 502 }
    );
  }
}
