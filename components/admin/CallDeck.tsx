'use client';

// components/admin/CallDeck.tsx
// The call deck: one prospect at a time, everything we know about them on one
// card, a notes box with a Save button, one-tap outcomes, and Prev/Next that
// flips to the next number. Keyboard: ← → move, 1-7 set the outcome, Ctrl+S saves.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Phone,
  Save,
  Search,
  Star,
  Upload,
} from 'lucide-react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import type { CallLead, Outcome, Priority } from '@/lib/callLeads';

const PRIORITY_STYLE: Record<Priority, { label: string; cls: string }> = {
  A: { label: 'A · best fit', cls: 'bg-orange-100 text-orange-900 border-orange-200' },
  B: { label: 'B · no site, small', cls: 'bg-amber-50 text-amber-900 border-amber-200' },
  C: { label: 'C · has site, strong', cls: 'bg-blue-50 text-blue-900 border-blue-200' },
  D: { label: 'D · low', cls: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
  CLIENT: { label: 'Client', cls: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
};

const OUTCOME_BUTTONS: Array<{ value: Outcome; label: string; key: string; variant: 'secondary' | 'success' | 'danger' | 'primary' }> = [
  { value: 'no_answer', label: 'No answer', key: '1', variant: 'secondary' },
  { value: 'voicemail', label: 'Voicemail', key: '2', variant: 'secondary' },
  { value: 'interested', label: 'Interested', key: '3', variant: 'success' },
  { value: 'callback', label: 'Call back', key: '4', variant: 'secondary' },
  { value: 'not_now', label: 'Not now', key: '5', variant: 'secondary' },
  { value: 'not_fit', label: 'Not a fit', key: '6', variant: 'danger' },
  { value: 'booked', label: 'Booked a call', key: '7', variant: 'primary' },
];

const OUTCOME_LABEL: Record<Outcome, string> = {
  none: 'Not called yet',
  no_answer: 'No answer',
  voicemail: 'Left voicemail',
  interested: 'Interested',
  callback: 'Call back',
  not_now: 'Not now',
  not_fit: 'Not a fit',
  booked: 'Booked a call',
  client: 'Client',
};

const DONE: Outcome[] = ['not_fit', 'booked', 'client'];
const AUTO_KEY = 'axeon_calls_autoadvance';

const digits = (p: string) => p.replace(/\D/g, '');
const telHref = (p: string) => {
  const d = digits(p);
  return d.length === 10 ? `tel:+1${d}` : d.length === 11 && d.startsWith('1') ? `tel:+${d}` : `tel:${d}`;
};
const isToday = (iso: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
const ago = (iso: string | null) => {
  if (!iso) return 'never';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
};
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// How the script talks about each niche: who we work with, and what their customers type into Google.
const NICHE_WORDS: Record<string, { who: string; search: string }> = {
  'auto detailing': { who: 'detailers', search: 'detailing' },
  dental: { who: 'dental offices', search: 'dentist' },
  'med spa': { who: 'med spas', search: 'med spa' },
  hvac: { who: 'HVAC companies', search: 'furnace repair' },
  roofing: { who: 'roofers', search: 'roofer' },
  'law firm': { who: 'law firms', search: 'lawyer' },
  'accounting/cpa': { who: 'accountants', search: 'CPA' },
  'home remodeling': { who: 'remodelers', search: 'remodeling contractor' },
  'real estate': { who: 'real estate teams', search: 'realtor' },
  landscaping: { who: 'landscapers', search: 'landscaping' },
};
const nicheWords = (niche: string) => NICHE_WORDS[(niche || 'auto detailing').toLowerCase()] ?? { who: 'local businesses', search: 'near me' };
const firstName = (contact: string) => contact.trim().split(/[\s,(]/)[0] ?? '';

export function CallDeck({ initialLeads, dbError }: { initialLeads: CallLead[]; dbError: string | null }) {
  const [leads, setLeads] = useState<CallLead[]>(initialLeads);
  const [priorities, setPriorities] = useState<Set<Priority>>(new Set(['A', 'B']));
  const [region, setRegion] = useState('all');
  const [niche, setNiche] = useState('all');
  const [hideDone, setHideDone] = useState(true);
  const [search, setSearch] = useState('');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(dbError ? { ok: false, text: dbError } : null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showImport, setShowImport] = useState(initialLeads.length === 0 && !dbError);
  const [showScript, setShowScript] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(AUTO_KEY);
      if (v !== null) setAutoAdvance(v === '1');
    } catch {}
  }, []);
  const toggleAuto = () => {
    setAutoAdvance((v) => {
      try {
        localStorage.setItem(AUTO_KEY, v ? '0' : '1');
      } catch {}
      return !v;
    });
  };

  const regions = useMemo(() => Array.from(new Set(leads.map((l) => l.region).filter(Boolean))).sort(), [leads]);
  const niches = useMemo(() => Array.from(new Set(leads.map((l) => l.niche || 'Auto detailing'))).sort(), [leads]);

  const queue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(
      (l) =>
        priorities.has(l.priority) &&
        (region === 'all' || l.region === region) &&
        (niche === 'all' || (l.niche || 'Auto detailing') === niche) &&
        (!hideDone || !DONE.includes(l.outcome)) &&
        (!q || `${l.business} ${l.city} ${l.phone} ${l.notes}`.toLowerCase().includes(q))
    );
  }, [leads, priorities, region, niche, hideDone, search]);

  const idx = Math.max(0, currentId === null ? 0 : queue.findIndex((l) => l.id === currentId));
  const lead: CallLead | undefined = queue[idx] ?? queue[0];
  const leadId = lead?.id;
  const leadNotes = lead?.notes ?? '';

  // Load the notes box whenever the card changes.
  useEffect(() => {
    setNotesDraft(leadNotes);
  }, [leadId, leadNotes]);

  const dirty = !!lead && notesDraft !== lead.notes;

  const flash = (ok: boolean, text: string) => {
    setToast({ ok, text });
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 2500);
  };

  const patch = useCallback(async (id: number, body: Record<string, unknown>): Promise<CallLead> => {
    const res = await fetch(`/api/admin/calls/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { lead?: CallLead; error?: string };
    if (!res.ok || !data.lead) throw new Error(data.error ?? 'Save failed');
    const saved = data.lead;
    setLeads((all) => all.map((l) => (l.id === saved.id ? saved : l)));
    return saved;
  }, []);

  const saveNotes = useCallback(async () => {
    if (!lead || !dirty || saving) return;
    setSaving(true);
    try {
      await patch(lead.id, { notes: notesDraft });
      flash(true, 'Saved');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [lead, dirty, saving, notesDraft, patch]);

  const go = useCallback(
    async (delta: number) => {
      if (!lead) return;
      const target = queue[idx + delta];
      if (!target) return;
      if (dirty) {
        try {
          await patch(lead.id, { notes: notesDraft });
        } catch (err) {
          flash(false, err instanceof Error ? err.message : 'Could not save notes');
          return;
        }
      }
      setCurrentId(target.id);
    },
    [lead, queue, idx, dirty, notesDraft, patch]
  );

  const setOutcome = useCallback(
    async (outcome: Outcome) => {
      if (!lead || saving) return;
      setSaving(true);
      try {
        await patch(lead.id, { outcome, calledNow: true, ...(dirty ? { notes: notesDraft } : {}) });
        flash(true, `${OUTCOME_LABEL[outcome]} · saved`);
        if (autoAdvance) {
          // The card may drop out of the queue (hideDone), so step by position, not by id.
          const next = queue[idx + 1] ?? queue[idx - 1];
          if (next) setCurrentId(next.id);
        }
      } catch (err) {
        flash(false, err instanceof Error ? err.message : 'Save failed');
      } finally {
        setSaving(false);
      }
    },
    [lead, saving, patch, dirty, notesDraft, autoAdvance, queue, idx]
  );

  // Keyboard: arrows and j/k move, 1-7 set an outcome, Ctrl/Cmd+S saves, N jumps to notes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveNotes();
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.tagName === 'SELECT')) return;
      if (e.key === 'ArrowRight' || e.key === 'j') void go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'k') void go(-1);
      else if (e.key === 'n') {
        e.preventDefault();
        notesRef.current?.focus();
      } else {
        const hit = OUTCOME_BUTTONS.find((b) => b.key === e.key);
        if (hit) void setOutcome(hit.value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, saveNotes, setOutcome]);

  async function refresh() {
    const res = await fetch('/api/admin/calls');
    if (res.ok) setLeads(((await res.json()) as { leads: CallLead[] }).leads);
  }

  async function runImport() {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/calls', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = (await res.json().catch(() => ({}))) as { inserted?: number; updated?: number; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      await refresh();
      setCsvText('');
      setShowImport(false);
      flash(true, `Imported ${data.total} rows: ${data.inserted} new, ${data.updated} refreshed.`);
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ''));
    reader.readAsText(f);
  }

  const togglePriority = (p: Priority) =>
    setPriorities((s) => {
      const n = new Set(s);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });

  const today = leads.filter((l) => isToday(l.lastCalledAt));
  const todayInterested = today.filter((l) => l.outcome === 'interested' || l.outcome === 'booked').length;
  const todayBooked = today.filter((l) => l.outcome === 'booked').length;

  const copyPhone = async () => {
    if (!lead) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      flash(true, 'Number copied');
    } catch {
      flash(false, 'Could not copy');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar: today's numbers + tools */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Stat label="dials today" value={today.length} />
          <Stat label="interested" value={todayInterested} tone="emerald" />
          <Stat label="booked" value={todayBooked} tone="blue" />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 select-none">
            <input type="checkbox" checked={autoAdvance} onChange={toggleAuto} className="h-4 w-4 accent-blue-600" />
            Flip to next after an outcome
          </label>
          <button type="button" onClick={() => setShowScript((v) => !v)} className={btn(showScript ? 'primary' : 'secondary', 'sm')}>
            <FileText size={13} /> Script
          </button>
          <button type="button" onClick={() => setShowImport((v) => !v)} className={btn('secondary', 'sm')}>
            <Upload size={13} /> Import CSV
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${toast.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}
        >
          {toast.text}
        </div>
      )}

      {showImport && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-neutral-950">Import prospects</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Upload or paste the CSV from <code className="rounded bg-neutral-100 px-1">Axeon-Iowa-Detailers-&lt;date&gt;.csv</code>. Re-importing refreshes reviews and site
            status but never touches your notes or outcomes.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
            <span className="text-xs text-neutral-500">or paste below</span>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={5}
            placeholder="Priority,Business,City,Region,Phone,Website,Site status,Google rating,Reviews,Axeon status,Source,Maps URL,Why this priority,Notes"
            className={`${adminInput} mt-3 font-mono text-xs`}
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={runImport} disabled={importing || !csvText.trim()} className={btn('primary')}>
              <Upload size={14} /> {importing ? 'Importing…' : 'Import'}
            </button>
            <button type="button" onClick={() => setShowImport(false)} className={btn('ghost')}>
              Close
            </button>
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {(['A', 'B', 'C', 'D', 'CLIENT'] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePriority(p)}
              aria-pressed={priorities.has(p)}
              className={`h-8 rounded-lg border px-2.5 text-xs font-bold transition-colors ${
                priorities.has(p) ? PRIORITY_STYLE[p].cls : 'border-neutral-200 bg-white text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {p === 'CLIENT' ? 'Clients' : p}
            </button>
          ))}
        </div>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={`${adminInput} h-8 w-auto py-0 text-xs`}>
          <option value="all">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={niche} onChange={(e) => setNiche(e.target.value)} className={`${adminInput} h-8 w-auto py-0 text-xs`}>
          <option value="all">All niches</option>
          {niches.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 select-none">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="h-4 w-4 accent-blue-600" />
          Hide not-a-fit, booked, clients
        </label>
        <div className="relative ml-auto min-w-[180px]">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, city, notes" className={`${adminInput} h-8 pl-7 text-xs`} />
        </div>
        <span className="text-xs font-semibold text-neutral-500">{queue.length} in queue</span>
      </div>

      <div className={`grid gap-4 ${showScript ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
        {/* The card */}
        {!lead ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            {leads.length === 0 ? 'No prospects yet. Import the CSV to load the deck.' : 'Nothing matches these filters.'}
          </div>
        ) : (
          <article className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start gap-3 border-b border-neutral-100 px-5 py-4 sm:px-7">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${PRIORITY_STYLE[lead.priority].cls}`}>
                    {PRIORITY_STYLE[lead.priority].label}
                  </span>
                  <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                    {OUTCOME_LABEL[lead.outcome]}
                  </span>
                  {lead.callCount > 0 && (
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {lead.callCount} call{lead.callCount === 1 ? '' : 's'} · last {ago(lead.lastCalledAt)}
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-neutral-950 sm:text-3xl">{lead.business}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                  <MapPin size={14} className="text-neutral-400" />
                  {lead.city || 'City unknown'}
                  {lead.region && <span className="text-neutral-400">· {lead.region}</span>}
                  <span className="text-neutral-400">· {lead.niche || 'Auto detailing'}</span>
                </p>
                {lead.contact && <p className="mt-1 text-sm font-semibold text-neutral-800">Ask for: {lead.contact}</p>}
              </div>
              <div className="text-right text-xs font-semibold text-neutral-500">
                {idx + 1} of {queue.length}
              </div>
            </div>

            <div className="px-5 py-5 sm:px-7">
              {/* Phone */}
              <div className="flex flex-wrap items-center gap-3">
                {lead.phone ? (
                  <>
                    <a href={telHref(lead.phone)} className="text-3xl font-bold tabular-nums tracking-tight text-neutral-950 hover:text-blue-700 sm:text-4xl">
                      {lead.phone}
                    </a>
                    <a href={telHref(lead.phone)} className={btn('primary')}>
                      <Phone size={15} /> Call
                    </a>
                    <button type="button" onClick={copyPhone} className={btn('ghost', 'sm')} aria-label="Copy number">
                      <Copy size={13} /> Copy
                    </button>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-neutral-400">No phone on file</span>
                )}
              </div>

              {/* Facts */}
              <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Fact label="Website">
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline">
                      <Globe size={13} /> {hostOf(lead.website)} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="font-semibold text-orange-800">None</span>
                  )}
                  {lead.siteStatus && <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-600">{lead.siteStatus}</span>}
                </Fact>
                <Fact label="Google">
                  {lead.reviews !== null ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
                      <Star size={13} className="fill-amber-400 text-amber-400" /> {lead.rating ?? '–'} · {lead.reviews} reviews
                    </span>
                  ) : (
                    <span className="text-neutral-500">No rating on file</span>
                  )}
                  <span className="ml-2 inline-flex gap-2 text-xs">
                    {lead.mapsUrl && (
                      <a href={lead.mapsUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                        Maps
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.business} ${lead.city}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Search
                    </a>
                    <a
                      href={`https://www.facebook.com/search/top?q=${encodeURIComponent(`${lead.business} ${lead.city}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Facebook
                    </a>
                  </span>
                </Fact>
                <Fact label="Axeon status">{lead.axeonStatus || 'Not contacted'}</Fact>
                <Fact label="Source">{lead.source || '–'}</Fact>
              </dl>

              {lead.why && (
                <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-950">
                  <span className="font-semibold">Angle: </span>
                  {lead.why}
                </p>
              )}

              {/* Outcomes */}
              <div className="mt-5">
                <div className={adminLabel}>What happened</div>
                <div className="flex flex-wrap gap-2">
                  {OUTCOME_BUTTONS.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      disabled={saving}
                      onClick={() => setOutcome(b.value)}
                      className={`${btn(b.variant, 'sm')} ${lead.outcome === b.value ? 'ring-2 ring-blue-600/40' : ''}`}
                      title={`Press ${b.key}`}
                    >
                      <kbd className="rounded bg-black/10 px-1 text-[10px] font-bold">{b.key}</kbd> {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-5">
                <label htmlFor="call-notes" className={adminLabel}>
                  Notes
                </label>
                <textarea
                  id="call-notes"
                  ref={notesRef}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={5}
                  placeholder="Who you talked to, what they said, what to do next…"
                  className={adminInput}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" onClick={saveNotes} disabled={!dirty || saving} className={btn('primary', 'sm')}>
                    {dirty ? <Save size={13} /> : <Check size={13} />} {saving ? 'Saving…' : dirty ? 'Save notes' : 'Saved'}
                  </button>
                  <span className="text-[11px] text-neutral-500">Ctrl+S saves · N jumps here · ← → flip cards · 1-7 set the outcome</span>
                </div>
              </div>
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 sm:px-7">
              <button type="button" onClick={() => go(-1)} disabled={idx <= 0} className={btn('secondary')}>
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-xs font-semibold text-neutral-500">
                {idx + 1} / {queue.length}
              </span>
              <button type="button" onClick={() => go(1)} disabled={idx >= queue.length - 1} className={btn('primary')}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </article>
        )}

        {showScript && lead && (
          <aside className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed text-neutral-800 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Script · sell the outcome, not the site</h3>
            <p className="mt-3">
              Hey, is this {firstName(lead.contact) ? <b>{firstName(lead.contact)}</b> : <>the owner of <b>{lead.business}</b></>}? This is Hayder, I&apos;m in West Des Moines. Thirty seconds.
            </p>
            <p className="mt-2">
              I work with {nicheWords(lead.niche).who} on one thing: more booked jobs from people searching Google. One of mine, A-1 in Pleasant Hill, is #1 on the map now
              and his 180 reviews finally show up when someone searches.
            </p>
            <p className="mt-2">
              I looked you up.{' '}
              {lead.reviews ? (
                <>
                  You&apos;ve got <b>{lead.reviews} reviews</b>
                  {lead.rating ? <> at {lead.rating} stars</> : null}
                </>
              ) : (
                <>You&apos;ve got good work out there</>
              )}
              , and when someone searches &ldquo;{nicheWords(lead.niche).search} {lead.city || 'near me'}&rdquo;{' '}
              {lead.siteStatus === 'Has website' || lead.siteStatus === 'Decent' ? 'your site gives them nowhere to book' : "you're not on the first screen"}, so that work isn&apos;t earning you anything.
            </p>
            <p className="mt-2 font-semibold text-blue-900">Quick question: when someone finds you today, where do they go? Facebook?</p>
            <p className="mt-2">
              Here&apos;s what I&apos;d do. I put together a free rundown of what happens when people search for you, what it&apos;s costing you, and what it looks like fixed.
              Takes me a day. No charge. If it&apos;s useful we talk, if not you keep it. Can I text it to this number?
            </p>
            <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">If they say</h4>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              <li>
                <b>&ldquo;I get all my work from Facebook.&rdquo;</b> Facebook is rented. Google is where people with a card in hand are looking today. Both, not either.
              </li>
              <li>
                <b>&ldquo;I already have a website.&rdquo;</b> Does it tell you how many calls it made last month? If not, you&apos;re paying for a brochure.
              </li>
              <li>
                <b>&ldquo;I&apos;m busy enough.&rdquo;</b> Then it&apos;s price, not volume. #1 with your reviews lets you charge more and skip the low-dollar jobs.
              </li>
              <li>
                <b>&ldquo;How much?&rdquo;</b> $299 a month, ninety days to show more booked jobs or you stop paying. Only after they&apos;ve said what a job is worth.
              </li>
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'emerald' | 'blue' }) {
  const cls = { neutral: 'bg-white text-neutral-900', emerald: 'bg-emerald-50 text-emerald-900', blue: 'bg-blue-50 text-blue-900' }[tone];
  return (
    <span className={`inline-flex items-baseline gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 ${cls}`}>
      <b className="text-base tabular-nums">{value}</b>
      <span className="text-[11px] font-semibold text-neutral-500">{label}</span>
    </span>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className={adminLabel}>{label}</dt>
      <dd className="text-sm text-neutral-800">{children}</dd>
    </div>
  );
}
