'use client';

// components/proof/InboxTab.tsx
// The Leads tab for AxeonCORE and up (spec, "Slice 4 design"): one row per
// person who reached out, newest activity first, and that person's page: who
// they are, where they came from, a stage, every call, text and form in order
// with the recording attached, and a reply box that texts from the client's
// tracked number. The stage taps are slice 3's (LeadStageTaps: Quote sent,
// Talked to them, Booked, Job done, Not a fit), posting { contactId } to the
// same stage route. Everything arrives pre-masked from the server
// (lib/contacts.ts); no full number is ever in this component. `api` and
// `stageApi` are null in the admin's "View as client", which makes the tab
// read-only. Not a CRM: no tasks, no pipeline board, no custom fields.
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Bot, CalendarCheck, FileText, Mail, MessageSquare, MousePointerClick, PhoneCall, Send, StickyNote } from 'lucide-react';
import { LeadStageTaps } from '@/components/proof/LeadStageTaps';
import {
  HELD_REPLY_COPY, REPLY_REFUSAL_COPY, STAGE_LABELS, canReplyNow, canTextInstead, formatWhen, quietNotice, relativeWhen, replyBlocker, shortName,
  type ContactEventKind, type DashboardContact, type DashboardContactView, type DashboardEvent, type DashboardInbox,
} from '@/lib/contactsShared';
import { SMS_MAX_CHARS } from '@/lib/phoneShared';
import { MetaReplyNotice } from '@/components/proof/MetaReplyNotice';
import { META_TEXT_MAX, metaTextProblem, replyContextFrom, replyDecision } from '@/lib/metaShared';
import type { LeadStage } from '@/lib/sequenceShared';

type Icon = typeof PhoneCall;

const KIND_ICONS: Record<ContactEventKind, Icon> = {
  call: PhoneCall, text_in: MessageSquare, text_out: MessageSquare, form: FileText, booking: CalendarCheck, chat: Bot,
  click: MousePointerClick, note: StickyNote, alert: Bell, sequence: MessageSquare, reminder: CalendarCheck, messenger: MessageSquare, instagram: MessageSquare,
};

const STAGE_TONES: Record<LeadStage, string> = {
  new: 'bg-blue-50 text-blue-800 ring-blue-200',
  contacted: 'bg-amber-50 text-amber-800 ring-amber-200',
  booked: 'bg-violet-50 text-violet-800 ring-violet-200',
  won: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  lost: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
};

const OUTGOING: readonly ContactEventKind[] = ['text_out', 'sequence', 'reminder'];

