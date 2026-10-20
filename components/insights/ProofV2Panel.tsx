'use client';

// components/insights/ProofV2Panel.tsx
// Admin, one client: which AxeonPROOF dashboard they see (v1 / v2), and for v2
// clients everything on the delivery schedule (data/deliverySchedule.ts): move
// the start date or a step, mark Axeon's steps done, phase notes, A2P status,
// layout / copy / staging review with pins, DNS and go-live (gated by the
// 48-hour review), the DBR sprint, citations, the page program with its
// uniqueness gate, search numbers, the six-month review and summary recipients.
// Every change posts to /api/admin/onboarding/<token>/v2 and gets the fresh view back.
import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import type { ProofV2View, ProgramPage } from '@/lib/proofV2';
import { DELIVERY_SCHEDULE } from '@/data/deliverySchedule';
import { DASHBOARD_VERSIONS, type ProofVersion } from '@/data/dashboardVersions';
import { FILING_STATUSES, NAP_DIRECTORIES, NAP_STATUSES, PHASE_STATUSES, dbrStartBlock, pageGate, shortDate, wordCount, type DbrStep } from '@/lib/proofV2Shared';
import { INDUSTRIES, INDUSTRY_LABELS, isIndustry, type Industry } from '@/data/industryWords';

type Post = (body: Record<string, unknown>) => Promise<boolean>;

function Box({ title, children, sub }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <details className="mt-3 rounded-xl border border-neutral-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-900">
        {title}
        {sub ? <span className="ml-2 font-normal text-neutral-500">{sub}</span> : null}
      </summary>
      <div className="border-t border-neutral-100 px-4 py-4">{children}</div>
    </details>
  );
}

const STATUS_LABEL: Record<string, string> = { completed: 'Completed', in_progress: 'In progress', pending: 'Pending', scheduled: 'Scheduled' };

export function ProofV2Panel({
  token,
  initialVersion,
  initial,
  initialIndustry = null,
  industryConfirmed = false,
}: {
  token: string;
  initialVersion: ProofVersion;
  initial: ProofV2View | null;
  /** Type of practice or firm (onboardings.industry): the words in the client's portal and dashboard. */
  initialIndustry?: Industry | null;
  /** The client picked it in the portal's first question (not only the agreement prefill). */
  industryConfirmed?: boolean;
}) {
  const [version, setVersion] = useState<ProofVersion>(initialVersion);
  const [industry, setIndustry] = useState<Industry | null>(initialIndustry);
  const [v, setV] = useState<ProofV2View | null>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const post: Post = async (body) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${token}/v2`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string | null; proofVersion?: ProofVersion; industry?: string | null; view?: ProofV2View | null; link?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      if (data.link) {
        window.open(data.link, '_blank', 'noopener');
        return true;
      }
      if (data.proofVersion) setVersion(data.proofVersion);
      if (data.industry !== undefined) setIndustry(isIndustry(data.industry) ? data.industry : null);
      setV(data.view ?? null);
      if (data.message) setMsg({ ok: true, text: data.message });
      return true;
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">AxeonPROOF dashboard</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-950">{DASHBOARD_VERSIONS.proof[version].label}</h2>
          <p className="mt-0.5 text-sm text-neutral-600">{version === 2 ? 'The 180-day delivery schedule on top of the v1 dashboard.' : 'The current dashboard. Existing clients stay here unless you switch them.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([1, 2] as const).map((n) => (
            <button key={n} type="button" disabled={busy || version === n} onClick={() => post({ action: 'version', version: n })} className={btn(version === n ? 'primary' : 'secondary', 'sm')}>
              {DASHBOARD_VERSIONS.proof[n].label}
            </button>
          ))}
          <a href={`/admin/onboarding/${token}/preview${version === 2 ? '?tab=program' : ''}`} className={btn('ghost', 'sm')}>
            Preview <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
        <span className="font-semibold">Type of practice</span>
        <select
          disabled={busy}
          value={industry ?? ''}
          onChange={(e) => post({ action: 'industry', industry: e.target.value || null })}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        >
          <option value="">Not set (neutral words)</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {INDUSTRY_LABELS[i]}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">{industryConfirmed ? 'Confirmed by the client in setup' : industry ? 'From the agreement or set here; the client confirms it in setup' : 'The client picks it in setup'}</span>
      </label>
      {msg ? <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'}`}>{msg.text}</p> : null}
      {version === 2 && v ? <V2Admin v={{ ...v, industry }} post={post} busy={busy} /> : version === 2 ? <p className="mt-3 text-sm text-neutral-500">Reload to see the v2 program.</p> : null}
    </section>
  );
}

