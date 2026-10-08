'use client';
import { useEffect } from 'react';
import { track } from '@/lib/client';

/** Fires the Meta Pixel Purchase event once per browser session. */
export function PurchaseTracker({ plan, value }: { plan: string; value: number }) {
  useEffect(() => {
    const key = `kuha_purchase_${plan}_${value}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage blocked: still track once for this page view */
    }
    track('track', 'Purchase', { content_name: plan, value, currency: 'PHP' });
  }, [plan, value]);
  return null;
}
