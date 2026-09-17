'use client';

import { usePathname } from 'next/navigation';
import { useLeadModal } from '@/components/common/LeadModalProvider';

export function SideTabCTA() {
  const { open } = useLeadModal();
  const pathname = usePathname();

  if (pathname === '/book') return null;

  return (
    <button
      type="button"
      onClick={open}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 origin-right rotate-90 translate-x-1/2 px-5 py-3 rounded-t-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg transition-colors cursor-pointer"
    >
      Get Started
    </button>
  );
}
