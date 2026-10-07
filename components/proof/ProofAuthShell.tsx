// components/proof/ProofAuthShell.tsx
// The signed-out AxeonPROOF screen (sign in, forgot, reset). A dark page with the
// Axeon slash motif behind one centered card: the form on the left, a product
// showcase with a sample dashboard on the right (hidden on phones).
import type { ReactNode } from 'react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_60%)]" />
      {/* The two slanted bars of the Axeon mark, scaled up across the page. */}
      <div className="absolute -top-40 left-[18%] h-[140%] w-40 -skew-x-[18deg] bg-gradient-to-b from-blue-600/25 via-blue-600/10 to-transparent" />
      <div className="absolute -top-40 left-[32%] h-[140%] w-40 -skew-x-[18deg] bg-gradient-to-b from-blue-500/15 via-blue-500/5 to-transparent" />
      <div className="absolute -bottom-40 right-[12%] h-[120%] w-56 -skew-x-[18deg] bg-gradient-to-t from-blue-700/25 via-blue-700/10 to-transparent" />
    </div>
  );
}

function SampleDashboard() {
  const bars = [38, 52, 46, 64, 58, 72, 66, 84, 78, 92, 88, 100];
  const tiles = [
    { label: 'Calls', value: '128', delta: '+18%' },
    { label: 'Leads', value: '64', delta: '+24%' },
    { label: 'Booked jobs', value: '41', delta: '+12%' },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md rounded-xl border border-white/10 bg-white p-4 shadow-2xl shadow-blue-950/50">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold text-neutral-900">Overview</span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-500">
          Sample
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-neutral-200 p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">{t.label}</p>
            <p className="mt-1 text-base font-extrabold text-neutral-950">{t.value}</p>
            <p className="text-[9px] font-semibold text-emerald-600">{t.delta}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-neutral-200 p-2.5">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Leads by week</p>
        <div className="flex h-20 items-end gap-1">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-blue-600/85" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProofAuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#07090D] px-4 py-10 sm:px-8">
      <Backdrop />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0D1017] shadow-2xl shadow-black/60 md:grid-cols-2">
        <section className="px-6 py-10 sm:px-10 sm:py-12">
          <AxeonLogo product="PROOF" tone="light" />
          <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </section>

        <section className="relative hidden overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#0B1A3A] via-[#0A1430] to-[#070B16] px-10 py-12 md:flex md:flex-col">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="relative text-center">
            <p className="text-4xl font-light tracking-tight text-white">
              Axeon<span className="font-black text-blue-500">PROOF</span>
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-300/70">by Axeon Studio</p>
            <p className="mx-auto mt-6 max-w-xs text-sm leading-relaxed text-neutral-300">
              Every call, lead and booked job, and exactly where each one came from.
            </p>
            <p className="mt-5 text-lg font-bold text-white">
              No guesswork. <span className="text-blue-400">Just proof.</span>
            </p>
          </div>
          <div className="relative mt-auto pt-10">
            <SampleDashboard />
          </div>
        </section>
      </div>
    </main>
  );
}

/** Dark form controls for the auth card. */
export const proofInput =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[15px] text-white placeholder:text-neutral-500 transition-colors focus:outline-none focus:border-blue-500 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/15 aria-[invalid=true]:border-red-500/70';

export const proofLabel = 'block text-xs font-semibold text-neutral-300';

export const proofButton =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';
