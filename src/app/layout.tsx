import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Instrument_Serif } from 'next/font/google';
import './globals.css';

const sans = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-sans', display: 'swap', axes: ['opsz'] });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kuha.app').replace(/\/+$/, '');
const pixelId = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').replace(/\D/g, '');

const title = 'Kuha — Every guest is your photographer';
const description =
  'One QR code on each table. Guests scan and upload from their browser — no app, no sign-up. Every photo lands in one private album.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: '/' },
  icons: { icon: 'https://www.kuha.app/favicon.ico' },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'Kuha',
    type: 'website',
    images: [{ url: 'https://www.kuha.app/kuha_logo_black_bg.png', width: 1200, height: 630 }]
  },
  twitter: { card: 'summary_large_image', title, description },
  other: { 'facebook-domain-verification': 'krfcyrbjp3q7c7d32yto6dqo9q60zg' }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F5EFE4'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.kuha.app" />
        {pixelId ? (
          <script
            // Meta Pixel base code. Runs before hydration so page events are never dropped.
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`
            }}
          />
        ) : null}
      </head>
      <body>
        {children}
        {pixelId ? (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`} />
          </noscript>
        ) : null}
      </body>
    </html>
  );
}
