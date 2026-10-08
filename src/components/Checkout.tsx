'use client';
import { useEffect, useRef, useState } from 'react';
import { LINKS } from '@/lib/content';
import { loadLemon, openCheckout, track } from '@/lib/client';
import type { Plan } from '@/lib/plans';
import { formatPeso, priceFor, type Promo, isPromoLive } from '@/lib/pricing';
import { Chat, Lock, Shield, Tick } from './icons';

type Props = {
  plan: Plan;
  promo: Promo;
  utm: Record<string, string>;
  /** 'back' closes the overlay; 'packages' closes it and scrolls to pricing. */
  onBack: (reason: 'back' | 'packages') => void;
};

export function Checkout({ plan, promo, utm, onBack }: Props) {
  const live = isPromoLive(promo);
  const now = priceFor(plan.priceCents, promo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus({ preventScroll: true });
    // Warm up Lemon.js so the overlay opens instantly on Pay.
    loadLemon();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '').trim();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      (e.currentTarget.elements.namedItem('email') as HTMLInputElement | null)?.focus();
      return;
    }
    setEmailError('');
    setBusy(true);
    track('track', 'AddPaymentInfo', { content_name: plan.name, value: now / 100, currency: 'PHP' });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.key,
          email,
          name: f.get('name'),
          eventName: f.get('event'),
          eventDate: f.get('date'),
          mobile: f.get('mobile'),
          utm
        })
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; field?: string };
      if (!res.ok || !data.url) {
        if (data.field === 'email') setEmailError(data.error || 'Please check your email.');
        else setError(data.error || 'We couldn’t start checkout. Please try again.');
        return;
      }
      await openCheckout(data.url, () => {
        window.location.assign(`/thank-you?plan=${plan.key}&value=${(now / 100).toFixed(2)}`);
      });
    } catch {
      setError('Connection problem. Check your signal and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ck" data-screen-label="Checkout">
      <div className="ck-top">
        <button type="button" className="ck-back" onClick={() => onBack('back')}>
          ← Back
        </button>
        <span className="ck-secure">
          <Lock size={16} />
          Secure checkout
        </span>
      </div>

      <section aria-label="Order summary" className="ck-summary">
        <div className="ck-summary-row">
          <span className="ck-plan">
            Kuha <span className="em">{plan.name}</span>
          </span>
          <span className="ck-price">
            {live ? <s>{formatPeso(plan.priceCents)}</s> : null}
            <b>{formatPeso(now)}</b>
          </span>
        </div>
        <span className="ck-meta">{plan.meta}</span>
        <div className="ck-summary-row" style={{ alignItems: 'center' }}>
          {live ? (
            <span className="pill-mango">
              {promo.code} applied · −{formatPeso(plan.priceCents - now)}
            </span>
          ) : (
            <span />
          )}
          <button type="button" className="ck-change" onClick={() => onBack('packages')}>
            Change plan
          </button>
        </div>
      </section>

      <form className="ck-form" onSubmit={onSubmit} noValidate>
        <label className="field">
          Event name
          <input ref={firstField} type="text" name="event" placeholder="e.g. Bea's 18th" autoComplete="off" maxLength={120} />
        </label>
        <label className="field">
          <span>
            Event date <small>(optional — your window starts here)</small>
          </span>
          <input type="date" name="date" />
        </label>
        <label className="field">
          Full name
          <input type="text" name="name" autoComplete="name" maxLength={120} />
        </label>
        <label className="field">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'ck-email-err' : 'ck-email-hint'}
          />
          {emailError ? (
            <span id="ck-email-err" className="field-error" role="alert">
              {emailError}
            </span>
          ) : (
            <small id="ck-email-hint">Use the email you’ll sign in to Kuha with, so your upgrade applies automatically.</small>
          )}
        </label>
        <label className="field">
          Mobile number
          <input type="tel" name="mobile" placeholder="09XX XXX XXXX" autoComplete="tel" inputMode="tel" maxLength={30} />
        </label>

        <div className="ck-pay-note">
          <b>Pay by card on the next step</b>
          <span className="muted">Visa · Mastercard via Lemon Squeezy. GCash &amp; Maya coming soon.</span>
        </div>

        {error ? (
          <div className="ck-error" role="alert">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary" aria-disabled={busy} disabled={busy}>
          {busy ? 'Opening secure checkout…' : `Pay ${formatPeso(now)}`}
        </button>
      </form>

      <div className="ck-assure">
        <span>
          <Shield />
          Tested it free first? Your album upgrades instantly.
        </span>
        <span>
          <Tick color="#2F5D4A" />
          Your album and QR are ready right after payment
        </span>
        <span>
          <Tick color="#2F5D4A" />
          One-time payment · no subscription
        </span>
      </div>

      <a href={LINKS.messenger} target="_blank" rel="noopener" className="btn btn-outline" style={{ fontSize: 16 }}>
        <Chat size={18} tail={false} />
        Questions? Chat with us on Messenger
      </a>
    </div>
  );
}
