// components/proof/ProofAuthShell.tsx
// The signed-out AxeonPROOF frame: a brand panel on the left (top on phones) and
// the form on the right. Used by sign-in, forgot password and reset.
import type { ReactNode } from 'react';
import { Activity, MapPin, PhoneCall, CalendarCheck } from 'lucide-react';

const POINTS = [
  { icon: PhoneCall, text: 'Every call, and which page or listing made the phone ring' },
  { icon: Activity, text: 'Every lead, the second it comes in' },
  { icon: CalendarCheck, text: 'Booked jobs, traced back to where they came from' },
  { icon: MapPin, text: 'Where you rank on the map for the services you sell' },
];

export function ProofAuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative overflow-hidden bg-neutral-950 px-6 py-10 text-white sm:px-12 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:py-14">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="font-display text-2xl font-black tracking-tight text-blue-500">//.</span>
          <span className="text-lg font-extrabold tracking-tight">
            Axeon<span className="text-blue-400">PROOF</span>
          </span>
        </div>
        <div className="relative mt-10 lg:mt-0 max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Proof your marketing is working.
          </h2>
          <ul className="mt-8 hidden space-y-4 sm:block">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-neutral-300">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-300">
                  <Icon size={16} />
                </span>
                <span className="text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-10 hidden text-xs text-neutral-500 lg:block">© Axeon Studio · Des Moines, Iowa</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:min-h-screen">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

export const proofInput =
  'w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 aria-[invalid=true]:border-red-500';

export const proofButton =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';
