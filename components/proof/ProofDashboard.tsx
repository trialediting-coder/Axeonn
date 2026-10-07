// components/proof/ProofDashboard.tsx
// What a signed-in client sees at app.axeonstudio.co. For now: their setup
// progress, what Axeon is working on, and the metric cards that go live at launch.
// No numbers are shown until a real data source feeds them.
import { Activity, CalendarCheck, Check, Clock, LogOut, MapPin, PhoneCall } from 'lucide-react';
import type { OnboardingItem } from '@/data/onboardingItems';
import type { ItemState, Onboarding, Progress } from '@/lib/onboarding';

const METRICS = [
  { icon: PhoneCall, label: 'Calls', note: 'Every call from your site and Google listing, with where it came from.' },
  { icon: Activity, label: 'Leads', note: 'Quote requests and form leads, the second they come in.' },
  { icon: CalendarCheck, label: 'Booked jobs', note: 'Jobs booked online or by phone, traced to their source.' },
  { icon: MapPin, label: 'Map rank', note: 'Where you show up on Google Maps for the services you sell.' },
];

export function ProofDashboard({
  email,
  onboarding,
  progress,
  planLabel,
  axeonItems,
  states,
  setupUrl,
}: {
  email: string;
  onboarding: Onboarding;
  progress: Progress;
  planLabel: string;
  axeonItems: OnboardingItem[];
  states: Record<string, ItemState>;
  setupUrl: string;
}) {
  const name = onboarding.businessName || onboarding.clientName || 'Your business';
  const setupDone = progress.clientDone >= progress.clientTotal;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-8">
          <span className="font-display text-lg font-black tracking-tight text-blue-600">//.</span>
          <span className="text-sm font-extrabold tracking-tight text-neutral-950">
            Axeon<span className="text-blue-600">PROOF</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">{email}</span>
            <form action="/api/proof/logout" method="post">
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                <LogOut size={13} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">{planLabel}</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">{name}</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Setting up. Live data starts at launch.
          </span>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map(({ icon: Icon, label, note }) => (
            <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <Icon size={16} className="text-blue-600" /> {label}
              </div>
              <p className="mt-3 font-display text-3xl font-extrabold text-neutral-300">—</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Live after launch</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">{note}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-2">
            <h2 className="text-base font-bold text-neutral-950">Your setup</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {setupDone ? 'Everything we need from you is in. Thank you.' : 'A few quick things from you get you live faster.'}
            </p>
            <div className="mt-5 flex items-center justify-between text-sm font-semibold text-neutral-700">
              <span>
                {progress.clientDone} of {progress.clientTotal} done
              </span>
              <span className="font-mono text-neutral-500">{progress.percent}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} />
            </div>
            <a
              href={setupUrl}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {setupDone ? 'Review my answers' : 'Continue setup'}
            </a>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-3">
            <h2 className="text-base font-bold text-neutral-950">What Axeon is working on</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {progress.axeonDone} of {progress.axeonTotal} set up
            </p>
            <ul className="mt-4 divide-y divide-neutral-100">
              {axeonItems.map((item) => {
                const done = states[item.key]?.status === 'done';
                return (
                  <li key={item.key} className="flex items-start gap-3 py-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        done ? 'bg-green-100 text-green-700' : 'border border-neutral-200 bg-white text-neutral-400'
                      }`}
                    >
                      {done ? <Check size={14} className="stroke-[3]" /> : <Clock size={13} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                      <p className="text-sm text-neutral-500">{done ? 'Set up' : item.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <p className="mt-10 text-center text-sm text-neutral-500">
          Questions? Call or text{' '}
          <a href="tel:+15154938017" className="font-semibold text-blue-600 hover:text-blue-700">
            (515) 493-8017
          </a>
          .
        </p>
      </main>
    </div>
  );
}
