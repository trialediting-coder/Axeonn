// lib/proofV2Actions.ts
// Every write to an AxeonPROOF v2 client, validated in one place. The admin API
// (app/api/admin/onboarding/[token]/v2) and the client API (app/api/proof/v2,
// app/api/welcome/[token]/front-desk) call runAdminAction / runClientAction.
// Throws a message safe to show.
import type { Onboarding } from '@/lib/onboarding';
import { setIndustry, setProofVersion } from '@/lib/onboarding';
import { isIndustry } from '@/data/industryWords';
import { isProofVersion } from '@/data/dashboardVersions';
import { isStepKey } from '@/data/deliverySchedule';
import { sendLaunchCertificateEmail } from '@/lib/email';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { normalizePhone } from '@/lib/phoneShared';
import { agreementEinFor } from '@/lib/agreements';
import { importCsv } from '@/lib/pastCustomers';
import { CLIENT_LIST_MAX_BYTES } from '@/lib/pastCustomersShared';
import {
  addPin,
  deletePage,
  getV2Settings,
  patchV2,
  publishPage,
  savePage,
  setAverageValue,
  setPageIndexed,
  setPinStatus,
  setV2Entry,
  startDbrSprint,
  stopDbrSprint,
  v2SendsEnabled,
} from '@/lib/proofV2';
import {
  FILING_STATUSES,
  NAP_STATUSES,
  PHASE_KEYS,
  PHASE_STATUSES,
  PIN_STAGES,
  REVIEW_STAGES,
  canGoLive,
  dbrStartBlock,
  isNapKey,
  napProgress,
  averageValueInput,
  stagingState,
  validateDbrSteps,
  type FilingStatus,
  type NapStatus,
  type PhaseKey,
  type PhaseStatus,
  type PinStage,
  type ReviewStage,
} from '@/lib/proofV2Shared';

type Body = Record<string, unknown>;
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v));
const isWhen = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const oneOf = <T extends string>(list: readonly T[], v: unknown, what: string): T => {
  if (typeof v === 'string' && (list as readonly string[]).includes(v)) return v as T;
  throw new Error(`Unknown ${what}`);
};
const httpsUrl = (v: unknown, what: string): string | undefined => {
  const s = str(v, 1000);
  if (!s) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
    return u.toString();
  } catch {
    throw new Error(`${what} must be a web address (https://...).`);
  }
};
const count = (v: unknown, what: string): number | undefined => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 100_000_000) throw new Error(`${what} must be a whole number.`);
  return n;
};
const nowIso = () => new Date().toISOString();

function requireV2(o: Onboarding) {
  if (o.proofVersion !== 2) throw new Error('This client is on AxeonPROOF v1. Switch them to v2 first.');
}

function pinInput(body: Body): { stage: PinStage; x: number; y: number; note: string } {
  const stage = oneOf(PIN_STAGES, body.stage, 'stage');
  const x = Number(body.x);
  const y = Number(body.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) throw new Error('Tap on the picture to place the pin.');
  const note = str(body.note, 600);
  if (note.length < 2) throw new Error('Say what you want changed.');
  return { stage, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, note };
}

function managerInput(body: Body) {
  const name = str(body.name, 80);
  const email = str(body.email, 160).toLowerCase();
  const phoneRaw = str(body.phone, 40);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Check the email address.');
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) throw new Error('Check the phone number (US numbers only).');
  return { name: name || undefined, email: email || undefined, phone: phone || undefined };
}

