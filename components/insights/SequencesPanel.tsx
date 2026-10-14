// components/insights/SequencesPanel.tsx
// The Sequences card on a client's admin page: draft the five follow-ups with
// Claude, read and edit each step, turn them on one at a time, set the review and
// booking links, upload the past-customer list with the consent attestation,
// start a follow-up by hand for a recent lead, and see how many follow-ups are
// running and why some stopped. Hidden for Essentials. Nothing sends from here.
'use client';

import { useId, useMemo, useState } from 'react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import { parsePastCustomers } from '@/lib/pastCustomersShared';
import { SMS_MAX_CHARS } from '@/lib/phoneShared';
import { stopReasonLabel } from '@/lib/sequenceAdmin';
import {
  KIND_RULES, PLACEHOLDERS, SEQUENCE_LABELS, formatOffset, missingLinks, templateVars,
  type SequenceStep, type SequenceTemplateView, type SequencesAdminData, type TemplateVars,
} from '@/lib/sequenceShared';

type Reply = SequencesAdminData & { notice?: string; error?: string };

const linkVars = (reviewLink: string | null, bookingLink: string | null): TemplateVars =>
  templateVars({ contactName: null, businessName: null, clientName: null, reviewLink, bookingLink });

export function SequencesPanel({ token, tier, initial }: { token: string; tier: string; initial: SequencesAdminData }) {
  const [data, setData] = useState<SequencesAdminData>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewLink, setReviewLink] = useState(initial.settings.reviewLink ?? '');
  const [bookingLink, setBookingLink] = useState(initial.settings.bookingLink ?? '');
  const [csv, setCsv] = useState<{ name: string; text: string } | null>(null);
  const [attest, setAttest] = useState(false);
  const preview = useMemo(() => (csv ? parsePastCustomers(csv.text) : null), [csv]);
  const ids = useId();

  if (tier === 'essentials') return null;

  async function call(label: string, method: 'POST' | 'PUT', body: Record<string, unknown>): Promise<boolean> {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/sequences`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json().catch(() => null)) as Reply | null;
      if (!res.ok || !json || json.error) throw new Error(json?.error || `Request failed (${res.status})`);
      setData({
        templates: json.templates, settings: json.settings, counts: json.counts, customers: json.customers,
        smsReady: json.smsReady, canDraft: json.canDraft, recentLeads: json.recentLeads, stops: json.stops,
      });
      if (json.notice) setNotice(json.notice);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    } finally {
      setBusy(null);
    }
  }

  function draft() {
    if (!window.confirm('Replace all five sequences with a fresh Claude draft? Every sequence turns off, and follow-ups already running stop, until you review them and turn them back on.')) return;
    void call('draft', 'POST', { action: 'draft' });
  }

  async function pickFile(file: File | undefined) {
    setAttest(false);
    setCsv(file ? { name: file.name, text: await file.text() } : null);
  }

  async function upload() {
    if (!csv || !attest) return;
    if (await call('import', 'POST', { action: 'import', csv: csv.text, attest: true })) {
      setCsv(null);
      setAttest(false);
    }
  }

  const on = data.templates.filter((t) => t.enabled).length;
  const vars = linkVars(data.settings.reviewLink, data.settings.bookingLink);
  const stopped = data.stops.reduce((n, s) => n + s.n, 0);
  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Follow-up sequences</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">
            {on} of {data.templates.length} on
          </h2>
        </div>
        <button type="button" className={btn('secondary', 'sm')} disabled={!data.canDraft || busy !== null} onClick={draft}>
          {busy === 'draft' ? 'Drafting…' : 'Draft with Claude'}
        </button>
      </div>
      {!data.canDraft ? <p className="mt-2 text-xs text-amber-800">Drafting is off: ANTHROPIC_API_KEY is not set in Vercel.</p> : null}
      <p className="mt-2 text-sm text-neutral-600">
        Claude writes from the portal&apos;s &ldquo;How you sell&rdquo;, review and offer answers, and changes only the words. Read every step before turning a sequence on. Nothing sends while a sequence is off, and nothing sends between 8 pm and 8 am in the client&apos;s time zone.
      </p>
      {!data.smsReady ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Texting is not approved for this client yet (see the Phone card). Sequences with text steps cannot be turned on until it is.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${ids}-review`} className={adminLabel}>Google review link</label>
          <input id={`${ids}-review`} className={adminInput} value={reviewLink} placeholder="https://g.page/r/…/review" onChange={(e) => setReviewLink(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${ids}-booking`} className={adminLabel}>Booking link (optional)</label>
          <input id={`${ids}-booking`} className={adminInput} value={bookingLink} placeholder="https://…" onChange={(e) => setBookingLink(e.target.value)} />
        </div>
        <button type="button" className={btn('secondary')} disabled={busy !== null} onClick={() => void call('links', 'POST', { action: 'links', reviewLink, bookingLink })}>
          Save links
        </button>
      </div>

      <ul className="mt-6 space-y-3">
        {data.templates.map((t) => (
          <TemplateEditor
            key={`${t.kind}:${t.updatedAt ?? 'default'}`}
            t={t}
            counts={data.counts[t.kind]}
            busy={busy !== null}
            vars={vars}
            onSave={(steps, enabled) => call(`save-${t.kind}`, 'PUT', { kind: t.kind, steps, enabled })}
          />
        ))}
      </ul>

      {stopped > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Why follow-ups stopped</p>
          <ul className="mt-1 text-sm text-neutral-700">
            {data.stops.map((s) => (
              <li key={s.reason}>
                {stopReasonLabel(s.reason)}: {s.n}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 border-t border-neutral-100 pt-5">
        <p className="font-semibold text-neutral-950">Start a follow-up by hand</p>
        <p className="text-xs text-neutral-500">
          The last {data.recentLeads.length || 10} form leads. Starts the new-lead follow-up for that person even if the lead has moved on. It does nothing if one is already running or the sequence is off.
        </p>
        {data.recentLeads.length ? (
          <ul className="mt-2 divide-y divide-neutral-100 text-sm">
            {data.recentLeads.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0 text-neutral-800">
                  {l.name || 'No name'} · {l.maskedPhone ?? (l.hasEmail ? 'email only' : 'no contact')} · {l.stage}
                </span>
                <button type="button" className={btn('secondary', 'sm')} disabled={busy !== null} onClick={() => void call(`lead-${l.id}`, 'POST', { action: 'start_lead', id: l.id })}>
                  {busy === `lead-${l.id}` ? 'Starting…' : 'Start follow-up'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">No form leads yet.</p>
        )}
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-5">
        <p className="font-semibold text-neutral-950">Past customers</p>
        <p className="text-xs text-neutral-500">
          {data.customers.total} on file · {data.customers.consented} cleared to text. A CSV with a phone column; name, email and last job date are optional. Up to 2,000 rows. The check-in goes out in the first week of January, April, July and October.
        </p>
        <label htmlFor={`${ids}-csv`} className={`${adminLabel} mt-3`}>CSV file</label>
        <input id={`${ids}-csv`} type="file" accept=".csv,text/csv" className="block text-sm" onChange={(e) => void pickFile(e.target.files?.[0])} />
        {preview && csv ? (
          <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm">
            <p>
              {csv.name}: {preview.rows.length} customers with a US cell number{preview.skipped.length ? `, ${preview.skipped.length} rows skipped` : ''}.
            </p>
            <label className="mt-2 flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
              <span>
                The client confirmed these people are their past customers and agreed to get texts from the business (for example, they gave their cell number when they booked). Axeon records this confirmation with today&apos;s date.
              </span>
            </label>
            <button type="button" className={`${btn('primary', 'sm')} mt-3`} disabled={!attest || busy !== null || preview.rows.length === 0} onClick={() => void upload()}>
              Upload {preview.rows.length} customers
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TemplateEditor({
  t,
  counts,
  busy,
  vars,
  onSave,
}: {
  t: SequenceTemplateView;
  counts: { active: number; done: number; stopped: number };
  busy: boolean;
  vars: TemplateVars;
  onSave: (steps: SequenceStep[], enabled: boolean) => Promise<boolean>;
}) {
  const rule = KIND_RULES[t.kind];
  const label = SEQUENCE_LABELS[t.kind];
  const [steps, setSteps] = useState<SequenceStep[]>(t.steps);
  const [open, setOpen] = useState(false);
  const id = useId();

  const update = (i: number, patch: Partial<SequenceStep>) => setSteps((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addStep = () =>
    setSteps((all) => {
      const last = all[all.length - 1]?.offsetMinutes ?? rule.minOffset;
      const offsetMinutes = Math.min(rule.maxOffset, last + (rule.maxOffset <= 0 ? 60 : 1440));
      return [...all, { offsetMinutes, channel: 'sms', subject: null, body: '' }];
    });
  const source = t.isDefault ? 'Default copy' : t.draftedBy === 'claude' ? 'Drafted by Claude' : 'Edited by Axeon';
  // The server refuses to turn a template on while a link it uses is empty; show it here too.
  const needs = missingLinks(steps, vars);
  const blockedOn = !t.enabled && needs.length > 0;

  function toggle(next: boolean) {
    if (next && !window.confirm(`Turn on "${label.title}"? Real customers will get these messages. Have you read every step?`)) return;
    void onSave(steps, next);
  }

  return (
    <li className="rounded-xl border border-neutral-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-neutral-950">{label.title}</p>
          <p className="text-xs text-neutral-500">{label.trigger}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {source} · {counts.active} running · {counts.done} finished · {counts.stopped} stopped
          </p>
          {blockedOn ? (
            <p className="mt-1 text-xs text-amber-800">
              Add the {needs.map((p) => (p === 'review_link' ? 'Google review link' : 'booking link')).join(' and ')} above before turning this on.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor={`${id}-on`} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <input id={`${id}-on`} type="checkbox" checked={t.enabled} disabled={busy || blockedOn} onChange={(e) => toggle(e.target.checked)} /> On
          </label>
          <button type="button" className={btn('secondary', 'sm')} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Read and edit'}
          </button>
        </div>
      </div>
      {open ? (
        <div className="mt-4 space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="rounded-lg bg-neutral-50 p-3">
              <div className="grid gap-3 sm:grid-cols-[10rem_8rem_1fr]">
                <div>
                  <label htmlFor={`${id}-${i}-wait`} className={adminLabel}>Wait (minutes)</label>
                  <input id={`${id}-${i}-wait`} className={adminInput} type="number" step={5} value={s.offsetMinutes} onChange={(e) => update(i, { offsetMinutes: Number(e.target.value) })} />
                  <p className="mt-1 text-xs text-neutral-500">{formatOffset(s.offsetMinutes)}</p>
                </div>
                <div>
                  <label htmlFor={`${id}-${i}-channel`} className={adminLabel}>Send as</label>
                  <select
                    id={`${id}-${i}-channel`}
                    className={adminInput}
                    value={s.channel}
                    disabled={rule.smsOnly}
                    onChange={(e) => update(i, e.target.value === 'email' ? { channel: 'email', subject: s.subject ?? '' } : { channel: 'sms', subject: null })}
                  >
                    <option value="sms">Text</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                {s.channel === 'email' ? (
                  <div>
                    <label htmlFor={`${id}-${i}-subject`} className={adminLabel}>Subject</label>
                    <input id={`${id}-${i}-subject`} className={adminInput} value={s.subject ?? ''} onChange={(e) => update(i, { subject: e.target.value })} />
                  </div>
                ) : (
                  <div />
                )}
              </div>
              <label htmlFor={`${id}-${i}-body`} className={`${adminLabel} mt-3`}>Message</label>
              <textarea id={`${id}-${i}-body`} className={adminInput} rows={s.channel === 'email' ? 7 : 3} value={s.body} onChange={(e) => update(i, { body: e.target.value })} />
              <div className="mt-1 flex justify-between text-xs text-neutral-500">
                <span>{s.channel === 'sms' ? `${s.body.length} / ${SMS_MAX_CHARS}` : `${s.body.length} characters`}</span>
                {steps.length > rule.minSteps ? (
                  <button type="button" className="text-red-700 hover:underline" onClick={() => setSteps((all) => all.filter((_, j) => j !== i))}>
                    Remove step
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <p className="text-xs text-neutral-500">
            Blanks: {PLACEHOLDERS.map((p) => `{${p}}`).join(' ')}. The first text always ends with &ldquo;Reply STOP to opt out.&rdquo; The wait counts from{' '}
            {t.kind === 'reminder' ? 'the appointment (negative means before it)' : 'when the sequence starts'}.
          </p>
          <div className="flex flex-wrap gap-2">
            {steps.length < rule.maxSteps ? (
              <button type="button" className={btn('ghost', 'sm')} onClick={addStep}>
                Add step
              </button>
            ) : null}
            <button
              type="button"
              className={btn('primary', 'sm')}
              disabled={busy}
              onClick={async () => {
                if (await onSave(steps, t.enabled)) setOpen(false);
              }}
            >
              Save
            </button>
            <button type="button" className={btn('ghost', 'sm')} onClick={() => setSteps(t.steps)}>
              Undo changes
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
