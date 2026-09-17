import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';

export function BrowserFrame({ url, children, dark }: { url: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
      <div className={`flex items-center gap-3 px-3.5 py-2.5 ${dark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div
          className={`flex-1 flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono truncate ${
            dark ? 'bg-neutral-800 text-neutral-400' : 'bg-white text-neutral-500'
          }`}
        >
          <Lock size={9} className="shrink-0" />
          <span className="truncate">{url}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
