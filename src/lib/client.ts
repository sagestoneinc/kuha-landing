'use client';
// Browser-only helpers: Meta Pixel, UTM pass-through and the Lemon.js overlay.

type Fbq = (...args: unknown[]) => void;
type LemonSqueezyGlobal = {
  Setup: (opts: { eventHandler: (e: { event: string; data?: unknown }) => void }) => void;
  Url: { Open: (url: string) => void; Close: () => void };
  Refresh?: () => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    createLemonSqueezy?: () => void;
    LemonSqueezy?: LemonSqueezyGlobal;
  }
}

export function track(...args: unknown[]) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') window.fbq(...args);
  } catch {
    /* tracking must never break the page */
  }
}

export function utmParams(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    new URLSearchParams(window.location.search).forEach((v, k) => {
      if (k.startsWith('utm_')) out[k] = v;
    });
  } catch {
    /* ignore */
  }
  return out;
}

export function withUtm(href: string, utm: Record<string, string>): string {
  const qs = new URLSearchParams(utm).toString();
  if (!qs) return href;
  return href + (href.includes('?') ? '&' : '?') + qs;
}

const LEMON_JS = 'https://assets.lemonsqueezy.com/lemon.js';
let lemonLoad: Promise<LemonSqueezyGlobal | null> | null = null;
let onSuccess: ((data: unknown) => void) | null = null;

/** Loads Lemon.js once. Resolves null if it can't load (the caller then redirects instead). */
export function loadLemon(): Promise<LemonSqueezyGlobal | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (lemonLoad) return lemonLoad;
  lemonLoad = new Promise(resolve => {
    const ready = () => {
      try {
        window.createLemonSqueezy?.();
        const ls = window.LemonSqueezy;
        if (!ls) return resolve(null);
        ls.Setup({
          eventHandler: e => {
            if (e.event === 'Checkout.Success') onSuccess?.(e.data);
          }
        });
        resolve(ls);
      } catch {
        resolve(null);
      }
    };
    if (window.LemonSqueezy) return ready();
    const s = document.createElement('script');
    s.src = LEMON_JS;
    s.defer = true;
    s.onload = ready;
    s.onerror = () => {
      lemonLoad = null;
      resolve(null);
    };
    document.head.appendChild(s);
    setTimeout(() => resolve(window.LemonSqueezy ? window.LemonSqueezy : null), 6000);
  });
  return lemonLoad;
}

/** Opens a checkout URL in the overlay, or navigates to it when the overlay isn't available. */
export async function openCheckout(url: string, success: (data: unknown) => void) {
  onSuccess = success;
  const ls = await loadLemon();
  if (ls) ls.Url.Open(url);
  else window.location.assign(url);
}
