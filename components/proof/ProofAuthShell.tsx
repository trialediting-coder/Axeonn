// components/proof/ProofAuthShell.tsx
// The signed-out AxeonPROOF screen (sign in, forgot, reset), in Axeon's own
// visual language from the marketing site: warm off-white, mono bracket labels,
// heavy display type. The right panel shows what makes AxeonPROOF different, a
// feed of customers with where each one came from (sample data, labelled).
import type { ReactNode } from 'react';
import { CalendarCheck, FileText, PhoneCall } from 'lucide-react';
import { AxeonLogo, AxeonMark } from '@/components/brand/AxeonLogo';

const SAMPLE_FEED = [
  { icon: PhoneCall, title: 'New call', source: 'Google Maps listing', time: '2m ago', tone: 'text-blue-300 bg-blue-500/15' },
  { icon: FileText, title: 'Quote request', source: 'Website · Ceramic coating page', time: '18m ago', tone: 'text-amber-300 bg-amber-500/15' },
  { icon: CalendarCheck, title: 'Job booked', source: 'Online booking · Tue 9:00am', time: '1h ago', tone: 'text-emerald-300 bg-emerald-500/15' },
  { icon: PhoneCall, title: 'New call', source: 'Website · Contact page', time: '3h ago', tone: 'text-blue-300 bg-blue-500/15' },
];

function SourceFeed() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-neutral-400">Today</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Sample</span>
      </div>
      <ul className="space-y-2.5">
        {SAMPLE_FEED.map(({ icon: Icon, title, source, time, tone }, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-sm"
            style={{ opacity: 1 - i * 0.16 }}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="truncate text-xs text-neutral-400">
                <span className="text-neutral-500">from</span> {source}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-neutral-500">{time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProofAuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F7F6F3] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-16">
        <AxeonLogo product="PROOF" />
        <div className="my-auto w-full max-w-sm py-12">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-600">[ Client sign in ]</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-950">{title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{subtitle}</p>
          <div className="mt-9">{children}</div>
        </div>
        <p className="text-xs text-neutral-500">
          © Axeon Studio ·{' '}
          <a href="https://axeonstudio.co/privacy" className="hover:text-neutral-800">
            Privacy
          </a>{' '}
          ·{' '}
          <a href="https://axeonstudio.co/terms" className="hover:text-neutral-800">
            Terms
          </a>
        </p>
      </section>

      <section className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:flex-col lg:justify-center lg:gap-14 lg:px-16 lg:py-14">
        <AxeonMark className="pointer-events-none absolute -bottom-24 -right-28 h-[560px] w-auto text-white/[0.035]" />
        <div className="relative">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-400">[ AxeonPROOF ]</p>
          <h2 className="mt-4 max-w-md font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-white">
            Customers,
            <br />
            not clicks.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-neutral-400">
            See every call, lead and booked job, and exactly what brought each one in.
          </p>
        </div>
        <div className="relative">
          <SourceFeed />
        </div>
      </section>
    </main>
  );
}

/** Form controls for the auth screen, matching the marketing site's inputs. */
export const proofInput =
  'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[15px] text-neutral-950 placeholder:text-neutral-400 transition-colors focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 aria-[invalid=true]:border-red-500';

export const proofLabel = 'block text-sm font-semibold text-neutral-800';

export const proofButton =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50';
