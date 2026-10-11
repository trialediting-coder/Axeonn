'use client';

// components/proof/ActiveTabIntoView.tsx
// The phone tab row scrolls sideways; when a later tab (Ads, Billing) is open,
// its chip would start off screen. On load, slide the row so the open chip
// sits in view. Sets scrollLeft only, so the page itself never jumps.
import { useEffect, useRef } from 'react';

export function ActiveTabIntoView() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const nav = ref.current?.parentElement;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const right = active.offsetLeft + active.offsetWidth;
    if (active.offsetLeft < nav.scrollLeft || right > nav.scrollLeft + nav.clientWidth) {
      nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    }
  }, []);
  return <span ref={ref} hidden />;
}
