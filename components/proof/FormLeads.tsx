// "Messages from your website form": every form a visitor sent through the
// client's site (slice 2, lib/leads.ts), with the name, a masked phone, the
// page, and whether the owner took the call connect call. The rows arrive
// pre-masked (toDashboardSubmission); the full details are in the lead email.
import { PhoneCall } from 'lucide-react';
import { LeadStageTaps } from '@/components/proof/LeadStageTaps';
import type { DashboardSubmission } from '@/lib/leadShared';

export interface FormMonth {
  month: string;
  label: string;
  rows: DashboardSubmission[];
}

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

const pageName = (path: string) => (!path || path === '/' ? 'Home page' : path.replace(/^\//, '').replace(/[-_/]+/g, ' '));

export function FormLeads({ months, stageApi = null }: { months: FormMonth[]; stageApi?: string | null }) {
  const total = months.reduce((n, m) => n + m.rows.length, 0);
  const calledBack = months.reduce((n, m) => n + m.rows.filter((r) => r.calledBack).length, 0);
  return (
    <section className="mt-4 rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold text-neutral-950">Messages from your website form</h2>
          <span className="text-sm text-neutral-500">
            {total} {total === 1 ? 'message' : 'messages'}
            {calledBack ? ` · ${calledBack} called back` : ''}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          The full message and phone number are in the email we send you for each one. <span className="font-semibold text-neutral-700">Called back</span> means you pressed 1 on our call and we dialed them for you.
        </p>
      </div>
      {months.map((m) =>
        m.rows.length ? (
          <div key={m.month}>
            <h3 className="bg-neutral-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 sm:px-6">{m.label}</h3>
            <ul className="divide-y divide-neutral-100">
              {m.rows.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold text-neutral-950">{r.name}</span>
                      <span className="text-neutral-500">{when(r.at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">{[r.phone, pageName(r.page)].filter(Boolean).join(' · ')}</p>
                  </div>
                  {r.calledBack ? (
                    <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 sm:self-center">
                      <PhoneCall size={12} /> Called back
                    </span>
                  ) : null}
                  <LeadStageTaps id={r.id} stage={r.stage} quoteSent={r.quoteSent} api={stageApi} />
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}