function StageBadge({ stage }: { stage: LeadStage }) {
  return <span className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${STAGE_TONES[stage]}`}>{STAGE_LABELS[stage]}</span>;
}

const errorText = (data: unknown, fallback: string) =>
  data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string' ? (data as { error: string }).error : fallback;

function ContactList({ contacts, nextCursor, selectedId, api }: { contacts: DashboardContact[]; nextCursor: string | null; selectedId: number | null; api: string | null }) {
  const [rows, setRows] = useState(contacts);
  const [cursor, setCursor] = useState(nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setRows(contacts);
    setCursor(nextCursor);
  }, [contacts, nextCursor]);

  async function more() {
    if (!api || !cursor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${api}?cursor=${encodeURIComponent(cursor)}`, { cache: 'no-store' });
      const data = (await res.json().catch(() => ({}))) as { contacts?: DashboardContact[]; nextCursor?: string | null };
      const page = data.contacts;
      if (!res.ok || !page) throw new Error(errorText(data, 'Could not load older leads. Try again.'));
      setRows((r) => [...r, ...page]);
      setCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load older leads. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {rows.length === 0 ? (
        <p className="p-6 text-sm text-neutral-500">No one has reached out yet. Calls, texts and forms show up here within a minute.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {rows.map((c) => {
            const name = shortName(c.name);
            return (
              <li key={c.id}>
                <Link
                  href={`?tab=leads&contact=${c.id}`}
                  scroll={false}
                  aria-current={c.id === selectedId ? 'true' : undefined}
                  className={`block px-4 py-3 hover:bg-neutral-50 ${c.id === selectedId ? 'bg-blue-50/70' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-neutral-950">{name ? `${name} · ${c.who}` : c.who}</p>
                    <StageBadge stage={c.stage} />
                  </div>
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {c.lastVerb ? `${c.lastVerb} · ` : ''}
                    <span suppressHydrationWarning>{relativeWhen(c.lastActivityAt)}</span>
                    {c.lastSummary ? ` · ${c.lastSummary}` : ''}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {cursor && api ? (
        <div className="border-t border-neutral-100 p-3 text-center">
          <button type="button" onClick={more} disabled={loading} className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50">
            {loading ? 'Loading…' : 'Show older leads'}
          </button>
          {error ? <p role="alert" className="mt-1 text-xs text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function NameLine({ contact, api }: { contact: DashboardContact; api: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(contact.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!api) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${api}/${contact.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value }) });
      if (!res.ok) throw new Error(errorText(await res.json().catch(() => null), 'That did not save. Try again.'));
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (editing && api) {
    return (
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={80}
          autoFocus
          aria-label="Name"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-base sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs font-semibold text-neutral-600">
          Cancel
        </button>
        {error ? <p role="alert" className="w-full text-xs text-red-700">{error}</p> : null}
      </form>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-bold text-neutral-950">{contact.name ?? 'No name yet'}</h3>
      {api ? (
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-700 hover:underline">
          {contact.name ? 'Edit' : 'Add name'}
        </button>
      ) : null}
    </div>
  );
}

/** Slice 3's taps on this contact. Read-only chips when stageApi is null (admin preview). */
function StageLine({ contact, stageApi }: { contact: DashboardContact; stageApi: string | null }) {
  const router = useRouter();
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-neutral-500">Stage</span>
        <StageBadge stage={contact.stage} />
      </div>
      <div className="mt-2">
        <LeadStageTaps id={contact.id} stage={contact.stage} quoteSent={contact.quoteSent} api={stageApi} target="contact" onSaved={() => router.refresh()} />
      </div>
      <p className="mt-2 text-xs text-neutral-500">Job done and Not a fit count toward your close rate.</p>
    </div>
  );
}

function EventItem({ e, api }: { e: DashboardEvent; api: string | null }) {
  const outgoing = OUTGOING.includes(e.kind) || e.metaDirection === 'out';
  if (e.text !== null) {
    return (
      <li className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${outgoing ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-900'}`}>
          <p className="whitespace-pre-wrap break-words">{e.text}</p>
          <p className={`mt-1 text-[11px] ${outgoing ? 'text-blue-100' : 'text-neutral-500'}`}>
            {formatWhen(e.at)}
            {e.automatic ? ' · sent automatically' : ''}
          </p>
        </div>
      </li>
    );
  }
  const Icon = KIND_ICONS[e.kind];
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-900">
          <span className="font-semibold">{e.verb}</span> · {e.summary}
        </p>
        <p className="text-[11px] text-neutral-500">{formatWhen(e.at)}</p>
        {e.call?.hasRecording ? (
          api ? (
            <audio controls preload="none" aria-label="Call recording" className="mt-2 h-8 w-full max-w-xs" src={`/api/proof/recording/${encodeURIComponent(e.call.callSid)}`} />
          ) : (
            <p className="mt-1 text-xs text-neutral-500">Recorded</p>
          )
        ) : null}
        {e.fields.length > 0 ? (
          <dl className="mt-2 space-y-1 rounded-lg bg-neutral-50 p-3 text-xs">
            {e.fields.map((f) => (
              <div key={f.label}>
                <dt className="font-semibold text-neutral-600">{f.label}</dt>
                <dd className="whitespace-pre-wrap break-words text-neutral-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </li>
  );
}

function ReplyBox({ contact, events, api, timeZone, texting, renderedAt }: { contact: DashboardContact; events: DashboardEvent[]; api: string | null; timeZone: string; texting: DashboardInbox['texting']; renderedAt: number }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Slice 6: Facebook or Instagram refused (reason 'meta'), e.g. the window closed after the page loaded.
  const [metaRefusal, setMetaRefusal] = useState<{ error: string; canText: boolean } | null>(null);
  const [quiet, setQuiet] = useState<string | null>(null);
  // Computed after mount: the server's clock and the phone's can disagree by a minute.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const w = canReplyNow(new Date(), timeZone);
    setQuiet(w.ok ? null : quietNotice(w.sendAt, timeZone, false));
    setNow(Date.now());
  }, [timeZone, events]);

  // Slice 6: a DM thread answers on Facebook / Instagram inside 24 hours (lib/metaShared.ts replyDecision; the server decides again).
  // Before mount (now null) the server's render time is the clock, so server and first client paint agree
  // and an old thread never flashes "Reply on Facebook" before switching.
  const context = replyContextFrom(events);
  const canText = canTextInstead({ hasPhone: contact.hasPhone, optedOut: contact.optedOut, texting });
  const decision = replyDecision({ ...context, canText, now: now ?? renderedAt });
  const platform = decision.route === 'meta' ? (decision.channel === 'instagram' ? 'Instagram' : 'Facebook') : null;
  // The same order the server refuses texts in (lib/contactsShared.ts replyBlocker); a DM reply needs no phone.
  const blocked = platform ? null : replyBlocker({ hasPhone: contact.hasPhone, optedOut: contact.optedOut, texting });
  const tooLong = decision.route === 'meta' ? metaTextProblem(decision.channel, body.trim()) : null;

  const failText = platform ? 'Your message did not go out. Try again.' : 'Your text did not go out. Try again.';

  async function post(via: 'sms' | null) {
    if (!api || !body.trim()) return;
    setSending(true);
    setError(null);
    setNote(null);
    setMetaRefusal(null);
    try {
      const res = await fetch(`${api}/${contact.id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, via }) });
      const data = (await res.json().catch(() => null)) as { status?: string; sendAt?: string; reason?: string; canText?: boolean; note?: string } | null;
      if (!res.ok && data?.reason === 'meta') {
        // Nothing went out: keep the words, say why, and offer a text only when one could really go out.
        setMetaRefusal({ error: errorText(data, `${platform ?? 'Facebook'} did not take the message.`), canText: data.canText === true && canText });
        return;
      }
      if (data?.status === 'unclear') {
        // It may have gone out (lib/inboxReply.ts liveSendFailure; for a DM, lib/meta.ts metaSendFailure): clear the box so it is not sent twice, and show the thread.
        setBody('');
        router.refresh();
      }
      if (!res.ok) throw new Error(errorText(data, failText));
      setBody('');
      if (data?.status === 'held' && typeof data.sendAt === 'string') setNote(quietNotice(data.sendAt, timeZone, true));
      else if (typeof data?.note === 'string') setNote(data.note);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : failText);
    } finally {
      setSending(false);
    }
  }

  function send(e: FormEvent) {
    e.preventDefault();
    // Window closed but we have their number: this box is a text box now.
    void post(decision.route === 'blocked' ? 'sms' : null);
  }

  // The opt-out banner shows in the admin preview too; everything else there is read-only.
  if (blocked === 'opted_out') {
    return (
      <div className="border-t border-neutral-100 p-4">
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
          {REPLY_REFUSAL_COPY.opted_out}
        </p>
      </div>
    );
  }
  if (!api) return <p className="border-t border-neutral-100 p-4 text-sm text-neutral-500">Read-only preview. Replies are sent from the client&apos;s own login.</p>;
  if (decision.route === 'blocked' && !decision.canText) {
    return (
      <div className="border-t border-neutral-100 p-4">
        <p className="text-sm text-neutral-500">{decision.message}</p>
      </div>
    );
  }
  if (blocked) {
    return (
      <div className="border-t border-neutral-100 p-4">
        <p className="text-sm text-neutral-500">{REPLY_REFUSAL_COPY[blocked]}</p>
      </div>
    );
  }
  const max = decision.route === 'meta' ? META_TEXT_MAX[decision.channel] : SMS_MAX_CHARS;
  return (
    <form onSubmit={send} className="border-t border-neutral-100 p-4">
      {decision.route === 'blocked' ? <p className="mb-2 text-xs text-amber-800">{decision.message}</p> : null}
      {quiet && !platform ? <p className="mb-2 text-xs text-amber-800">{quiet}</p> : null}
      <label htmlFor={`reply-${contact.id}`} className="sr-only">
        {platform ? `Reply on ${platform}` : 'Text this lead'}
      </label>
      <textarea
        id={`reply-${contact.id}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={max}
        placeholder={platform ? `Reply on ${platform}` : 'Text them back from your tracked number'}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">
          {body.trim().length}/{max}
        </span>
        <button
          type="submit"
          disabled={sending || !body.trim() || tooLong !== null}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={14} /> {sending ? 'Sending…' : platform ? 'Send reply' : 'Send text'}
        </button>
      </div>
      {tooLong ? <p className="mt-2 text-xs text-amber-800">{tooLong}</p> : null}
      {note ? <p role="status" className="mt-2 text-xs text-emerald-800">{note}</p> : null}
      {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
      {metaRefusal ? <MetaReplyNotice error={metaRefusal.error} canText={metaRefusal.canText} busy={sending} onTextInstead={() => void post('sms')} /> : null}
    </form>
  );
}

function ContactView({ view, api, stageApi, timeZone, texting, renderedAt }: { view: DashboardContactView; api: string | null; stageApi: string | null; timeZone: string; texting: DashboardInbox['texting']; renderedAt: number }) {
  const c = view.contact;
  const timeline = useRef<HTMLOListElement>(null);
  // Newest at the bottom, next to the reply box, like any text thread.
  useEffect(() => {
    if (timeline.current) timeline.current.scrollTop = timeline.current.scrollHeight;
  }, [view.events.length]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <header className="border-b border-neutral-100 p-4 sm:p-5">
        <Link href="?tab=leads" scroll={false} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 lg:hidden">
          <ArrowLeft size={14} /> All leads
        </Link>
        <NameLine key={c.name ?? ''} contact={c} api={api} />
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
          <span>{c.who}</span>
          {c.hasEmail && api ? (
            <a href={`${api}/${c.id}/email`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
              <Mail size={14} /> Email
            </a>
          ) : null}
        </div>
        <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs text-neutral-500 sm:grid-cols-3">
          <div>
            <dt className="inline">From </dt>
            <dd className="inline font-medium text-neutral-800">{c.sourceLabel}</dd>
          </div>
          <div>
            <dt className="inline">First seen </dt>
            <dd className="inline font-medium text-neutral-800">{formatWhen(c.firstSeenAt)}</dd>
          </div>
          <div>
            <dt className="inline">Last activity </dt>
            <dd className="inline font-medium text-neutral-800">{formatWhen(c.lastActivityAt)}</dd>
          </div>
        </dl>
        <StageLine contact={c} stageApi={stageApi} />
      </header>
      <ol ref={timeline} className="max-h-[60vh] space-y-4 overflow-y-auto p-4" aria-label="Everything from this lead">
        {view.events.length === 0 ? <li className="text-sm text-neutral-500">Nothing yet.</li> : view.events.map((e) => <EventItem key={e.id} e={e} api={api} />)}
        {view.held.map((h) => (
          <li key={`held-${h.id}`} className="flex justify-end">
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ring-1 ${h.status === 'failed' || h.status === 'opted_out' ? 'bg-red-50 text-red-900 ring-red-200' : 'bg-amber-50 text-amber-950 ring-amber-200'}`}>
              <p className="whitespace-pre-wrap break-words">{h.body}</p>
              {/* An interrupted or unclear send may have left (lib/inboxReply.ts), so it never reads "did not go out". */}
              <p className="mt-1 text-[11px]" suppressHydrationWarning>
                {h.status !== 'held' ? HELD_REPLY_COPY[h.status] : Date.parse(h.sendAt) <= Date.now() ? 'Sending now…' : quietNotice(h.sendAt, timeZone, true)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <ReplyBox contact={c} events={view.events} api={api} timeZone={timeZone} texting={texting} renderedAt={renderedAt} />
    </div>
  );
}

export function InboxTab({ inbox, api, stageApi }: { inbox: DashboardInbox; api: string | null; stageApi: string | null }) {
  const selected = inbox.selected;
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(300px,400px)_1fr]">
      <div className={selected ? 'hidden lg:block' : ''}>
        <ContactList contacts={inbox.contacts} nextCursor={inbox.nextCursor} selectedId={selected?.contact.id ?? null} api={api} />
      </div>
      <div className={selected ? '' : 'hidden lg:block'}>
        {selected ? (
          <ContactView key={selected.contact.id} view={selected} api={api} stageApi={stageApi} timeZone={inbox.timeZone} texting={inbox.texting} renderedAt={inbox.renderedAt} />
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
            Pick a lead to see every call, text and form from them, and to text them back.
          </div>
        )}
      </div>
    </div>
  );
}
