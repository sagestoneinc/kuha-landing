import { Landing } from '@/components/Landing';
import { getPromo } from '@/lib/config';
import { getPlans } from '@/lib/lemonsqueezy';

// Prices come from Lemon Squeezy and are refreshed at most once an hour.
export const revalidate = 3600;

export default async function Page() {
  const [plans, promo] = await Promise.all([getPlans(), getPromo()]);
  return <Landing plans={plans} promo={promo} />;
}
