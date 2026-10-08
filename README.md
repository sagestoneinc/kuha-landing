# Kuha paid-ads landing page

Production build of the Claude Design handoff `project/Kuha Landing Paid (share).html`
(source: `Kuha_Ads_Landing_Paid v2.dc.html` + `Kuha Checkout.dc.html`), wired to
Lemon Squeezy through its REST API.

Next.js 15 (App Router) · React 19 · TypeScript · no UI libraries. Deploys to Vercel as-is.

## How checkout works

```
Plan button ──▶ checkout overlay (#checkout-elite) ──▶ POST /api/checkout
                     │ event name, date, name,              │ validates input
                     │ email, mobile, UTMs                  │ creates a Lemon Squeezy checkout
                     ▼                                      ▼ (prefilled email/name, KUHAFIRST20,
              Lemon.js overlay  ◀────────── checkout URL ──┘   custom data, redirect URL)
                     │ Checkout.Success
                     ▼
              /thank-you  (fires Meta Pixel Purchase once)

Lemon Squeezy ──▶ POST /api/webhooks/lemonsqueezy  (HMAC verified)
                     └─▶ optional FULFILLMENT_WEBHOOK_URL (signed JSON) → upgrade the album
```

- **Prices come from Lemon Squeezy.** The page reads each plan's variant price through the
  API (cached 1 hour), so the page always matches what checkout charges. Without an API
  key it falls back to the prices in `src/lib/plans.ts`.
- **Promo** (`PROMO_CODE`, `PROMO_PERCENT`, `PROMO_ENDS_AT`): while live, prices show the
  discount, the countdowns show, and the code is pre-applied in checkout. After the
  deadline the page switches to full prices and stops sending the code — no redeploy.
- **No API key yet?** Checkout still works: `/api/checkout` returns your hosted buy link
  (`store.kuha.app/checkout/buy/…`) with the email, name, discount and custom data
  prefilled as query parameters.
- If Lemon.js can't load (blocked, in-app browser quirks), the buyer is sent to the
  checkout page directly instead of the overlay.

## Set up

1. **Install and run locally**
   ```bash
   cd site
   cp .env.example .env.local   # fill in the values below
   npm install
   npm run dev                  # http://localhost:3000
   ```
2. **Lemon Squeezy dashboard**
   - *Settings → API*: create an API key → `LEMONSQUEEZY_API_KEY`.
   - *Settings → Stores*: the store's number → `LEMONSQUEEZY_STORE_ID`.
   - *Products*: open VIP, Elite and Luxxe and copy each **variant ID** →
     `LEMONSQUEEZY_VARIANT_VIP` / `_ELITE` / `_LUXXE`. The store currency should be PHP.
   - *Discounts*: create `KUHAFIRST20`, 20% off, limited to those three products, expiring
     Oct 31, 2026 11:59pm PH time.
   - *Settings → Webhooks*: add `https://<your-domain>/api/webhooks/lemonsqueezy`, subscribe
     to `order_created` and `order_refunded`, copy the signing secret →
     `LEMONSQUEEZY_WEBHOOK_SECRET`.
   - Use test mode first (`LEMONSQUEEZY_TEST_MODE=true` with a test-mode API key) and pay
     with card `4242 4242 4242 4242`.
3. **Fulfilment** (optional but recommended): set `FULFILLMENT_WEBHOOK_URL` to an endpoint
   on the kuha.app backend. Every verified order is POSTed there as JSON:
   ```json
   { "event": "order_created", "orderId": "123", "status": "paid", "email": "bea@example.com",
     "name": "Bea Santos", "plan": "elite", "totalCents": 79920, "currency": "PHP",
     "testMode": false, "custom": { "event_name": "Bea's 18th", "event_date": "2026-12-12",
     "mobile": "0917…", "utm_source": "facebook" } }
   ```
   It's signed with `FULFILLMENT_WEBHOOK_SECRET` in `X-Kuha-Signature` (hex HMAC-SHA256 of
   the raw body). A non-2xx reply makes Lemon Squeezy retry, so de-duplicate on `orderId`.
4. **Meta Pixel**: set `NEXT_PUBLIC_META_PIXEL_ID`. Events fired: `PageView`, `ViewContent`
   (load), `InitiateCheckout` (plan buttons), `AddPaymentInfo` (Pay), `Lead` (free trial and
   demo links), `Purchase` (thank-you page).

## Deploy to Vercel

Import the repo, set **Root Directory** to `site`, add the environment variables from
`.env.example`, deploy. Set `NEXT_PUBLIC_SITE_URL` to the final URL — it's used for the
canonical link and the post-payment redirect.

## Editing content

| What | Where |
| --- | --- |
| Plan names, ticked lines, fallback prices, hosted buy links | `src/lib/plans.ts` |
| Reviews, stats line, FAQ, gallery photos, links, videos | `src/lib/content.ts` |
| Page layout and motion | `src/components/Landing.tsx`, `src/app/globals.css` |
| Checkout form | `src/components/Checkout.tsx` |

Gallery photos live in `public/assets`. The design asks for a debut, birthday and
christening photo: add them to `GALLERY` in `content.ts` once you have permission to use them.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page. `/#checkout-vip` (or `elite`, `luxxe`) opens checkout directly. |
| `/checkout?plan=luxxe` | Stand-alone checkout page for direct ad links. |
| `/thank-you` | Post-payment page. |
| `POST /api/checkout` | Creates a Lemon Squeezy checkout. |
| `POST /api/webhooks/lemonsqueezy` | Verified order webhooks. |

## Checks

```bash
npm run typecheck && npm test && npm run build
```