/** What the client can do from their dashboard (or the setup portal for the front-desk sign-off). */
export async function runClientAction(o: Onboarding, body: Body): Promise<void> {
  requireV2(o);
  const s = await getV2Settings(o.id);
  switch (body.action) {
    case 'pin': {
      const pin = pinInput(body);
      if (pin.stage !== 'staging' && s.reviews?.[pin.stage]?.approvedAt) throw new Error('You already approved this. Ask us by text if you want another change.');
      await addPin(o.id, { ...pin, author: 'client' });
      return;
    }
    case 'approve': {
      const stage = oneOf(REVIEW_STAGES, body.stage, 'stage');
      if (!s.reviews?.[stage]?.sharedAt) throw new Error('Nothing to approve yet.');
      await setV2Entry(o.id, 'reviews', stage, { approvedAt: nowIso() }, { merge: true });
      return;
    }
    case 'approveStaging': {
      const st = stagingState(s.staging);
      if (st.phase !== 'in_review' && st.phase !== 'window_closed') throw new Error('The staging site is not open for review.');
      await patchV2(o.id, { staging: { ...s.staging, approvedAt: nowIso() } });
      return;
    }
    case 'stagingChanges': {
      const st = stagingState(s.staging);
      if (st.phase !== 'in_review') throw new Error('The staging review is not open.');
      const note = str(body.note, 2000);
      if (note.length < 5) throw new Error('Tell us what to change.');
      await patchV2(o.id, { staging: { ...s.staging, changesRequestedAt: nowIso(), changesNote: note } });
      return;
    }
    case 'frontDesk': {
      const by = str(body.name, 80);
      if (by.length < 2) throw new Error('Type your name to sign off.');
      await patchV2(o.id, { frontDesk: { signedOffAt: nowIso(), signedOffBy: by } });
      return;
    }
    case 'manager':
      await patchV2(o.id, { manager: managerInput(body) });
      return;
    case 'averageValue':
      // One tap on the pipeline card: their own value replaces the industry estimate.
      await setAverageValue(o.id, averageValueInput(body.value));
      return;
    case 'uploadList': {
      // Past patients / clients for the win-back texts: names and mobiles only (parseClientList).
      if (body.consent !== true) throw new Error('Tick the box to confirm these people agreed to hear from you.');
      const csv = typeof body.csv === 'string' ? body.csv : '';
      if (!csv.trim()) throw new Error('Choose a file first.');
      if (csv.length > CLIENT_LIST_MAX_BYTES) throw new Error('That file is too big. Keep it under 2,000 people.');
      await importCsv(o.id, csv, new Date(), { nameAndPhoneOnly: true, source: 'client' });
      return;
    }
    default:
      throw new Error('Unknown action');
  }
}

