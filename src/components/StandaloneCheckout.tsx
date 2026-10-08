'use client';
import { useEffect, useState } from 'react';
import { track, utmParams, withUtm } from '@/lib/client';
import type { Plan } from '@/lib/plans';
import { priceFor, type Promo } from '@/lib/pricing';
import { Checkout } from './Checkout';

export function StandaloneCheckout({ plan, promo }: { plan: Plan; promo: Promo }) {
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    setUtm(utmParams());
    track('track', 'InitiateCheckout', { content_name: plan.name, value: priceFor(plan.priceCents, promo) / 100, currency: 'PHP' });
  }, [plan, promo]);

  return (
    <Checkout
      plan={plan}
      promo={promo}
      utm={utm}
      onBack={reason => {
        window.location.assign(withUtm('/', utm) + (reason === 'packages' ? '#packages' : ''));
      }}
    />
  );
}
