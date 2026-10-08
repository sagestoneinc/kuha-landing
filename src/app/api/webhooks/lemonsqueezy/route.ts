import { NextResponse } from 'next/server';
import { fulfilment, lemon } from '@/lib/config';
import { parseOrderEvent, sign, verifySignature } from '@/lib/lemonsqueezy-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HANDLED = new Set(['order_created', 'order_refunded']);

// Lemon Squeezy retries any non-2xx response, so a fulfilment failure returns
// 500 on purpose. The receiver should de-duplicate on orderId.
export async function POST(req: Request) {
  if (!lemon.webhookSecret) {
    console.error('[webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-signature'), lemon.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = req.headers.get('x-event-name');
  if (!eventName || !HANDLED.has(eventName)) return NextResponse.json({ ok: true, ignored: eventName });

  const order = parseOrderEvent(payload, lemon.variants, eventName);
  if (!order) return NextResponse.json({ ok: true, ignored: 'not an order' });

  console.info('[webhook]', order.event, { orderId: order.orderId, plan: order.plan, status: order.status, testMode: order.testMode });

  if (fulfilment.url) {
    const body = JSON.stringify(order);
    try {
      const res = await fetch(fulfilment.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fulfilment.secret ? { 'X-Kuha-Signature': sign(body, fulfilment.secret) } : {})
        },
        body,
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`fulfilment responded ${res.status}`);
    } catch (err) {
      console.error('[webhook] fulfilment forward failed', err);
      return NextResponse.json({ error: 'Fulfilment failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
