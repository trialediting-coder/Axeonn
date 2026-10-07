'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLeadModal } from '@/components/common/LeadModalProvider';

/** The "Book My Free Call" edge tab. Hidden on the first screen (the hero has its
 *  own buttons); it slides in once the visitor scrolls past it. */
export function SideTabCTA() {
  const { open } = useLeadModal();
  const pathname = usePathname();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const check = () => setPastHero(window.scrollY > window.innerHeight * 0.85);
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [pathname]);

  if (pathname === '/book') return null;

  return (
    <button
      type="button"
      onClick={() => open('side_tab')}
      aria-hidden={!pastHero}
      tabIndex={pastHero ? 0 : -1}
      className={`hidden sm:block fixed right-0 top-1/2 -translate-y-1/2 z-40 [writing-mode:vertical-rl] px-2.5 py-4 rounded-l-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg transition-all duration-300 cursor-pointer ${
        pastHero ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      Book My Free Call
    </button>
  );
}
