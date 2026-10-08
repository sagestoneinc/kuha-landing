// Editable page copy that isn't tied to plans or pricing.

export const LINKS = {
  dashboard: 'https://www.kuha.app/dashboard',
  demoAlbum: 'https://www.kuha.app/album/4pfYIchHsVuN4n8PYLa5',
  messenger: 'https://m.me/kuhaapp',
  home: 'https://www.kuha.app',
  privacy: 'https://www.kuha.app/privacy',
  terms: 'https://www.kuha.app/terms',
  refund: 'https://www.kuha.app/refund',
  email: 'mailto:info@kuha.app',
  facebook: 'https://facebook.com/kuhaapp',
  instagram: 'https://instagram.com/kuha.app',
  tiktok: 'https://tiktok.com/@kuha.app'
};

export const MEDIA = {
  heroVideo: 'https://www.kuha.app/showcase/kuha_bg.webm',
  heroPoster: '/assets/kuha_bg_poster.jpg',
  scanVideo: 'https://www.kuha.app/landing_steps/landing_scan_qr.webm',
  scanPoster: '/assets/ads-poster.jpg',
  qrCard: 'https://www.kuha.app/QR_TEMPLATE_SAMPLE.png'
};

/** Set to null to hide the stats line. */
export const STATS: string | null = '4.9 average rating · 500+ events hosted · 50,000+ photos & videos collected';

export const FEATURED_REVIEW = {
  quote:
    'The live slideshow was the highlight of our reception! Our titos and titas loved seeing their photos on the big screen instantly.',
  name: 'Bianca & Paolo',
  event: 'Wedding',
  photo: '/assets/ads-t2.jpg',
  photoAlt: 'Guest photo from a Kuha wedding album'
};

export const REVIEWS = [
  {
    quote: 'Zero guest registration is a game changer. My friends just scanned the QR and started uploading. So seamless!',
    name: 'Camille V.',
    event: '18th birthday'
  },
  {
    quote: 'Finally, a way to get everyone’s photos without chasing them on Messenger.',
    name: 'Junjun D.',
    event: 'Family reunion'
  }
];

/**
 * Guest photos from real Kuha events. The design calls for a debut, birthday and
 * christening photo too: add them here (put the file in public/assets) and they
 * replace the last entries. Only use photos you have permission to show.
 */
export const GALLERY: { src: string; alt: string; label: string; width: number; height: number; position?: string }[] = [
  { src: '/assets/ads-hero.jpg', alt: 'Reception walk-in, shot on a guest’s phone', label: 'Wedding', width: 900, height: 1200, position: 'center 40%' },
  { src: '/assets/vj-kiss.jpg', alt: 'The couple’s first kiss as they leave the church, guests waving ribbons', label: 'Ceremony', width: 675, height: 1200, position: 'center 55%' },
  { src: '/assets/vj-father.jpg', alt: 'The bride shares a dance with family under the chandeliers', label: 'Dance', width: 675, height: 1200, position: 'center 60%' },
  { src: '/assets/vj-dance.jpg', alt: 'A slow dance at the reception while guests film from their tables', label: 'Reception', width: 900, height: 1200, position: 'center 35%' }
];

/** Photos the live-slideshow card cycles through. */
export const SLIDES = ['/assets/ads-t1.jpg', '/assets/ads-t2.jpg', '/assets/ads-hero.jpg', '/assets/ads-t4.jpg', '/assets/ads-t3.jpg'];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What if guests don’t upload?',
    a: 'Put a QR card on every table and ask your host or emcee to mention it once. You can also share the album link in your group chats. Guests can keep uploading after the event, through your plan’s upload window.'
  },
  { q: 'Do guests need an app?', a: 'No. They scan and upload from their phone’s browser. No app, no account.' },
  { q: 'Can older guests use it?', a: 'If they can scan a QR code, they can use Kuha. One tap to pick photos, one tap to send.' },
  { q: 'Is our album private?', a: 'Yes. Only people with your QR code or link can see it.' },
  {
    q: 'How do I pay?',
    a: 'By card, through our secure checkout by Lemon Squeezy. It’s a one-time payment per event, with no subscription. GCash and Maya are coming soon.'
  },
  {
    q: 'My event is months away. Can I buy now?',
    a: 'Yes. Your upload window starts on your event date, so buying early doesn’t use up any days.'
  },
  {
    q: 'What happens after my event?',
    a: 'Your full album stays open for your plan’s access period (3, 6 or 12 months). Download everything as a ZIP anytime before then. You also get a Thank You memory page with a slideshow link that never expires.'
  }
];
