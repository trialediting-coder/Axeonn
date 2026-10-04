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
      onClick={() => open('side_tab')}
      className="hidden sm:block fixed right-0 top-1/2 -translate-y-1/2 z-40 [writing-mode:vertical-rl] px-2.5 py-4 rounded-l-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg transition-colors cursor-pointer"
    >
      Book a Call
    </button>
  );
}
