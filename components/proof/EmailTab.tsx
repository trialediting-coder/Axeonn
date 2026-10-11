// components/proof/EmailTab.tsx
// The business email every plan includes, as the client sees it: their
// mailboxes, the four spam-protection checks in plain words, how to get it on
// their phone, and one form for anything they need (lib/businessEmail.ts).
// Never a password: Google sends sign-ins straight to each person. Server
// component; the request form is the only client piece.
import { CheckCircle2, CircleAlert, CircleDashed, ExternalLink, Inbox, ShieldCheck, Smartphone } from 'lucide-react';
import {
  DNS_CHECKS,
  OUTLOOK_NOTE,
  REQUEST_KINDS,
  SETUP_GUIDES,
  activeMailboxes,
  dnsSummary,
  EXTRA_MAILBOX_PRICE,
  gmailUrl,
  mailboxAllowance,
  mailboxCount,
  openRequests,
  type BusinessEmailSetup,
  type CheckStatus,
} from '@/lib/businessEmailShared';
import { EmailRequestForm } from '@/components/proof/EmailRequestForm';
import { TIER_LABELS, type OnboardingTier } from '@/data/onboardingItems';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const CHECK_LOOK: Record<CheckStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  pass: { label: 'On', cls: 'text-emerald-700', icon: CheckCircle2 },
  warn: { label: 'Finishing', cls: 'text-amber-700', icon: CircleDashed },
  fail: { label: 'Not yet', cls: 'text-neutral-500', icon: CircleAlert },
};

const SUMMARY: Record<ReturnType<typeof dnsSummary>, { title: string; body: string; cls: string }> = {
  protected: { title: 'Fully protected', body: 'Your emails land in inboxes, and no one can send email pretending to be you.', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200' },
  finishing: { title: 'Almost there', body: 'Email works. We are tightening the last protection, which takes a couple of weeks to do safely.', cls: 'bg-amber-50 text-amber-900 ring-amber-200' },
  attention: { title: 'Being set up', body: 'We are still connecting your domain. Nothing for you to do; this updates by itself.', cls: 'bg-neutral-50 text-neutral-800 ring-neutral-200' },
  unknown: { title: 'Checks start once your domain is connected', body: 'Nothing for you to do; this updates by itself.', cls: 'bg-neutral-50 text-neutral-800 ring-neutral-200' },
};

export function EmailTab({ setup, tier, preview }: { setup: BusinessEmailSetup | null; tier: OnboardingTier; preview: boolean }) {
  const mailboxes = setup?.mailboxes ?? [];
  const live = setup ? activeMailboxes(setup) : [];
  const open = setup ? openRequests(setup) : [];
  const summary = SUMMARY[dnsSummary(setup?.dns ?? null)];
  const allowance = mailboxAllowance(tier, setup);

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Business email</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Your email at your own domain, on Google Workspace. Google sends each person their own sign-in, so we never see or ask for a password.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <Inbox size={16} className="text-neutral-400" /> Your mailboxes
            </p>
            {live.length > 0 ? (
              <a
                href={gmailUrl(setup?.domain ?? null)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Open my inbox <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
          {mailboxes.length > 0 ? (
            <ul className="mt-3 divide-y divide-neutral-100">
              {mailboxes.map((m) => (
                <li key={m.address} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-neutral-950">{m.address}</p>
                    {m.person ? <p className="text-xs text-neutral-500">{m.person}</p> : null}
                  </div>
                  {m.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Setting up
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">
              We are setting up your mailbox from the addresses on your setup page. When it is ready you will get an email from us, and a separate sign-in email from Google.
            </p>
          )}
          <p className="mt-3 text-xs text-neutral-500">
            {TIER_LABELS[tier]} includes {mailboxCount(allowance.included)}
            {allowance.used > 0 ? `; you are using ${allowance.used}` : ''}.
            {allowance.extra > 0 ? ` ${allowance.extra} extra at $${EXTRA_MAILBOX_PRICE}/mo each.` : allowance.left > 0 && allowance.used > 0 ? ` ${allowance.left} more included at no cost.` : ''} Addresses like info@ that deliver into a mailbox are always free.
          </p>
          {live.length > 0 ? (
            <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
              First time? Look for the sign-in email from Google in the personal inbox you gave us (check spam too). It lets you choose your own password.
              {setup?.liveSentAt ? ` We sent the details on ${day(setup.liveSentAt)}.` : ''}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <Smartphone size={16} className="text-neutral-400" /> On your phone and computer
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {SETUP_GUIDES.map((g) => (
              <li key={g.label}>
                <a href={g.href} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                  {g.label}
                </a>
                <p className="text-xs text-neutral-500">{g.note}</p>
              </li>
            ))}
            <li className="text-xs text-neutral-500">{OUTLOOK_NOTE}</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <p className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <ShieldCheck size={16} className="text-neutral-400" /> Spam protection
          </p>
          <div className={`mt-3 rounded-lg px-4 py-3 ring-1 ${summary.cls}`}>
            <p className="text-sm font-semibold">{summary.title}</p>
            <p className="mt-0.5 text-xs opacity-80">{summary.body}</p>
          </div>
          {setup?.dns ? (
            <>
              <ul className="mt-3 divide-y divide-neutral-100">
                {DNS_CHECKS.map((c) => {
                  const look = CHECK_LOOK[setup.dns!.checks[c.key]?.status ?? 'fail'];
                  const Icon = look.icon;
                  return (
                    <li key={c.key} className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{c.label}</p>
                        <p className="text-xs text-neutral-500">{c.plain}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${look.cls}`}>
                        <Icon size={15} /> {look.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-neutral-400">Checked {new Date(setup.dns.checkedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} for {setup.dns.domain}.</p>
            </>
          ) : null}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-medium text-neutral-600">Need something?</p>
          <p className="mt-1 text-xs text-neutral-500">A new mailbox, someone locked out, anything. We handle it within one business day.</p>
          {open.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {open.map((q) => (
                <li key={q.id} className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-950">
                  <span className="font-semibold">{REQUEST_KINDS.find((k) => k.kind === q.kind)?.label ?? 'Request'}</span> · {day(q.at)}
                  <p className="mt-0.5 text-blue-900/80">{q.detail}</p>
                  <p className="mt-1 font-semibold text-blue-700">We are on it</p>
                </li>
              ))}
            </ul>
          ) : null}
          <EmailRequestForm preview={preview} included={allowance.left > 0} />
        </div>
      </div>
    </div>
  );
}
