'use client';
import { useEffect, useState } from 'react';
import { countdown } from '@/lib/pricing';

/** Live "4d 03h 12m" countdown. Re-renders only itself, every 15 seconds. */
export function Countdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabnum" suppressHydrationWarning>
      {countdown(endsAt, now)}
    </span>
  );
}
