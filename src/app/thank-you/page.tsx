import type { Metadata } from 'next';
import { PurchaseTracker } from '@/components/PurchaseTracker';
import { LINKS } from '@/lib/content';
import { PLANS, isPlanKey } from '@/lib/plans';

export const metadata: Metadata = { title: 'Kuha — Thank you', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const key = typeof sp.plan === 'string' && isPlanKey(sp.plan) ? sp.plan : null;
  const value = typeof sp.value === 'string' ? Number(sp.value) : NaN;
  const name = key ? PLANS[key].name : null;

  return (
    <main className="thanks">
      <a href={LINKS.home} aria-label="Kuha homepage" className="logo-link">
        <span role="img" aria-label="Kuha" className="logo" />
      </a>
      <h1 className="h2" style={{ fontSize: 'clamp(36px, 8vw, 56px)' }}>
        Salamat! You&apos;re <span className="em">all set.</span>
      </h1>
      <p className="lead">
        {name ? `Your Kuha ${name} payment went through.` : 'Your payment went through.'} We&apos;ve emailed your receipt.
      </p>
      <ol>
        <li>Open your Kuha dashboard and sign in with the same email you paid with.</li>
        <li>Create your album (or open your trial album) — your plan applies automatically.</li>
        <li>Download your QR table cards and print them before the event.</li>
      </ol>
      <a href={LINKS.dashboard} className="btn btn-primary btn-lg" style={{ maxWidth: 400 }}>
        Go to my dashboard
      </a>
      <a href={LINKS.messenger} target="_blank" rel="noopener" className="textlink" style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
        Need help? Message us on Messenger <span className="arrow">→</span>
      </a>
      {key && Number.isFinite(value) ? <PurchaseTracker plan={PLANS[key].name} value={value} /> : null}
    </main>
  );
}
