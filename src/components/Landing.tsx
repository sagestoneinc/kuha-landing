'use client';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FAQS, FEATURED_REVIEW, GALLERY, LINKS, MEDIA, REVIEWS, SLIDES, STATS } from '@/lib/content';
import { track, utmParams, withUtm } from '@/lib/client';
import { FEATURED_PLAN, PRICING_ORDER, isPlanKey, type Plan, type PlanKey } from '@/lib/plans';
import { formatPeso, isPromoLive, priceFor, type Promo } from '@/lib/pricing';
import { Checkout } from './Checkout';
import { Countdown } from './Countdown';
import { Chat, Facebook, Instagram, Lock, Plus, Star, TikTok, Tick } from './icons';

type Props = { plans: Record<PlanKey, Plan>; promo: Promo };

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const CK_HASH = /^#checkout-(vip|elite|luxxe)$/;

export function Landing({ plans, promo }: Props) {
  const [promoLive, setPromoLive] = useState(() => isPromoLive(promo));
  const [ck, setCk] = useState<PlanKey | null>(null);
  const [openFaq, setOpenFaq] = useState(-1);
  const [showBar, setShowBar] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [tipClosed, setTipClosed] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});

  const heroRef = useRef<HTMLElement>(null);
  const heroVidRef = useRef<HTMLVideoElement>(null);
  const scanVidRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLSpanElement>(null);
  const slideWrapRef = useRef<HTMLDivElement>(null);
  const slideARef = useRef<HTMLImageElement>(null);
  const slideBRef = useRef<HTMLImageElement>(null);

  const price = (k: PlanKey) => (promoLive ? priceFor(plans[k].priceCents, promo) : plans[k].priceCents);
  const freeHref = withUtm(LINKS.dashboard, utm);
  const mainCta = 'Get your QR album — ' + formatPeso(price(FEATURED_PLAN));

  // ── Checkout overlay, addressable as #checkout-<plan> so Back works ──
  const openCk = useCallback(
    (key: PlanKey) => {
      track('track', 'InitiateCheckout', { content_name: plans[key].name, value: price(key) / 100, currency: 'PHP' });
      try {
        history.pushState({ ck: key }, '', '#checkout-' + key);
      } catch {
        /* ignore */
      }
      setCk(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plans, promoLive]
  );

  const closeCk = useCallback((reason: 'back' | 'packages') => {
    if (CK_HASH.test(location.hash)) {
      try {
        history.back();
      } catch {
        /* ignore */
      }
    }
    setCk(null);
    if (reason === 'packages') {
      setTimeout(() => {
        const el = document.getElementById('packages');
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: 'smooth' });
      }, 60);
    }
  }, []);

  const onPlanClick = (key: PlanKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    openCk(key);
  };
  const onFree = () => track('track', 'Lead', { content_name: 'free_trial' });

  useEffect(() => {
    const sync = () => {
      const m = location.hash.match(CK_HASH);
      setCk(m && isPlanKey(m[1]) ? m[1] : null);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  // Lock page scroll and allow Esc while the checkout is open.
  useEffect(() => {
    if (!ck) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCk('back');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [ck, closeCk]);

  // ── One-time setup: tracking, sticky bar, motion ──
  useEffect(() => {
    setUtm(utmParams());
    setInApp(/FBAN|FBAV|Instagram|musical_ly|TikTok|Bytedance/i.test(navigator.userAgent || ''));
    setPromoLive(isPromoLive(promo));
    track('track', 'ViewContent', { content_name: 'kuha_ads_paid' });

    const q = <T extends Element = HTMLElement>(s: string) => Array.from(document.querySelectorAll<T & HTMLElement>(s));
    const R = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const cleanups: (() => void)[] = [];

    // Hero video: autoplay muted unless reduced motion (poster only).
    const hv = heroVidRef.current;
    if (hv) {
      hv.muted = true;
      if (!R) hv.play?.().catch(() => {});
    }

    // Sticky CTA bar after the hero leaves the screen (mobile only via CSS).
    const onScroll = () => {
      const el = heroRef.current;
      setShowBar(window.innerWidth < 760 && (el ? el.getBoundingClientRect().bottom < 0 : false));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });

    // Hero entrance: CTA is visible well within 300ms.
    if (!R) {
      q('[data-in]').forEach(el =>
        el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], {
          duration: 240,
          delay: +(el.dataset.in || 0),
          easing: EASE,
          fill: 'backwards'
        })
      );
      q('[data-settle-in]').forEach(el =>
        el.animate([{ transform: 'translateY(6px) rotate(-2deg)' }, { transform: 'none' }], { duration: 700, delay: 120, easing: EASE, fill: 'backwards' })
      );
    }

    // Loops pause when their section is off-screen.
    type Loop = { el: Element; anims: Animation[]; onVis?: (v: boolean) => void };
    const loops: Loop[] = [];
    const loopIO = new IntersectionObserver(es =>
      es.forEach(en =>
        loops
          .filter(l => l.el === en.target)
          .forEach(L => {
            L.anims.forEach(a => (en.isIntersecting ? a.play() : a.pause()));
            L.onVis?.(en.isIntersecting);
          })
      )
    );
    const addLoop = (el: Element | null, anims: Animation[], onVis?: (v: boolean) => void) => {
      if (!el) return;
      loops.push({ el, anims, onVis });
      loopIO.observe(el);
    };

    // Phone mockup: photos arriving, one tile at a time, with a toast.
    const tiles = q('[data-tile]');
    const tileA: (Animation | undefined)[] = [];
    let tileI = 0;
    let tileT: ReturnType<typeof setTimeout> | undefined;
    let tilesOn = false;
    let toastA: Animation | undefined;
    const tileStep = () => {
      clearTimeout(tileT);
      if (!tilesOn || !tiles.length) return;
      if (tileI < tiles.length) {
        tileA[tileI]?.cancel();
        tileA[tileI] = tiles[tileI].animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 450, easing: EASE, fill: 'forwards' });
        const t = toastRef.current;
        if (t) {
          toastA?.cancel();
          toastA = t.animate(
            [
              { opacity: 0, transform: 'translateY(8px)' },
              { opacity: 1, transform: 'none', offset: 0.15 },
              { opacity: 1, transform: 'none', offset: 0.85 },
              { opacity: 0, transform: 'translateY(-4px)' }
            ],
            { duration: 1600, easing: EASE, fill: 'forwards' }
          );
        }
        tileI++;
        tileT = setTimeout(tileStep, 1400);
      } else {
        tileT = setTimeout(() => {
          tiles.forEach((tl, j) => {
            tileA[j]?.cancel();
            tileA[j] = tl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
          });
          tileI = 0;
          tileT = setTimeout(tileStep, 800);
        }, 2000);
      }
    };

    // Live slideshow card: crossfade between two stacked images.
    let slideT: ReturnType<typeof setTimeout> | undefined;
    let slideOn = false;
    let si = 0;
    let front = slideARef.current;
    let back = slideBRef.current;
    let frontA: Animation | undefined;
    let backA: Animation | undefined;
    const slideStep = () => {
      clearTimeout(slideT);
      if (!slideOn || !front || !back) return;
      slideT = setTimeout(() => {
        if (!front || !back) return;
        si = (si + 1) % SLIDES.length;
        const nx = back;
        const cur = front;
        nx.src = SLIDES[si];
        backA?.cancel();
        frontA?.cancel();
        backA = nx.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
        frontA = cur.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
        front = nx;
        back = cur;
        slideStep();
      }, 3200);
    };

    if (R) {
      tiles.forEach(t => (t.style.opacity = '1'));
    } else {
      const ph = phoneRef.current;
      addLoop(
        heroRef.current,
        ph ? [ph.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }], { duration: 4200, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' })] : [],
        v => {
          tilesOn = v;
          if (v) tileStep();
          else clearTimeout(tileT);
        }
      );
      q('[data-ring]').forEach(r =>
        addLoop(r.closest('section') || r, [
          r.animate([{ transform: 'scale(1)', opacity: 0.5 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 2000, iterations: Infinity, easing: 'ease-out' })
        ])
      );
      addLoop(slideWrapRef.current, [], v => {
        slideOn = v;
        if (v) slideStep();
        else clearTimeout(slideT);
      });
    }

    // Scroll reveals (only for elements below the first screen) + lazy scan video.
    const reveal = (el: HTMLElement) => {
      const d = +(el.dataset.d || 0);
      if (R) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'backwards' });
        return;
      }
      const K: Record<string, [Keyframe[], number]> = {
        down: [[{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], 500],
        pop: [[{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], 400],
        bounce: [[{ transform: 'translateY(-4px)' }, { transform: 'none' }], 400],
        settle: [[{ opacity: 0, transform: 'translateY(6px) rotate(-2deg)' }, { opacity: 1, transform: 'none' }], 700]
      };
      const [frames, duration] = K[el.dataset.reveal || ''] || [[{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], 650];
      el.animate(frames, { duration, delay: d, easing: EASE, fill: 'backwards' });
    };
    const io = new IntersectionObserver(
      es =>
        es.forEach(en => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          io.unobserve(el);
          if (el instanceof HTMLVideoElement) {
            el.src = el.dataset.src || '';
            el.load();
            el.muted = true;
            if (!R) el.play?.().catch(() => {});
            return;
          }
          reveal(el);
        }),
      { rootMargin: '0px 0px -30px 0px', threshold: 0.1 }
    );
    if (scanVidRef.current) io.observe(scanVidRef.current);
    const vh = window.innerHeight;
    q('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top > vh) io.observe(el);
    });

    // Re-check the promo deadline once a minute (hides the offer at the deadline).
    const promoT = setInterval(() => setPromoLive(isPromoLive(promo)), 60000);

    return () => {
      cleanups.forEach(f => f());
      clearTimeout(tileT);
      clearTimeout(slideT);
      clearInterval(promoT);
      io.disconnect();
      loopIO.disconnect();
      loops.forEach(l => l.anims.forEach(a => a.cancel()));
    };
  }, [promo]);

  const bar = showBar && !ck;

  return (
    <>
      <section ref={heroRef} className="hero" data-screen-label="01 Hero">
        <a href={LINKS.home} aria-label="Kuha homepage" className="logo-link">
          <span role="img" aria-label="Kuha" className="logo" />
        </a>
        <div className="hero-row">
          <div className="hero-copy">
            <span data-in="0" className="eyebrow">
              <span className="dot">
                <span data-ring="" className="ring" />
                <span />
              </span>
              Weddings · Debuts · Christenings · Birthdays · Reunions
            </span>
            <h1 data-in="20" className="h1">
              Every guest is your <span data-settle-in="" className="em">photographer.</span>
            </h1>
            <p data-in="40" className="lead">
              One QR code on each table. Guests scan and upload from their browser — no app, no sign-up. Every photo lands in one private album.
            </p>
            <div data-in="60" className="hero-ctas">
              {promoLive ? (
                <div className="promo-row">
                  <span className="pill-mango">
                    {promo.percent}% off · ends {promo.endsLabel}
                  </span>
                  <s className="strike">{formatPeso(plans[FEATURED_PLAN].priceCents)}</s>
                </div>
              ) : null}
              <a href={`#checkout-${FEATURED_PLAN}`} onClick={onPlanClick(FEATURED_PLAN)} data-cta="hero-elite" className="btn btn-primary btn-lg">
                {mainCta}
              </a>
              <a href={freeHref} onClick={onFree} data-cta="hero-free" className="textlink">
                Try it free first <span className="arrow">→</span>
              </a>
              <span className="label">Card · Secure checkout · Ready in 60s</span>
              {inApp && !tipClosed ? (
                <div role="note" className="tip">
                  <span>Tip: tap ⋯ → Open in browser for the smoothest checkout.</span>
                  <button type="button" onClick={() => setTipClosed(true)} aria-label="Dismiss tip">
                    ×
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="hero-media">
            <div className="hero-video">
              <video
                ref={heroVidRef}
                src={MEDIA.heroVideo}
                poster={MEDIA.heroPoster}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Guests at a Kuha event sharing photos"
              />
            </div>
            <div ref={phoneRef} className="phone" aria-hidden="true">
              <div className="phone-screen">
                <div className="phone-title">
                  <b>
                    Share your <span className="em">kuha</span>
                  </b>
                  <small>Vish &amp; Joy · Guest album</small>
                </div>
                <div className="phone-add">
                  <Plus />
                  Add photos
                </div>
                <div className="phone-toast-row">
                  <span ref={toastRef} className="phone-toast">
                    <i />
                    +3 photos added
                  </span>
                </div>
                <div className="phone-grid">
                  {[
                    ['/assets/ads-t1.jpg', 'center 35%'],
                    ['/assets/ads-t2.jpg', 'center 30%'],
                    ['/assets/ads-t3.jpg', 'center 40%'],
                    ['/assets/ads-t4.jpg', 'center 55%']
                  ].map(([src, pos]) => (
                    <div key={src}>
                      <div data-tile="" className="tile" style={{ backgroundImage: `url(${src})`, backgroundPosition: pos }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="proof" data-screen-label="02 Proof">
        <div className="wrap">
          {STATS ? (
            <p data-reveal="up" className="stats">
              <Star />
              <span>{STATS}</span>
            </p>
          ) : null}
          <figure data-reveal="up" className="feature-quote">
            <Image src={FEATURED_REVIEW.photo} width={80} height={96} alt={FEATURED_REVIEW.photoAlt} sizes="80px" />
            <div>
              <blockquote className="quote">“{FEATURED_REVIEW.quote}”</blockquote>
              <figcaption className="cite">
                <b>{FEATURED_REVIEW.name}</b> · {FEATURED_REVIEW.event}
              </figcaption>
            </div>
          </figure>
        </div>
      </section>

      <section className="section section-alt how" data-screen-label="03 How it works">
        <div className="wrap wrap-narrow">
          <div className="head">
            <span className="label">How it works</span>
            <h2 data-reveal="up" className="h2">
              Three steps. <span className="em">Lola-proof.</span>
            </h2>
          </div>
          <div className="steps">
            {[
              ['Create', 'Name your event. Your album and QR code are ready right away.'],
              ['Share the QR', 'Print it on table cards, or drop the link in the group chat.'],
              ['Guests upload', 'They scan, pick photos, send. Everything lands in your album.']
            ].map(([title, body], i) => (
              <div key={title} data-reveal="up" data-d={i * 90} className="step">
                <span data-reveal="pop" data-d={100 + i * 90} className="step-n">
                  {i + 1}
                </span>
                <div className="step-body">
                  <b>{title}</b>
                  <span>{body}</span>
                </div>
              </div>
            ))}
          </div>
          <div data-reveal="up" className="how-video">
            <video
              ref={scanVidRef}
              data-src={MEDIA.scanVideo}
              poster={MEDIA.scanPoster}
              muted
              loop
              playsInline
              preload="none"
              aria-label="A guest scanning a Kuha QR code and uploading photos"
            />
          </div>
          <a href={LINKS.demoAlbum} target="_blank" rel="noopener" data-cta="how-demo" className="btn btn-outline" onClick={() => track('track', 'Lead', { content_name: 'demo_album' })}>
            See what guests see <span className="arrow">→</span>
          </a>
        </div>
      </section>

      <section className="section get" data-screen-label="04 What you get">
        <div className="wrap">
          <h2 data-reveal="up" className="h2">
            Everything for the day, in <span className="em">one QR.</span>
          </h2>
          <div className="cards3">
            <div data-reveal="up" data-d="0" className="get-card">
              <div className="get-thumb">
                <Image className="qr" src={MEDIA.qrCard} alt="A printable Kuha QR table card" width={84} height={84} unoptimized loading="lazy" />
              </div>
              <div className="get-text">
                <b>Printable QR table cards</b>
                <span>Ready-made designs, print at home or any shop.</span>
              </div>
            </div>
            <div data-reveal="up" data-d="80" className="get-card">
              <div className="get-thumb">
                <div className="tv">
                  <div className="tv-screen">
                    <div ref={slideWrapRef} className="tv-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img ref={slideARef} src={SLIDES[0]} alt="Guest photos on a live slideshow" loading="lazy" decoding="async" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img ref={slideBRef} src={SLIDES[1]} alt="" loading="lazy" decoding="async" style={{ opacity: 0 }} />
                      <span className="dot">
                        <span data-ring="" className="ring" />
                        <span />
                      </span>
                    </div>
                  </div>
                  <div className="tv-stand" />
                </div>
              </div>
              <div className="get-text">
                <b>Live slideshow</b>
                <span>Any TV or projector becomes a memory wall.</span>
              </div>
            </div>
            <div data-reveal="up" data-d="160" className="get-card">
              <div className="get-thumb">
                <div className="zip-stack">
                  <div style={{ backgroundImage: 'url(/assets/ads-t4.jpg)' }} />
                  <div style={{ backgroundImage: 'url(/assets/ads-t3.jpg)' }} />
                  <div style={{ backgroundImage: 'url(/assets/ads-t1.jpg)' }} />
                </div>
                <span className="zip-tag">ZIP</span>
              </div>
              <div className="get-text">
                <b>One-click ZIP download</b>
                <span>Every photo in high quality, not group-chat blur.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="section section-alt gallery-sec" data-screen-label="05 Real guest photos">
        <div className="wrap wrap-narrow">
          <h2 data-reveal="up" className="h2">
            Shot by guests, not <span className="em">studios.</span>
          </h2>
          <div className="gallery">
            {GALLERY.slice(0, 4).map((g, i) => (
              <div key={g.src} data-reveal="up" data-d={i * 60} className="gallery-item">
                <Image src={g.src} alt={g.alt} fill sizes="(min-width: 800px) 370px, 50vw" style={{ objectPosition: g.position || 'center' }} />
                <span className="chip">{g.label}</span>
              </div>
            ))}
          </div>
          <div className="reviews">
            {REVIEWS.map((r, i) => (
              <figure key={r.name} data-reveal="up" data-d={i * 80} className="review">
                <blockquote className="quote">“{r.quote}”</blockquote>
                <figcaption className="cite">
                  <b>{r.name}</b> · {r.event}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="section pricing" data-screen-label="06 Pricing">
        <div className="wrap">
          <h2 data-reveal="up" className="h2">
            One-time, <span className="em">per event.</span>
          </h2>
          {promoLive ? (
            <div data-reveal="down" className="promo-banner">
              <strong>{promo.code}</strong>
              <span>
                applied automatically · ends {promo.endsLabel} · <Countdown endsAt={promo.endsAt} /> left
              </span>
            </div>
          ) : null}
          <div className="tiers">
            {PRICING_ORDER.map((key, i) => {
              const t = plans[key];
              const pop = key === FEATURED_PLAN;
              return (
                <div key={key} data-reveal="up" data-d={i * 70} className="tier-cell">
                  <div className={pop ? 'tier tier-pop' : 'tier'}>
                    {pop ? (
                      <span data-reveal="bounce" data-d="350" className="badge">
                        Most popular
                      </span>
                    ) : null}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h3 className="tier-name" style={{ margin: 0 }}>
                        {t.name}
                      </h3>
                      <div className="tier-price">
                        {promoLive ? (
                          <s>
                            <span className="sr-only">Was </span>
                            {formatPeso(t.priceCents)}
                          </s>
                        ) : null}
                        <b>
                          {promoLive ? <span className="sr-only">Now </span> : null}
                          {formatPeso(price(key))}
                        </b>
                      </div>
                    </div>
                    <ul className="tier-lines">
                      {t.lines.map(l => (
                        <li key={l}>
                          <Tick />
                          {l}
                        </li>
                      ))}
                    </ul>
                    <a href={`#checkout-${key}`} onClick={onPlanClick(key)} data-cta={`packages-${key}`} className={pop ? 'btn btn-primary' : 'btn btn-outline'}>
                      Get {t.name}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pricing-foot">
            <p>Event months away? Buy now — your upload window starts on your event date.</p>
            <a href={freeHref} onClick={onFree} data-cta="pricing-free" className="textlink">
              Not sure yet? Try a free album first <span className="arrow">→</span>
            </a>
            <div className="pay-row">
              <b>Visa</b>
              <span aria-hidden="true">·</span>
              <b>Mastercard</b>
              <span aria-hidden="true">·</span>
              <span>
                <Lock color="#15130F" />
                Secure checkout by Lemon Squeezy
              </span>
            </div>
            <span className="label">GCash &amp; Maya coming soon</span>
          </div>
        </div>
      </section>

      <section className="try" data-screen-label="07 Try before you pay">
        <div data-reveal="up" className="try-card">
          <h2>
            Try it free before you <span className="em">pay.</span>
          </h2>
          <p>Create a trial album, test it with friends, and upgrade only when you&apos;re sure it&apos;s right for your event.</p>
          <a href={freeHref} onClick={onFree} data-cta="trybefore-free">
            Start a free album <span className="arrow">→</span>
          </a>
        </div>
      </section>

      <section className="section section-alt faq" data-screen-label="08 FAQ">
        <div className="wrap wrap-narrow">
          <h2 data-reveal="up" className="h2">
            Quick <span className="em">questions.</span>
          </h2>
          <div className="faq-list">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className={open ? 'faq-item open' : 'faq-item'}>
                  <h3>
                    <button type="button" className="faq-q" aria-expanded={open} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpenFaq(open ? -1 : i)}>
                      <span>{f.q}</span>
                      <span aria-hidden="true" className="faq-sign">
                        {open ? '−' : '+'}
                      </span>
                    </button>
                  </h3>
                  <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq-a" inert={!open}>
                    <div>
                      <p>{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="final" data-screen-label="09 Final CTA">
        <div className="wrap wrap-narrow">
          <h2 data-reveal="up">
            Stop chasing{' '}
            <span data-reveal="settle" data-d="150" className="em">
              photos.
            </span>
          </h2>
          <p>Event coming up? Set up now so your QR cards print in time.</p>
          {promoLive ? (
            <span className="final-pill">
              <b>{promo.code}</b>· {promo.percent}% off · <Countdown endsAt={promo.endsAt} /> left
            </span>
          ) : null}
          <a href={`#checkout-${FEATURED_PLAN}`} onClick={onPlanClick(FEATURED_PLAN)} data-cta="final-elite" data-reveal="up" data-d="120" className="btn btn-ink btn-lg">
            {mainCta}
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <span role="img" aria-label="Kuha" className="logo logo-light" />
          <nav aria-label="Legal">
            <a href={LINKS.privacy}>Privacy</a>
            <a href={LINKS.terms}>Terms</a>
            <a href={LINKS.refund}>Refunds</a>
            <a href={LINKS.email}>info@kuha.app</a>
          </nav>
          <div className="socials">
            <a href={LINKS.facebook} target="_blank" rel="noopener" aria-label="Kuha on Facebook">
              <Facebook />
            </a>
            <a href={LINKS.instagram} target="_blank" rel="noopener" aria-label="Kuha on Instagram">
              <Instagram />
            </a>
            <a href={LINKS.tiktok} target="_blank" rel="noopener" aria-label="Kuha on TikTok">
              <TikTok />
            </a>
          </div>
        </div>
      </footer>

      {!ck ? (
        <a href={LINKS.messenger} target="_blank" rel="noopener" aria-label="Chat with us on Messenger" data-cta="messenger" className={bar ? 'chat raised' : 'chat'}>
          <Chat />
        </a>
      ) : null}

      <div ref={barRef} className={bar ? 'sticky shown' : 'sticky'} inert={!bar}>
        <a href={`#checkout-${FEATURED_PLAN}`} onClick={onPlanClick(FEATURED_PLAN)} data-cta="sticky-elite" className="btn btn-primary">
          {mainCta}
        </a>
      </div>

      {ck ? (
        <div role="dialog" aria-modal="true" aria-label="Checkout" className="ck-overlay">
          <Checkout plan={plans[ck]} promo={promo} utm={utm} onBack={closeCk} />
        </div>
      ) : null}
    </>
  );
}
