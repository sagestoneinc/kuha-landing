// Small inline icons from the design (monoline, 1.8–2.2 stroke).

export const Tick = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 9.5l3.5 3.5 7.5-8" />
  </svg>
);

export const Lock = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const Shield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F5D4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
  </svg>
);

export const Star = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="#F2B33D" aria-hidden="true">
    <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 6L10 15l-5.3 2.9 1.1-6L1.4 7.8l6-.8z" />
  </svg>
);

export const Plus = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const Chat = ({ size = 26, tail = true }: { size?: number; tail?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.5c-4.7 0-8.5 3.4-8.5 7.7 0 2.4 1.2 4.6 3.1 6v3.3l3-1.7c.8.2 1.6.3 2.4.3 4.7 0 8.5-3.4 8.5-7.9S16.7 3.5 12 3.5z" />
    {tail ? <path d="M8 12.5l2.6-2.6 2.2 2 3.2-2.4" /> : null}
  </svg>
);

export const Facebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21z" />
  </svg>
);

export const Instagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const TikTok = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.6 3c.3 2.2 1.7 3.7 3.9 3.9v3c-1.4.1-2.7-.3-3.9-1v6.1c0 3.6-2.6 6-5.9 6-3.2 0-5.7-2.5-5.7-5.6 0-3.5 3-6.1 6.6-5.6v3.1c-1.7-.4-3.4.7-3.4 2.4 0 1.4 1.1 2.6 2.6 2.6 1.6 0 2.7-1.1 2.7-3V3z" />
  </svg>
);
