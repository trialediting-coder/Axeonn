'use client';

import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import type { MonthlyReport, ProjectDetails, ProjectUpdate } from '@/lib/projects';
import { UPDATE_STATUSES, UPDATE_TYPES, linesToText, monthLabel } from '@/lib/projectsShared';

interface Data {
  details: ProjectDetails;
  updates: ProjectUpdate[];
  reports: MonthlyReport[];
}

type Notice = { ok: boolean; text: string } | null;

const card = 'rounded-xl border border-neutral-200 bg-white p-5 shadow-sm';
const lastMonth = () => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
};
const str = (v: number | string | null | undefined) => (v == null ? '' : String(v));

/** Admin: project dates + baseline, Project Updates and Monthly Reports for one client. */
export function ProjectPanel({ token, initial, guarantee }: { token: string; initial: Data; guarantee: boolean }) {
  const [data, setData] = useState(initial);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const api = `/api/admin/onboarding/${token}/project`;

  async function call(method: string, body: Record<string, unknown>, okText: string, key: string): Promise<boolean> {
    setBusy(key);
    setNotice(null);
    const res = await fetch(api, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as Partial<Data> & { error?: string; emailError?: string | null };
    setBusy(null);
    if (!res.ok || !json.details) {
      setNotice({ ok: false, text: json.error ?? 'Something went wrong.' });
      return false;
    }
    setData({ details: json.details, updates: json.updates ?? [], reports: json.reports ?? [] });
    setNotice(json.emailError ? { ok: false, text: `Saved, but the email failed: ${json.emailError}` } : { ok: true, text: okText });
    return true;
  }

  // ── Details ──
  const d = data.details;
  const [details, setDetails] = useState({
    kickoffAt: str(d.kickoffAt),
    targetLaunchAt: str(d.targetLaunchAt),
    baselineCalls: str(d.baselineCalls),
    baselineLeads: str(d.baselineLeads),
    baselineKeyword: str(d.baselineKeyword),
    baselineRank: str(d.baselineRank),
  });
  const setD = (k: keyof typeof details) => (e: React.ChangeEvent<HTMLInputElement>) => setDetails((s) => ({ ...s, [k]: e.target.value }));

  // ── Update ──
  const emptyUpdate = { title: '', summary: '', type: 'Site change', status: 'Live', link: '', changes: '', why: '', actionNeeded: '', nextUp: '' };
  const [update, setUpdate] = useState(emptyUpdate);
  const setU = (k: keyof typeof update) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setUpdate((s) => ({ ...s, [k]: e.target.value }));

  // ── Report ──
  const emptyReport = {
    month: lastMonth(),
    calls: '',
    leads: '',
    booked: '',
    keyword: d.baselineKeyword ?? '',
    rank: '',
    reviews: '',
    rating: '',
    done: '',
    next: '',
    fromYou: '',
    note: '',
  };
  const [report, setReport] = useState(emptyReport);
  const setR = (k: keyof typeof report) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setReport((s) => ({ ...s, [k]: e.target.value }));
  const editReport = (r: MonthlyReport) =>
    setReport({
      month: r.month,
      calls: str(r.calls),
      leads: str(r.leads),
      booked: str(r.booked),
      keyword: r.keyword,
      rank: str(r.rank),
      reviews: str(r.reviews),
      rating: str(r.rating),
      done: linesToText(r.done),
      next: linesToText(r.next),
      fromYou: r.fromYou,
      note: r.note,
    });

  const input = (
    value: string,
    onChange: React.ChangeEventHandler<HTMLInputElement>,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <label className="block">
      <span className={adminLabel}>{label}</span>
      <input className={adminInput} value={value} onChange={onChange} {...props} />
    </label>
  );
  const area = (value: string, onChange: React.ChangeEventHandler<HTMLTextAreaElement>, label: string, placeholder = '', rows = 2) => (
    <label className="block">
      <span className={adminLabel}>{label}</span>
      <textarea className={adminInput} rows={rows} value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );

  return (
    <section className="mt-10 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-950">Project</h2>
        <p className="text-sm text-neutral-600">
          Dates, updates and monthly reports. Every update and report is emailed to the client and shows in AxeonPROOF.
        </p>
        {notice && <p className={`mt-2 text-sm font-semibold ${notice.ok ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}
      </div>

      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          void call('PUT', details, 'Project details saved.', 'details');
        }}
      >
        <h3 className="font-bold text-neutral-950 mb-3">Dates{guarantee ? ' & 90-day baseline' : ' & starting point'}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {input(details.kickoffAt, setD('kickoffAt'), 'Kickoff', { type: 'date' })}
          {input(details.targetLaunchAt, setD('targetLaunchAt'), 'Target launch', { type: 'date' })}
          <div className="hidden sm:block" />
          {input(details.baselineCalls, setD('baselineCalls'), 'Baseline calls / mo', { inputMode: 'numeric' })}
          {input(details.baselineLeads, setD('baselineLeads'), 'Baseline leads / mo', { inputMode: 'numeric' })}
          <div className="grid grid-cols-[1fr_80px] gap-2">
            {input(details.baselineKeyword, setD('baselineKeyword'), 'Main keyword', { placeholder: 'roofer des moines' })}
            {input(details.baselineRank, setD('baselineRank'), 'Rank', { inputMode: 'numeric' })}
          </div>
        </div>
        <button type="submit" disabled={busy === 'details'} className={`${btn('secondary')} mt-4`}>
          {busy === 'details' ? 'Saving…' : 'Save details'}
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className={`${card} space-y-3 h-fit`}
          onSubmit={async (e) => {
            e.preventDefault();
            if (await call('POST', { kind: 'update', ...update }, 'Update posted and emailed.', 'update')) setUpdate(emptyUpdate);
          }}
        >
          <h3 className="font-bold text-neutral-950">Post a Project Update</h3>
          {input(update.title, setU('title'), 'What shipped, in one line', { required: true, placeholder: 'Your Roof Repair page is live' })}
          {area(update.summary, setU('summary'), 'Summary', 'One or two sentences on what we did and why it matters.')}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={adminLabel}>Type</span>
              <select className={adminInput} value={update.type} onChange={setU('type')}>
                {UPDATE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={adminLabel}>Status</span>
              <select className={adminInput} value={update.status} onChange={setU('status')}>
                {UPDATE_STATUSES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          {input(update.link, setU('link'), 'Link (optional)', { type: 'url', placeholder: 'https://' })}
          {area(update.changes, setU('changes'), 'What changed (one per line, "Title: detail")', 'New page: Roof Repair page at /roof-repair', 3)}
          {area(update.why, setU('why'), 'Why this matters for their business')}
          {area(update.actionNeeded, setU('actionNeeded'), 'What we need from them (blank = nothing)')}
          {area(update.nextUp, setU('nextUp'), "What's next")}
          <button type="submit" disabled={busy === 'update'} className={btn('primary')}>
            <Send size={14} /> {busy === 'update' ? 'Sending…' : 'Post and email client'}
          </button>
          {data.updates.length > 0 && (
            <ul className="pt-3 border-t border-neutral-200 divide-y divide-neutral-100">
              {data.updates.map((u) => (
                <li key={u.id} className="py-2 flex items-center gap-2 text-sm">
                  <span className="text-neutral-400">#{u.number}</span>
                  <span className="flex-1 truncate text-neutral-900">{u.title}</span>
                  <span className="text-xs text-neutral-500">
                    {new Date(u.createdAt).toLocaleDateString()} {u.emailedAt ? '· emailed' : '· not emailed'}
                  </span>
                  <button
                    type="button"
                    className={btn('ghost', 'sm')}
                    title="Delete"
                    onClick={() => void call('DELETE', { kind: 'update', id: u.id }, 'Update deleted.', `del-u-${u.id}`)}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <form
          className={`${card} space-y-3 h-fit`}
          onSubmit={async (e) => {
            e.preventDefault();
            const send = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') !== 'save';
            await call('POST', { kind: 'report', send, ...report }, send ? 'Report saved and emailed.' : 'Report saved (not emailed).', 'report');
          }}
        >
          <h3 className="font-bold text-neutral-950">Monthly Report</h3>
          <p className="text-xs text-neutral-500 -mt-2">
            These are the numbers the client sees in AxeonPROOF. Leave a box blank if you don&apos;t have it: it shows as “—”, never a guess.
            Saving the same month again replaces it.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {input(report.month, setR('month'), 'Month', { type: 'month', required: true })}
            {input(report.calls, setR('calls'), 'Calls', { inputMode: 'numeric' })}
            {input(report.leads, setR('leads'), 'Leads', { inputMode: 'numeric' })}
            {input(report.booked, setR('booked'), 'Booked jobs', { inputMode: 'numeric' })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">{input(report.keyword, setR('keyword'), 'Main keyword')}</div>
            {input(report.rank, setR('rank'), 'Google rank', { inputMode: 'numeric' })}
            {input(report.reviews, setR('reviews'), 'Reviews', { inputMode: 'numeric' })}
            {input(report.rating, setR('rating'), 'Rating', { inputMode: 'decimal', placeholder: '4.8' })}
          </div>
          {area(report.note, setR('note'), 'One-line summary (optional)')}
          {area(report.done, setR('done'), 'What we did (one per line, "Title: detail")', 'New service page: Gutter Installation', 3)}
          {area(report.next, setR('next'), "Next month's plan (one per line)")}
          {area(report.fromYou, setR('fromYou'), 'From the client (optional)', 'Photos of recent jobs')}
          <div className="flex flex-wrap gap-2">
            <button type="submit" value="send" disabled={busy === 'report'} className={btn('primary')}>
              <Send size={14} /> {busy === 'report' ? 'Sending…' : `Save and email ${monthLabel(report.month || lastMonth())}`}
            </button>
            <button type="submit" value="save" disabled={busy === 'report'} className={btn('secondary')}>
              Save only
            </button>
          </div>
          {data.reports.length > 0 && (
            <ul className="pt-3 border-t border-neutral-200 divide-y divide-neutral-100">
              {data.reports.map((r) => (
                <li key={r.id} className="py-2 flex items-center gap-2 text-sm">
                  <span className="flex-1 text-neutral-900">{monthLabel(r.month)}</span>
                  <span className="text-xs text-neutral-500">
                    {str(r.calls) || '—'} calls · {str(r.leads) || '—'} leads {r.emailedAt ? '· emailed' : ''}
                  </span>
                  <button type="button" className={btn('ghost', 'sm')} onClick={() => editReport(r)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className={btn('ghost', 'sm')}
                    title="Delete"
                    onClick={() => void call('DELETE', { kind: 'report', id: r.id }, 'Report deleted.', `del-r-${r.id}`)}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>
    </section>
  );
}