/** Everything the admin sets on a v2 client (components/insights/ProofV2Panel.tsx). Returns a message for the panel, if any. */
export async function runAdminAction(o: Onboarding, body: Body): Promise<string | null> {
  if (body.action === 'version') {
    const v = Number(body.version);
    if (!isProofVersion(v)) throw new Error('Version must be 1 or 2');
    await setProofVersion(o.id, v);
    return `Now on AxeonPROOF v${v}.`;
  }
  if (body.action === 'industry') {
    // Any client, v1 or v2: the words in their portal and dashboard. Not the client's own confirmation.
    if (body.industry === null || body.industry === '') {
      await setIndustry(o.id, null);
      return 'Type of practice cleared.';
    }
    if (!isIndustry(body.industry)) throw new Error('Unknown type of practice');
    await setIndustry(o.id, body.industry);
    return null;
  }
  requireV2(o);
  const s = await getV2Settings(o.id);
  switch (body.action) {
    case 'start': {
      if (body.date === null || body.date === '') await patchV2(o.id, { startAt: null });
      else if (isDate(body.date)) await patchV2(o.id, { startAt: body.date });
      else throw new Error('Pick a start date.');
      return null;
    }
    case 'step': {
      const key = body.key;
      if (!isStepKey(key)) throw new Error('Unknown step');
      const entry: { doneAt?: string; date?: string; note?: string } = { ...(s.steps?.[key] ?? {}) };
      if (body.done === true) entry.doneAt = entry.doneAt ?? nowIso();
      if (body.done === false) delete entry.doneAt;
      if (body.date !== undefined) {
        if (body.date === null || body.date === '') delete entry.date;
        else if (isDate(body.date)) entry.date = body.date;
        else throw new Error('Pick a date.');
      }
      if (body.note !== undefined) entry.note = str(body.note, 300) || undefined;
      await setV2Entry(o.id, 'steps', key, Object.keys(entry).length ? entry : null);
      return null;
    }
    case 'phase': {
      const key = oneOf(PHASE_KEYS, body.key, 'phase') as PhaseKey;
      const status = body.status ? (oneOf(PHASE_STATUSES, body.status, 'status') as PhaseStatus) : undefined;
      const note = str(body.note, 300) || undefined;
      await setV2Entry(o.id, 'phases', key, status || note ? { status, note } : null);
      return null;
    }
    case 'a2p': {
      const brand = oneOf(FILING_STATUSES, body.brand, 'brand status') as FilingStatus;
      const campaign = oneOf(FILING_STATUSES, body.campaign, 'campaign status') as FilingStatus;
      const filed = brand !== 'not_filed' || campaign !== 'not_filed';
      await patchV2(o.id, {
        a2p: {
          brand,
          campaign,
          filedAt: filed ? (s.a2p?.filedAt ?? nowIso()) : undefined,
          approvedAt: campaign === 'approved' ? (s.a2p?.approvedAt ?? nowIso()) : undefined,
        },
      });
      return campaign === 'approved' ? 'Saved. Texting starts once the line itself is switched to "ready" in the Phone panel.' : null;
    }
    case 'share': {
      const stage = oneOf(REVIEW_STAGES, body.stage, 'stage') as ReviewStage;
      const imageUrl = httpsUrl(body.imageUrl, 'The screenshot');
      const url = httpsUrl(body.url, 'The draft link');
      if (!imageUrl && !url) throw new Error('Add a screenshot or a link to share.');
      await setV2Entry(o.id, 'reviews', stage, { imageUrl, url, sharedAt: s.reviews?.[stage]?.sharedAt ?? nowIso(), approvedAt: undefined });
      return 'Shared. The client sees it on their Program tab.';
    }
    case 'reopen': {
      const stage = oneOf(REVIEW_STAGES, body.stage, 'stage') as ReviewStage;
      const cur = s.reviews?.[stage];
      if (!cur) throw new Error('Nothing shared yet.');
      await setV2Entry(o.id, 'reviews', stage, { ...cur, approvedAt: undefined });
      return null;
    }
    case 'pin': {
      await addPin(o.id, { ...pinInput(body), author: 'axeon' });
      return null;
    }
    case 'pinStatus': {
      const id = Number(body.id);
      if (!Number.isInteger(id)) throw new Error('Unknown pin');
      await setPinStatus(o.id, id, body.status === 'open' ? 'open' : 'resolved');
      return null;
    }
    case 'stagingReady': {
      const url = httpsUrl(body.url, 'The staging link');
      const imageUrl = httpsUrl(body.imageUrl, 'The screenshot');
      if (!url) throw new Error('Add the staging link.');
      // A fresh window: earlier approvals and change requests stay on record but no longer count (stagingState compares with readyAt).
      await patchV2(o.id, { staging: { ...s.staging, url, imageUrl, readyAt: nowIso() } });
      return 'Staging marked ready. The client has 48 hours to approve or ask for changes.';
    }
    case 'stagingCall': {
      if (body.at === null || body.at === '') await patchV2(o.id, { staging: { ...s.staging, callAt: undefined } });
      else if (isWhen(body.at)) await patchV2(o.id, { staging: { ...s.staging, callAt: new Date(body.at).toISOString() } });
      else throw new Error('Pick the call time.');
      return null;
    }
    case 'dns': {
      const st = stagingState(s.staging);
      if (st.phase !== 'approved' && st.phase !== 'window_closed') throw new Error('DNS waits for the staging review: approved by the client or the 48 hours passed.');
      await patchV2(o.id, { dnsCutoverAt: body.undo === true ? null : nowIso() });
      return null;
    }
    case 'goLive': {
      const gate = canGoLive(s);
      if (!gate.ok) throw new Error(gate.reason ?? 'Not ready to go live.');
      const items = Array.isArray(body.liveItems) ? body.liveItems.map((x) => str(x, 80)).filter(Boolean).slice(0, 12) : [];
      if (!items.length) throw new Error('List what went live (one per line) for the Launch Certificate.');
      const goLiveAt = nowIso();
      await patchV2(o.id, { goLiveAt, liveItems: items });
      const sent = await sendCertificate(o, { ...s, goLiveAt, liveItems: items });
      return sent ? 'Live. The Launch Certificate was emailed.' : 'Live. The Launch Certificate is on their dashboard (email not sent outside production).';
    }
    case 'certificate': {
      if (!s.goLiveAt) throw new Error('Not live yet.');
      const sent = await sendCertificate(o, s);
      if (!sent) throw new Error('Email is off here (sends only in production with RESEND_API_KEY).');
      return 'Launch Certificate emailed again.';
    }
    case 'nap': {
      if (!isNapKey(body.key)) throw new Error('Unknown directory');
      const status = oneOf(NAP_STATUSES, body.status, 'status') as NapStatus;
      await setV2Entry(o.id, 'nap', body.key, status);
      const next = napProgress({ ...(s.nap ?? {}), [body.key]: status });
      await patchV2(o.id, {
        napStartedAt: s.napStartedAt ?? (status === 'synced' || status === 'submitted' ? nowIso() : undefined),
        napDoneAt: next.total > 0 && next.synced >= next.total ? (s.napDoneAt ?? nowIso()) : null,
      });
      return null;
    }
    case 'sitemap':
      await patchV2(o.id, { sitemapSubmittedAt: body.on === true ? (s.sitemapSubmittedAt ?? nowIso()) : null });
      return null;
    case 'indexedOverride': {
      if (body.clear === true) {
        await patchV2(o.id, { indexedOverride: null });
        return null;
      }
      const indexed = count(body.indexed, 'Indexed');
      const total = count(body.total, 'Total');
      if (indexed == null || total == null || indexed > total) throw new Error('Enter indexed and total pages (indexed no more than total).');
      await patchV2(o.id, { indexedOverride: { indexed, total, at: nowIso() } });
      return null;
    }
    case 'savePage': {
      const kind = body.kind === 'procedure' ? 'procedure' : 'location';
      await savePage(o.id, { id: body.id ? Number(body.id) : undefined, kind, title: str(body.title, 140), slug: str(body.slug, 80), intro: typeof body.intro === 'string' ? body.intro : '', body: typeof body.body === 'string' ? body.body : '' });
      return null;
    }
    case 'publishPage':
      await publishPage(o.id, Number(body.id));
      return 'Published: it passed the uniqueness check.';
    case 'pageIndexed':
      await setPageIndexed(o.id, Number(body.id), body.indexed === true);
      return null;
    case 'deletePage':
      await deletePage(o.id, Number(body.id));
      return null;
    case 'organic': {
      const month = str(body.month, 7);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Pick the month.');
      const topKeywords = str(body.topKeywords, 400)
        .split(/\n|,/)
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 3);
      const data = { impressions: count(body.impressions, 'Impressions'), clicks: count(body.clicks, 'Clicks'), calls: count(body.calls, 'Calls'), forms: count(body.forms, 'Forms'), topKeywords };
      const empty = data.impressions == null && data.clicks == null && data.calls == null && data.forms == null && !topKeywords.length;
      await setV2Entry(o.id, 'organic', month, empty ? null : data);
      return null;
    }
    case 'harvest':
      await patchV2(o.id, { harvestPublishedAt: body.on === true ? (s.harvestPublishedAt ?? nowIso()) : null });
      return null;
    case 'sabr': {
      const next = { ...(s.sabr ?? {}) };
      if (body.scheduledAt !== undefined) {
        if (body.scheduledAt === null || body.scheduledAt === '') {
          delete next.scheduledAt;
          delete next.bookedAt;
        } else if (isDate(body.scheduledAt)) {
          next.scheduledAt = body.scheduledAt;
          next.bookedAt = next.bookedAt ?? nowIso();
        } else throw new Error('Pick the review date.');
      }
      if (body.done === true) next.completedAt = next.completedAt ?? nowIso();
      if (body.done === false) delete next.completedAt;
      await patchV2(o.id, { sabr: next });
      return null;
    }
    case 'manager':
      await patchV2(o.id, { manager: managerInput(body) });
      return null;
    case 'bookingValue': {
      const key = str(body.key, 40);
      if (!/^(contact|booking):\d+$/.test(key)) throw new Error('Unknown booking');
      if (body.value === null || body.value === '') {
        await setV2Entry(o.id, 'bookingValues', key, null);
        return null;
      }
      const v = Number(body.value);
      if (!Number.isFinite(v) || v < 0 || v > 1_000_000) throw new Error('Enter a dollar amount.');
      await setV2Entry(o.id, 'bookingValues', key, Math.round(v));
      return null;
    }
    case 'dbrReviewed': {
      // Law firms: record that the firm reviewed these exact texts (they are attorney advertising).
      if (body.on === false) {
        await patchV2(o.id, { dbrReview: null });
        return null;
      }
      const by = str(body.by, 80);
      if (by.length < 2) throw new Error('Who at the firm reviewed the texts?');
      const steps = validateDbrSteps(body.steps, o.industry);
      await patchV2(o.id, { dbrReview: { reviewedAt: nowIso(), reviewedBy: by, steps } });
      return 'Recorded: the firm reviewed these texts. Editing them needs a fresh review.';
    }
    case 'dbrStart': {
      const steps = validateDbrSteps(body.steps, o.industry);
      const blocked = dbrStartBlock(o.industry, steps, s.dbrReview);
      if (blocked) throw new Error(blocked);
      const { queued } = await startDbrSprint(o.id, steps);
      return `Sprint started: ${queued} past customers queued. Texts go out between 8 AM and 8 PM their time.`;
    }
    case 'dbrStop':
      await stopDbrSprint(o.id);
      return 'Sprint stopped. Nothing else will be sent.';
    case 'averageValue':
      await setAverageValue(o.id, averageValueInput(body.value));
      return null;
    case 'revealEin': {
      // Only on a tap, for filing the carrier texting registration; never rendered on the page by default.
      const ein = await agreementEinFor(o.clientEmail);
      if (!ein) throw new Error('No EIN on their signed agreement. Ask the client for it.');
      return `EIN: ${ein}`;
    }
    default:
      throw new Error('Unknown action');
  }
}

async function sendCertificate(o: Onboarding, s: Awaited<ReturnType<typeof getV2Settings>>): Promise<boolean> {
  if (!v2SendsEnabled() || !s.goLiveAt) return false;
  const to = [o.clientEmail, s.manager?.email].filter((x): x is string => !!x);
  const sent = await sendLaunchCertificateEmail({ to, businessName: o.businessName, goLiveAt: s.goLiveAt, liveItems: s.liveItems ?? [], url: `${APP_ORIGIN}/?tab=program`, industry: o.industry }).catch((err) => {
    console.error('[proof-v2] certificate email failed', err instanceof Error ? err.message : err);
    return false;
  });
  if (sent) await patchV2(o.id, { certificateSentAt: nowIso() });
  return sent;
}