function V2Admin({ v, post, busy }: { v: ProofV2View; post: Post; busy: boolean }) {
  const s = v.settings;
  return (
    <div className="mt-4">
      <Schedule v={v} post={post} busy={busy} />
      <Phase1 v={v} post={post} busy={busy} />
      <Phase2 v={v} post={post} busy={busy} />
      <Phase3 v={v} post={post} busy={busy} />
      <Box title="Phase 4 · Citations" sub={`${v.nap.synced}/${v.nap.total} synced · review requests sent: ${v.reviews.sent}${v.reviews.enabled ? '' : ' (review sequence off: switch it on in Sequences)'}`}>
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {NAP_DIRECTORIES.map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-neutral-700">{d.name}</span>
              <select disabled={busy} value={s.nap?.[d.key] ?? 'todo'} onChange={(e) => post({ action: 'nap', key: d.key, status: e.target.value })} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
                {NAP_STATUSES.map((x) => (
                  <option key={x} value={x}>
                    {x === 'na' ? 'n/a' : x}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </Box>
      <Phase5 v={v} post={post} busy={busy} />
      <Phase6 v={v} post={post} busy={busy} />
    </div>
  );
}

function Schedule({ v, post, busy }: { v: ProofV2View; post: Post; busy: boolean }) {
  const [start, setStart] = useState(v.settings.startAt ?? v.startAt);
  return (
    <Box title="Delivery schedule" sub={`Day ${v.day} · started ${shortDate(v.startAt)}${v.settings.startAt ? ' (moved)' : ''}`}>
      <div className="flex flex-wrap items-end gap-2">
        <label>
          <span className={adminLabel}>Day 1</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={adminInput} />
        </label>
        <button type="button" disabled={busy} onClick={() => post({ action: 'start', date: start })} className={btn('secondary', 'sm')}>
          Move start
        </button>
        {v.settings.startAt ? (
          <button type="button" disabled={busy} onClick={() => post({ action: 'start', date: null })} className={btn('ghost', 'sm')}>
            Back to agreement date
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-neutral-500">Axeon steps marked done show to the client on their planned date. Client approvals and live events show the moment they happen.</p>
      {v.milestones.map((m) => {
        const def = DELIVERY_SCHEDULE.find((p) => p.key === m.key)!;
        return (
          <div key={m.key} className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm font-semibold ${m.current ? 'text-blue-700' : 'text-neutral-900'}`}>
                {def.title} · {shortDate(m.from)}–{shortDate(m.to)}
              </p>
              <select disabled={busy} value={m.overridden ? m.status : ''} onChange={(e) => post({ action: 'phase', key: m.key, status: e.target.value || null, note: m.note ?? '' })} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
                <option value="">Status: auto ({STATUS_LABEL[m.status]})</option>
                {PHASE_STATUSES.map((x) => (
                  <option key={x} value={x}>
                    Set: {STATUS_LABEL[x]}
                  </option>
                ))}
              </select>
              <NoteInput initial={m.note ?? ''} placeholder="Phase note the client sees" onSave={(note) => post({ action: 'phase', key: m.key, status: m.overridden ? m.status : null, note })} busy={busy} />
            </div>
            <ul className="mt-1 divide-y divide-neutral-100 rounded-lg border border-neutral-100">
              {m.steps.map((st) => {
                const step = def.steps.find((x) => x.key === st.key)!;
                return (
                  <li key={st.key} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                    <label className="flex min-w-0 flex-1 items-center gap-2">
                      <input type="checkbox" disabled={busy || (!!step.auto && !v.settings.steps?.[st.key]?.doneAt && !!st.actualDoneAt)} checked={!!st.actualDoneAt} onChange={(e) => post({ action: 'step', key: st.key, done: e.target.checked })} />
                      <span className="truncate">{st.title}</span>
                      {step.auto ? <span className="shrink-0 text-[10px] uppercase text-neutral-400">auto</span> : null}
                    </label>
                    <span className="text-xs text-neutral-500">
                      {st.actualDoneAt ? `done ${shortDate(st.actualDoneAt)}${st.doneDate ? '' : ` · client sees ${shortDate(st.date)}`}` : st.state === 'waiting' ? 'overdue' : ''}
                    </span>
                    <input type="date" disabled={busy} defaultValue={st.date} onBlur={(e) => e.target.value !== st.date && post({ action: 'step', key: st.key, date: e.target.value })} className="rounded-md border border-neutral-300 px-2 py-1 text-xs" />
                    {st.shifted ? (
                      <button type="button" disabled={busy} onClick={() => post({ action: 'step', key: st.key, date: null })} className="text-xs text-blue-600">
                        reset
                      </button>
                    ) : null}
                    <NoteInput initial={st.note ?? ''} placeholder="Note (e.g. waiting on photos)" onSave={(note) => post({ action: 'step', key: st.key, note })} busy={busy} small />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </Box>
  );
}

function NoteInput({ initial, placeholder, onSave, busy, small = false }: { initial: string; placeholder: string; onSave: (v: string) => void; busy: boolean; small?: boolean }) {
  const [val, setVal] = useState(initial);
  return (
    <input
      value={val}
      disabled={busy}
      placeholder={placeholder}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => val !== initial && onSave(val)}
      className={`rounded-md border border-neutral-300 px-2 py-1 text-xs ${small ? 'w-44' : 'w-56'}`}
    />
  );
}

function Phase1({ v, post, busy }: { v: ProofV2View; post: Post; busy: boolean }) {
  const [brand, setBrand] = useState(v.settings.a2p?.brand ?? 'not_filed');
  const [campaign, setCampaign] = useState(v.settings.a2p?.campaign ?? 'not_filed');
  return (
    <Box title="Phase 1 · Phone + A2P 10DLC" sub={v.line ? `${v.line.smsReady ? 'texting ready' : 'texting pending'} · ${v.mcat.under30}/${v.mcat.textedBack} auto-texts under 30s` : 'no line yet (Phone panel)'}>
      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className={adminLabel}>Brand</span>
          <select value={brand} onChange={(e) => setBrand(e.target.value as typeof brand)} className={adminInput}>
            {FILING_STATUSES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={adminLabel}>Campaign</span>
          <select value={campaign} onChange={(e) => setCampaign(e.target.value as typeof campaign)} className={adminInput}>
            {FILING_STATUSES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled={busy} onClick={() => post({ action: 'a2p', brand, campaign })} className={btn('secondary', 'sm')}>
          Save
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">Texting itself only starts when the line is switched to ready in the Phone panel.</p>
      {/* For the carrier registration, from the signed agreement: nothing to retype. The EIN shows only on a tap. */}
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-neutral-50 p-3 text-xs">
        <dt className="text-neutral-500">Legal name</dt>
        <dd className="font-medium text-neutral-900">{v.signing?.legalName || '—'}</dd>
        <dt className="text-neutral-500">Authorized contact</dt>
        <dd className="font-medium text-neutral-900">{v.signing ? `${v.signing.signerName}, ${v.signing.signerTitle}` : '—'}</dd>
        <dt className="text-neutral-500">EIN</dt>
        <dd className="flex items-center gap-2 font-medium text-neutral-900">
          {v.signing?.einMasked ?? 'not on the agreement'}
          {v.signing?.einMasked ? (
            <button type="button" disabled={busy} onClick={() => post({ action: 'revealEin' })} className="font-semibold text-blue-600 underline underline-offset-2">
              Show for filing
            </button>
          ) : null}
        </dd>
      </dl>
    </Box>
  );
}

function Phase2({ v, post, busy }: { v: ProofV2View; post: Post; busy: boolean }) {
  const s = v.settings;
  const [items, setItems] = useState({ wireframe: { imageUrl: s.reviews?.wireframe?.imageUrl ?? '', url: s.reviews?.wireframe?.url ?? '' }, copy: { imageUrl: s.reviews?.copy?.imageUrl ?? '', url: s.reviews?.copy?.url ?? '' } });
  const [stg, setStg] = useState({ url: s.staging?.url ?? '', imageUrl: s.staging?.imageUrl ?? '' });
  const [callAt, setCallAt] = useState(s.staging?.callAt ? s.staging.callAt.slice(0, 16) : '');
  const [live, setLive] = useState((s.liveItems ?? ['Website', 'Tracked phone number', 'Missed-call auto-text', 'Online booking', 'Leads inbox in AxeonPROOF']).join('\n'));
  return (
    <Box title="Phase 2 · Build, approvals, staging, launch" sub={s.goLiveAt ? `live ${shortDate(s.goLiveAt)}` : `staging: ${v.staging.phase.replace('_', ' ')}`}>
      {(['wireframe', 'copy'] as const).map((stage) => {
        const it = s.reviews?.[stage];
        const pins = v.pins.filter((p) => p.stage === stage);
        return (
          <div key={stage} className="mb-5">
            <p className="text-sm font-semibold text-neutral-900">
              {stage === 'wireframe' ? 'Layout' : 'Copy'}: {it?.approvedAt ? `approved ${shortDate(it.approvedAt)}` : it?.sharedAt ? `shared ${shortDate(it.sharedAt)}, waiting on the client` : 'not shared'}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input value={items[stage].imageUrl} onChange={(e) => setItems({ ...items, [stage]: { ...items[stage], imageUrl: e.target.value } })} placeholder="Screenshot URL (full-page PNG/JPG)" className={adminInput} />
              <input value={items[stage].url} onChange={(e) => setItems({ ...items, [stage]: { ...items[stage], url: e.target.value } })} placeholder="Draft link" className={adminInput} />
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => post({ action: 'share', stage, ...items[stage] })} className={btn('primary', 'sm')}>
                  {it?.sharedAt ? 'Update' : 'Share'}
                </button>
                {it?.approvedAt ? (
                  <button type="button" disabled={busy} onClick={() => post({ action: 'reopen', stage })} className={btn('ghost', 'sm')}>
                    Reopen
                  </button>
                ) : null}
              </div>
            </div>
            <PinList pins={pins} post={post} busy={busy} />
          </div>
        );
      })}
      <div className="mb-5 border-t border-neutral-100 pt-4">
        <p className="text-sm font-semibold text-neutral-900">
          Staging review: {v.staging.phase.replace('_', ' ')}
          {v.staging.endsAt ? ` · window ends ${new Date(v.staging.endsAt).toLocaleString('en-US')}` : ''}
        </p>
        {s.staging?.changesNote && v.staging.phase === 'changes_requested' ? <p className="mt-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Client asked: {s.staging.changesNote}</p> : null}
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input value={stg.url} onChange={(e) => setStg({ ...stg, url: e.target.value })} placeholder="Staging link" className={adminInput} />
          <input value={stg.imageUrl} onChange={(e) => setStg({ ...stg, imageUrl: e.target.value })} placeholder="Screenshot URL (optional, for pins)" className={adminInput} />
          <button type="button" disabled={busy} onClick={() => post({ action: 'stagingReady', ...stg })} className={btn('primary', 'sm')}>
            {s.staging?.readyAt ? 'Mark ready again (new 48h)' : 'Mark staging ready (starts 48h)'}
          </button>
        </div>
        <PinList pins={v.pins.filter((p) => p.stage === 'staging')} post={post} busy={busy} />
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label>
            <span className={adminLabel}>Review call</span>
            <input type="datetime-local" value={callAt} onChange={(e) => setCallAt(e.target.value)} className={adminInput} />
          </label>
          <button type="button" disabled={busy} onClick={() => post({ action: 'stagingCall', at: callAt ? new Date(callAt).toISOString() : null })} className={btn('secondary', 'sm')}>
            Save call
          </button>
          <button type="button" disabled={busy || !!s.goLiveAt} onClick={() => post({ action: 'dns', undo: !!s.dnsCutoverAt })} className={btn(s.dnsCutoverAt ? 'ghost' : 'secondary', 'sm')}>
            {s.dnsCutoverAt ? `DNS switched ${shortDate(s.dnsCutoverAt)} (undo)` : 'Record DNS cutover'}
          </button>
        </div>
      </div>
      <div className="border-t border-neutral-100 pt-4">
        <p className="text-sm font-semibold text-neutral-900">{s.goLiveAt ? `Live since ${shortDate(s.goLiveAt)}${s.certificateSentAt ? ` · certificate emailed ${shortDate(s.certificateSentAt)}` : ''}` : 'Go-live + Launch Certificate'}</p>
        {!s.goLiveAt ? (
          <>
            <label className="mt-2 block">
              <span className={adminLabel}>What went live (one per line, shown on the certificate)</span>
              <textarea rows={4} value={live} onChange={(e) => setLive(e.target.value)} className={adminInput} />
            </label>
            {!v.goLive.ok ? <p className="mt-1 text-xs text-amber-800">{v.goLive.reason}</p> : null}
            <button type="button" disabled={busy || !v.goLive.ok} onClick={() => post({ action: 'goLive', liveItems: live.split('\n') })} className={`${btn('primary', 'sm')} mt-2`}>
              Go live and issue the certificate
            </button>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => post({ action: 'certificate' })} className={`${btn('secondary', 'sm')} mt-2`}>
            Email the certificate again
          </button>
        )}
      </div>
    </Box>
  );
}

function PinList({ pins, post, busy }: { pins: ProofV2View['pins']; post: Post; busy: boolean }) {
  if (!pins.length) return null;
  return (
    <ol className="mt-2 space-y-1 text-sm">
      {pins.map((p, i) => (
        <li key={p.id} className="flex items-center gap-2">
          <span className="w-5 text-right text-neutral-500">{i + 1}.</span>
          <span className={`flex-1 ${p.status === 'resolved' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
            {p.note} <span className="text-xs text-neutral-400">({p.author}, {Math.round(p.x)}%, {Math.round(p.y)}%)</span>
          </span>
          <button type="button" disabled={busy} onClick={() => post({ action: 'pinStatus', id: p.id, status: p.status === 'open' ? 'resolved' : 'open' })} className="text-xs text-blue-600">
            {p.status === 'open' ? 'Mark done' : 'Reopen'}
          </button>
        </li>
      ))}
    </ol>
  );
}

function Phase3({ v, post, busy }: { v: ProofV2View; post: Post; busy: boolean }) {
  const [steps, setSteps] = useState<DbrStep[]>(v.dbr.steps);
  // Law: the signing attorney by default; whoever actually reviewed can be typed over it.
  const [reviewer, setReviewer] = useState(v.settings.dbrReview?.reviewedBy ?? (v.industry === 'law' ? (v.signing?.signerName ?? '') : ''));
  const law = v.industry === 'law';
  const review = v.settings.dbrReview;
  // Recording the review saves the texts as the server will send them (with the attorney-advertising line); show those.
  useEffect(() => {
    if (review?.steps?.length) setSteps(review.steps);
  }, [review?.reviewedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const lawBlock = law ? dbrStartBlock('law', steps, review) : null;
  return (
    <Box title="Phase 3 · Reactivation sprint + pipeline" sub={`${v.dbr.imported} imported (${v.dbr.consented} consented) · ${v.dbr.status} · ${v.dbr.sent} sent · ${v.pipeline.totals.dbr} DBR + ${v.pipeline.totals.web} web booked`}>
      <p className="text-xs text-neutral-500">Import the list with the Past customers upload in the Sequences panel (consent required). The sprint texts each consented person 3 times; a reply stops their remaining texts; texts wait for 8 AM to 8 PM local.</p>
      {steps.map((st, i) => (
        <div key={i} className="mt-2 grid gap-2 sm:grid-cols-[5rem_1fr]">
          <label>
            <span className={adminLabel}>Day</span>
            <input type="number" min={0} max={7} disabled={v.dbr.status !== 'none'} value={st.day} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)))} className={adminInput} />
          </label>
          <label>
            <span className={adminLabel}>Text {i + 1} ({st.body.length}/320)</span>
            <textarea rows={2} disabled={v.dbr.status !== 'none'} value={st.body} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} className={adminInput} />
          </label>
        </div>
      ))}
      {law && v.dbr.status === 'none' ? (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p>Law firm: every text carries &ldquo;Attorney advertising.&rdquo; and the firm reviews the wording before the sprint can start. We do not judge the wording; the firm does.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Reviewed by (name)" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                disabled={busy}
                checked={!!review && !lawBlock}
                onChange={(e) => post(e.target.checked ? { action: 'dbrReviewed', steps, by: reviewer } : { action: 'dbrReviewed', on: false })}
              />
              The firm reviewed these texts
            </label>
          </div>
          {review ? <p className="mt-1 text-xs">{lawBlock ? lawBlock : `Reviewed by ${review.reviewedBy} on ${shortDate(review.reviewedAt)}.`}</p> : null}
        </div>
      ) : null}
      <div className="mt-3 flex gap-2">
        {v.dbr.status === 'none' ? (
          <button type="button" disabled={busy || !!lawBlock} onClick={() => confirm(`Start texting ${v.dbr.consented} past customers?`) && post({ action: 'dbrStart', steps })} className={btn('primary', 'sm')}>
            Start the sprint
          </button>
        ) : v.dbr.status === 'running' ? (
          <button type="button" disabled={busy} onClick={() => confirm('Stop the sprint? Unsent texts are cancelled.') && post({ action: 'dbrStop' })} className={btn('danger', 'sm')}>
            Stop the sprint
          </button>
        ) : null}
      </div>
      <p className="mt-4 text-sm font-semibold text-neutral-900">Pipeline Revenue Tracker {v.pipeline.average ? `(average $${v.pipeline.average})` : '(no average value set: Project panel)'}</p>
      {v.pipeline.rows.length ? (
        <ul className="mt-1 divide-y divide-neutral-100 text-sm">
          {v.pipeline.rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2 py-1.5">
              <span className="flex-1 truncate">
                {r.label} <span className="text-xs text-neutral-400">{r.source} · {shortDate(r.at)} · {r.key}</span>
              </span>
              <input
                type="number"
                min={0}
                defaultValue={v.settings.bookingValues?.[r.key] ?? ''}
                placeholder={v.pipeline.average ? String(v.pipeline.average) : '$'}
                onBlur={(e) => post({ action: 'bookingValue', key: r.key, value: e.target.value })}
                className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-xs"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-neutral-500">No booked appointments from reactivation or the website yet.</p>
      )}
    </Box>
  );
}

const blankPage = { id: 0, kind: 'location' as const, title: '', slug: '', intro: '', body: '' };

function Phase5({ v, post, busy }: { v: ProofV2View; post: Post; busy: boolean }) {
  const s = v.settings;
  const [edit, setEdit] = useState<Pick<ProgramPage, 'id' | 'kind' | 'title' | 'slug' | 'intro' | 'body'> | null>(null);
  const [idx, setIdx] = useState({ indexed: s.indexedOverride?.indexed ?? '', total: s.indexedOverride?.total ?? '' });
  const [org, setOrg] = useState({ month: new Date().toISOString().slice(0, 7), impressions: '', clicks: '', calls: '', forms: '', topKeywords: '' });
  const gate = edit ? pageGate({ id: edit.id, title: edit.title, intro: edit.intro, body: edit.body }, v.pages) : null;
  return (
    <Box title="Phase 5 · Pages, indexing, Harvest Report" sub={`${v.pages.length} planned · ${v.pages.filter((p) => p.status === 'published').length} published · ${v.pages.filter((p) => p.indexed).length} indexed`}>
      <ul className="divide-y divide-neutral-100 text-sm">
        {v.pages.map((p) => {
          const g = pageGate(p, v.pages);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-0 flex-1 truncate">
                {p.title} <span className="text-xs text-neutral-400">/{p.slug} · {p.kind}</span>
              </span>
              <span className={`text-xs ${g.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{g.ok ? `unique (${Math.round(g.maxSimilarity * 100)}% max overlap)` : 'fails gate'}</span>
              <button type="button" className="text-xs text-blue-600" onClick={() => setEdit(p)}>
                Edit
              </button>
              {p.status === 'planned' ? (
                <button type="button" disabled={busy || !g.ok} onClick={() => post({ action: 'publishPage', id: p.id })} className={btn('secondary', 'sm')}>
                  Publish
                </button>
              ) : (
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" disabled={busy} checked={p.indexed} onChange={(e) => post({ action: 'pageIndexed', id: p.id, indexed: e.target.checked })} /> Indexed
                </label>
              )}
              <button type="button" disabled={busy} onClick={() => confirm(`Delete "${p.title}"?`) && post({ action: 'deletePage', id: p.id })} className="text-xs text-red-600">
                Delete
              </button>
            </li>
          );
        })}
      </ul>
      {edit ? (
        <div className="mt-3 rounded-lg bg-neutral-50 p-3">
          <div className="grid gap-2 sm:grid-cols-[8rem_1fr_1fr]">
            <select value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as 'location' | 'procedure' })} className={adminInput}>
              <option value="location">Location</option>
              <option value="procedure">Procedure</option>
            </select>
            <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="Title (Dental implants in Ankeny)" className={adminInput} />
            <input value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} placeholder="slug (optional)" className={adminInput} />
          </div>
          <label className="mt-2 block">
            <span className={adminLabel}>Intro ({wordCount(edit.intro)} words, 40+)</span>
            <textarea rows={3} value={edit.intro} onChange={(e) => setEdit({ ...edit, intro: e.target.value })} className={adminInput} />
          </label>
          <label className="mt-2 block">
            <span className={adminLabel}>Body ({wordCount(edit.body)} words, 150+)</span>
            <textarea rows={8} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} className={adminInput} />
          </label>
          {gate && !gate.ok ? (
            <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">
              {gate.problems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-emerald-700">Passes the uniqueness gate.</p>
          )}
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={async () => (await post({ action: 'savePage', ...edit, id: edit.id || undefined })) && setEdit(null)} className={btn('primary', 'sm')}>
              Save page
            </button>
            <button type="button" onClick={() => setEdit(null)} className={btn('ghost', 'sm')}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEdit({ ...blankPage })} className={`${btn('secondary', 'sm')} mt-2`}>
          Plan a page
        </button>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={busy} checked={!!s.sitemapSubmittedAt} onChange={(e) => post({ action: 'sitemap', on: e.target.checked })} /> Sitemap submitted to Google
        </label>
        <label>
          <span className={adminLabel}>Indexed (Search Console)</span>
          <input value={idx.indexed} onChange={(e) => setIdx({ ...idx, indexed: e.target.value })} className={`${adminInput} w-24`} />
        </label>
        <label>
          <span className={adminLabel}>of total</span>
          <input value={idx.total} onChange={(e) => setIdx({ ...idx, total: e.target.value })} className={`${adminInput} w-24`} />
        </label>
        <button type="button" disabled={busy} onClick={() => post({ action: 'indexedOverride', ...idx })} className={btn('secondary', 'sm')}>
          Save count
        </button>
        {s.indexedOverride ? (
          <button type="button" disabled={busy} onClick={() => post({ action: 'indexedOverride', clear: true })} className={btn('ghost', 'sm')}>
            Use per-page ticks
          </button>
        ) : null}
      </div>
      <div className="mt-4 border-t border-neutral-100 pt-4">
        <p className="text-sm font-semibold text-neutral-900">Search numbers by month (from Search Console)</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
          <input type="month" value={org.month} onChange={(e) => setOrg({ ...org, month: e.target.value })} className={adminInput} />
          {(['impressions', 'clicks', 'calls', 'forms'] as const).map((k) => (
            <input key={k} value={org[k]} placeholder={k} onChange={(e) => setOrg({ ...org, [k]: e.target.value })} className={adminInput} />
          ))}
          <input value={org.topKeywords} placeholder="top 3 keywords, commas" onChange={(e) => setOrg({ ...org, topKeywords: e.target.value })} className={adminInput} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => post({ action: 'organic', ...org })} className={btn('secondary', 'sm')}>
            Save month
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={busy} checked={!!s.harvestPublishedAt} onChange={(e) => post({ action: 'harvest', on: e.target.checked })} /> Harvest Report published
          </label>
        </div>
        {Object.keys(s.organic ?? {}).length ? (
          <p className="mt-2 text-xs text-neutral-500">
            Saved:{' '}
            {Object.entries(s.organic ?? {})
              .sort()
              .map(([m, o]) => `${m}: ${o.impressions ?? '—'} impr / ${o.clicks ?? '—'} clicks`)
              .join(' · ')}
          </p>
        ) : null}
      </div>
    </Box>
  );
}

function Phase6({ v, post, busy }: { v: ProofV2View; post: Post; busy: boolean }) {
  const s = v.settings;
  const [date, setDate] = useState(s.sabr?.scheduledAt ?? '');
  const [m, setM] = useState({ name: s.manager?.name ?? '', email: s.manager?.email ?? '', phone: s.manager?.phone ?? '' });
  return (
    <Box title="Phase 6 · SABR, summaries, front desk" sub={`${s.sabr?.completedAt ? 'reviewed' : s.sabr?.scheduledAt ? `review ${shortDate(s.sabr.scheduledAt)}` : 'review not booked'} · front desk ${v.frontDesk.signedOffAt ? 'signed off' : 'not signed off'}`}>
      <div className="flex flex-wrap items-end gap-2">
        <label>
          <span className={adminLabel}>Review date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={adminInput} />
        </label>
        <button type="button" disabled={busy} onClick={() => post({ action: 'sabr', scheduledAt: date || null })} className={btn('secondary', 'sm')}>
          Save date
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={busy} checked={!!s.sabr?.completedAt} onChange={(e) => post({ action: 'sabr', done: e.target.checked })} /> Review held
        </label>
      </div>
      <p className="mt-4 text-sm font-semibold text-neutral-900">Practice manager (weekly summary, monthly link)</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="Name" className={adminInput} />
        <input value={m.email} onChange={(e) => setM({ ...m, email: e.target.value })} placeholder="Email" className={adminInput} />
        <input value={m.phone} onChange={(e) => setM({ ...m, phone: e.target.value })} placeholder="Cell" className={adminInput} />
        <button type="button" disabled={busy} onClick={() => post({ action: 'manager', ...m })} className={btn('secondary', 'sm')}>
          Save
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Monthly summary: the 1st, 8 AM their time, emailed to the owner and this manager and texted to the owner&apos;s cell. Last sent: {s.summaries?.lastMonth ?? 'never'}. Weekly: Mondays 8 AM to the manager (or the owner). Last: {s.summaries?.lastWeek ?? 'never'}.
      </p>
      <p className="mt-1 text-xs text-neutral-500">Opens: {v.frontDesk.access.length ? v.frontDesk.access.map((a) => `${a.month} ${a.recipient} ${shortDate(a.at)}`).join(' · ') : 'none yet'}</p>
      <button type="button" disabled={busy} onClick={() => post({ action: 'summaryLink' })} className={`${btn('ghost', 'sm')} mt-2`}>
        Open last month&apos;s summary link <ExternalLink size={12} />
      </button>
    </Box>
  );
}
