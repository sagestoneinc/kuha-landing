import type { Metadata } from 'next';
import { StandaloneCheckout } from '@/components/StandaloneCheckout';
import { getPromo } from '@/lib/config';
import { getPlans } from '@/lib/lemonsqueezy';
import { FEATURED_PLAN, isPlanKey } from '@/lib/plans';

export const metadata: Metadata = { title: 'Kuha — Secure checkout', robots: { index: false, follow: false } };
export const revalidate = 3600;

// Direct link to checkout, e.g. /checkout?plan=luxxe (UTMs are kept).
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const key = typeof sp.plan === 'string' ? sp.plan.toLowerCase() : '';
  const plans = await getPlans();
  return <StandaloneCheckout plan={plans[isPlanKey(key) ? key : FEATURED_PLAN]} promo={getPromo()} />;
}
