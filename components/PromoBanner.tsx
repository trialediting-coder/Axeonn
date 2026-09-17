'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const STORAGE_KEY = 'axeon-promo-founding-5-dismissed';
const BANNER_HEIGHT = '44px';

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setDismissed(stored === '1');
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--promo-banner-h', mounted && !dismissed ? BANNER_HEIGHT : '0px');
  }, [mounted, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    window.localStorage.setItem(STORAGE_KEY, '1');
  };

  if (!mounted || dismissed) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] bg-blue-600 text-white flex items-center justify-center px-4 sm:px-6"
      style={{ height: BANNER_HEIGHT }}
    >
      <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm font-medium text-center min-w-0 pr-8 sm:pr-0">
        <span className="truncate sm:whitespace-normal">
          <strong className="font-bold hidden sm:inline">Founding Client Offer: </strong>
          <span className="hidden sm:inline">We're building our first </span>
          5 free websites<span className="hidden sm:inline"> at no cost</span> — spots limited.
        </span>
        <Link
          href="/book"
          className="shrink-0 px-2.5 sm:px-3 py-1 rounded-full bg-white text-blue-700 font-semibold text-[10px] sm:text-xs hover:bg-blue-50 transition-colors"
        >
          <span className="sm:hidden">Claim</span>
          <span className="hidden sm:inline">Claim Yours</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/15 transition-colors cursor-pointer shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
