'use client';

// components/get-started/GetStartedFlow.tsx
// Self-serve intake used on /get-started and embedded in the homepage contact
// section: a short multi-step form, a deterministic package recommendation
// (lib/getStarted.ts), then a "book a call" hand-off. There is deliberately no
// direct payment step: the lead has to land in Airtable (via the n8n webhook)
// and go through a call first.
//
// The lead is posted to /api/get-started/lead BEFORE the result is shown, but a
// failed post is only logged: the visitor always gets a result.
//
// Progress is saved to localStorage on every change, so a visitor who leaves
// and comes back (either page) picks up exactly where they stopped.

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Loader2 } from 'lucide-react';
import {
  BOOKING_URL,
  BUDGETS,
  BUSINESS_TYPES,
  CUSTOM_PACKAGE,
  GOALS,
  HAS_WEBSITE,
  PACKAGES,
  SERVICES,
  TIMELINES,
  type Package,
  type Service,
} from '@/data/getStartedPackages';
import {
  buildLeadPayload,
  isCustomPackage,
  isValidEmail,
  recommendPackage,
  type ContactInfo,
  type GetStartedAnswers,
} from '@/lib/getStarted';
import { trackEvent } from '@/components/providers/AnalyticsTracker';

const LEAD_TIMEOUT_MS = 10000;
// Single-choice steps advance on their own; this pause lets the checkmark register first.
const AUTO_ADVANCE_MS = 280;
const STORAGE_KEY = 'axeon:get-started:v1';

const inputClass =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-colors aria-[invalid=true]:border-red-500';
const optionClass =
  'flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-base font-medium text-neutral-900 transition-colors hover:border-neutral-300 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-600/20';

type SingleKey = 'businessType' | 'hasWebsite' | 'goal' | 'budget' | 'timeline';
type ContactErrors = Partial<Record<keyof ContactInfo, string>>;

interface ChoiceStep {
  kind: 'multi' | 'single';
  key: 'services' | SingleKey;
  title: string;
  hint?: string;
  options: readonly string[];
  error: string;
}

const CHOICE_STEPS: ChoiceStep[] = [
  {
    kind: 'multi',
    key: 'services',
    title: 'What do you need help with?',
    hint: 'Pick everything that applies.',
    options: SERVICES,
    error: 'Pick at least one service.',
  },
  { kind: 'single', key: 'businessType', title: 'What kind of business is it?', options: BUSINESS_TYPES, error: 'Choose a business type.' },
  { kind: 'single', key: 'hasWebsite', title: 'Do you have a website today?', options: HAS_WEBSITE, error: 'Choose an answer.' },
  { kind: 'single', key: 'goal', title: 'What’s the main goal for the next 90 days?', options: GOALS, error: 'Choose a goal.' },
  {
    kind: 'single',
    key: 'budget',
    title: 'What’s your monthly budget?',
    hint: 'A rough range is fine. It keeps the recommendation realistic.',
    options: BUDGETS,
    error: 'Choose a budget range.',
  },
  { kind: 'single', key: 'timeline', title: 'When do you want to get started?', options: TIMELINES, error: 'Choose a timeline.' },
];

const TOTAL_STEPS = CHOICE_STEPS.length + 1;

/**
 * Front-loaded progress: big jumps early, small ones near the end, so the form
 * feels nearly done after a couple of answers. Step 0 → 12%, last step → ~98%.
 */
function progressFor(step: number): number {
  const f = step / TOTAL_STEPS;
  return Math.round(12 + 88 * (1 - (1 - f) ** 2));
}

const EMPTY_ANSWERS: GetStartedAnswers = {
  services: [],
  businessType: '',
  hasWebsite: '',
  goal: '',
  budget: '',
  timeline: '',
};
const EMPTY_CONTACT: ContactInfo = { businessName: '', contactName: '', email: '', phone: '', website: '' };

interface SavedState {
  step: number;
  answers: GetStartedAnswers;
  contact: ContactInfo;
  result: { pkgId: string; email: string } | null;
}

const ALL_PACKAGES = [...PACKAGES, CUSTOM_PACKAGE];

// Storage can throw (private mode, blocked site data) or hold stale shapes from
// an older version; any problem just means starting fresh.
function loadSaved(): SavedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<SavedState>;
    const step = Number.isInteger(s.step) ? Math.min(Math.max(s.step as number, 0), TOTAL_STEPS - 1) : 0;
    const answers = { ...EMPTY_ANSWERS, ...s.answers };
    answers.services = (Array.isArray(answers.services) ? answers.services : []).filter((x) => SERVICES.includes(x));
    const contact = { ...EMPTY_CONTACT, ...s.contact };
    const result =
      s.result && ALL_PACKAGES.some((p) => p.id === s.result?.pkgId) && typeof s.result.email === 'string'
        ? s.result
        : null;
    return { step, answers, contact, result };
  } catch {
    return null;
  }
}

function save(state: SavedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Saving is a convenience; the form still works without it.
  }
}

function clearSaved() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function validateContact(c: ContactInfo): ContactErrors {
  const errors: ContactErrors = {};
  if (!c.businessName.trim()) errors.businessName = 'Enter your business name.';
  if (!c.contactName.trim()) errors.contactName = 'Enter your name.';
  if (!c.email.trim()) errors.email = 'Enter your email.';
  else if (!isValidEmail(c.email)) errors.email = 'Enter a valid email, like you@business.com.';
  return errors;
}

async function postLead(payload: unknown) {
  try {
    const res = await fetch('/api/get-started/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(LEAD_TIMEOUT_MS),
    });
    if (!res.ok) console.error('[get-started] lead submit failed', res.status, await res.text().catch(() => ''));
  } catch (err) {
    // Never block the visitor on lead capture.
    console.error('[get-started] lead submit failed', err);
  }
}

export function GetStartedFlow({
  embedded = false,
  source = embedded ? 'home_get_started' : 'get_started',
}: {
  /** Render without the flow's own card/width (the parent supplies the card). */
  embedded?: boolean;
  /** Analytics source for the generate_lead event. */
  source?: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<GetStartedAnswers>(EMPTY_ANSWERS);
  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT);
  const [honeypot, setHoneypot] = useState('');
  const [stepError, setStepError] = useState('');
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ pkg: Package; email: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasInteracted = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set by an arrow keypress inside a radio group; the click the browser then
  // fires on the newly selected radio should select without advancing.
  const arrowNav = useRef(false);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  // Restore after mount (localStorage doesn't exist during SSR).
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setStep(saved.step);
      setAnswers(saved.answers);
      setContact(saved.contact);
      if (saved.result) {
        const pkg = ALL_PACKAGES.find((p) => p.id === saved.result!.pkgId)!;
        setResult({ pkg, email: saved.result.email });
      }
    }
    setLoaded(true);
  }, []);

  // Save on every change, but only once the restore has run so it can't be clobbered.
  useEffect(() => {
    if (!loaded) return;
    save({ step, answers, contact, result: result ? { pkgId: result.pkg.id, email: result.email } : null });
  }, [loaded, step, answers, contact, result]);

  // Move focus to the new heading on every step change (not on first paint or
  // restore), so screen readers announce it and keyboard users start at the top.
  useEffect(() => {
    if (!hasInteracted.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const top = topRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step, result]);

  const isContactStep = step === CHOICE_STEPS.length;
  const current = CHOICE_STEPS[step];
  // Single-choice steps move on as soon as an option is picked, so they get no Continue button.
  const autoAdvances = !isContactStep && current.kind === 'single';

  function stepIsValid(i: number): boolean {
    const s = CHOICE_STEPS[i];
    if (!s) return true;
    return s.kind === 'multi' ? answers.services.length > 0 : Boolean(answers[s.key as SingleKey]);
  }

  function goTo(next: number) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    hasInteracted.current = true;
    setStepError('');
    setStep(next);
  }

  function toggleService(service: Service) {
    setStepError('');
    setAnswers((a) => ({
      ...a,
      services: a.services.includes(service) ? a.services.filter((s) => s !== service) : [...a.services, service],
    }));
  }

  function setSingle(key: SingleKey, value: string) {
    setStepError('');
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  /**
   * Pick a single-choice answer and move on. Runs on click (not change) so
   * re-clicking an existing answer after Back still advances. Arrow-key
   * navigation also fires click; those only select (see arrowNav), so
   * keyboard users can browse options and press Enter to advance. This used
   * to key off `event.detail > 0`, but a tap or click on the label reaches
   * the hidden radio as a forwarded click with detail 0 in Chrome and on
   * phones, so taps never advanced.
   */
  function chooseSingle(key: SingleKey, value: string, advance: boolean) {
    setSingle(key, value);
    if (!advance) return;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const from = step;
    advanceTimer.current = setTimeout(() => goTo(from + 1), AUTO_ADVANCE_MS);
  }

  function updateContact(key: keyof ContactInfo, value: string) {
    setContact((c) => ({ ...c, [key]: value }));
    // Clear a field's error as soon as it becomes valid.
    if (contactErrors[key]) {
      const stillBad = validateContact({ ...contact, [key]: value })[key];
      setContactErrors((e) => ({ ...e, [key]: stillBad }));
    }
  }

  function blurContact(key: keyof ContactInfo) {
    const value = contact[key];
    if (!value.trim() && key !== 'email') return;
    const err = validateContact(contact)[key];
    setContactErrors((e) => ({ ...e, [key]: err }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!isContactStep) {
      if (!stepIsValid(step)) {
        setStepError(current.error);
        return;
      }
      goTo(step + 1);
      return;
    }

    const errors = validateContact(contact);
    setContactErrors(errors);
    const firstBad = (Object.keys(errors) as (keyof ContactInfo)[]).find((k) => errors[k]);
    if (firstBad) {
      document.getElementById(`gs-${firstBad}`)?.focus();
      return;
    }

    setSubmitting(true);
    const pkg = recommendPackage(answers);
    const payload = buildLeadPayload(answers, contact, pkg, honeypot);
    await postLead(payload);
    trackEvent('generate_lead', { source, lead_type: 'get_started_form', package_id: pkg.id, value: pkg.price, currency: 'USD' });

    hasInteracted.current = true;
    setResult({ pkg, email: payload.email });
    setSubmitting(false);
  }

  function startOver() {
    clearSaved();
    setAnswers(EMPTY_ANSWERS);
    setContact(EMPTY_CONTACT);
    setContactErrors({});
    setResult(null);
    goTo(0);
  }

  if (result) {
    return (
      <div ref={topRef} className="scroll-mt-28">
        <ResultCard pkg={result.pkg} headingRef={headingRef} onStartOver={startOver} embedded={embedded} />
      </div>
    );
  }

  const progress = progressFor(step);
  const errorId = 'gs-step-error';

  return (
    <div ref={topRef} className={`scroll-mt-28 ${embedded ? '' : 'max-w-2xl'}`}>
      <div
        role="progressbar"
        aria-label="Form progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="mb-6 h-2 w-full overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className={`relative ${embedded ? '' : 'rounded-[28px] border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs'}`}
      >
        {/* Honeypot: humans never see or reach it. */}
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="company_fax">Company fax</label>
          <input
            id="company_fax"
            name="company_fax"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {!isContactStep ? (
          <fieldset aria-describedby={stepError ? errorId : undefined}>
            <legend className="w-full">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 outline-none"
              >
                {current.title}
              </h2>
              {current.hint && <p className="mt-1.5 text-base text-neutral-500">{current.hint}</p>}
            </legend>

            <div className={`mt-6 grid gap-3 ${current.options.length > 4 ? 'sm:grid-cols-2' : ''}`}>
              {current.options.map((option) => {
                const multi = current.kind === 'multi';
                const checked = multi
                  ? answers.services.includes(option as Service)
                  : answers[current.key as SingleKey] === option;
                return (
                  <label key={option} className={optionClass}>
                    <input
                      type={multi ? 'checkbox' : 'radio'}
                      name={current.key}
                      value={option}
                      checked={checked}
                      onChange={() => (multi ? toggleService(option as Service) : setSingle(current.key as SingleKey, option))}
                      onClick={
                        multi
                          ? undefined
                          : () => {
                              const fromArrowKey = arrowNav.current;
                              arrowNav.current = false;
                              chooseSingle(current.key as SingleKey, option, !fromArrowKey);
                            }
                      }
                      onKeyDown={
                        multi
                          ? undefined
                          : (e) => {
                              if (e.key.startsWith('Arrow')) {
                                // The resulting click fires right after this keydown;
                                // reset afterwards so a stray flag can't block a tap.
                                arrowNav.current = true;
                                setTimeout(() => (arrowNav.current = false), 0);
                                return;
                              }
                              if (e.key !== 'Enter') return;
                              e.preventDefault();
                              e.currentTarget.form?.requestSubmit();
                            }
                      }
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors ${
                        multi ? 'rounded-md' : 'rounded-full'
                      } ${checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-300 bg-white'}`}
                    >
                      {checked && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>

            <p id={errorId} role="alert" className="mt-3 min-h-[1.25rem] text-sm font-medium text-red-600">
              {stepError}
            </p>
          </fieldset>
        ) : (
          <div>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 outline-none"
            >
              Where should we send your plan?
            </h2>
            <p className="mt-1.5 text-base text-neutral-500">Fields marked * are required.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field id="businessName" label="Business name" required error={contactErrors.businessName}>
                {(props) => (
                  <input
                    {...props}
                    type="text"
                    autoComplete="organization"
                    value={contact.businessName}
                    onChange={(e) => updateContact('businessName', e.target.value)}
                    onBlur={() => blurContact('businessName')}
                  />
                )}
              </Field>
              <Field id="contactName" label="Your name" required error={contactErrors.contactName}>
                {(props) => (
                  <input
                    {...props}
                    type="text"
                    autoComplete="name"
                    value={contact.contactName}
                    onChange={(e) => updateContact('contactName', e.target.value)}
                    onBlur={() => blurContact('contactName')}
                  />
                )}
              </Field>
              <Field id="email" label="Email" required error={contactErrors.email} className="sm:col-span-2">
                {(props) => (
                  <input
                    {...props}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={contact.email}
                    onChange={(e) => updateContact('email', e.target.value)}
                    onBlur={() => blurContact('email')}
                  />
                )}
              </Field>
              <Field id="phone" label="Phone">
                {(props) => (
                  <input
                    {...props}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact('phone', e.target.value)}
                  />
                )}
              </Field>
              <Field id="website" label="Current website">
                {(props) => (
                  <input
                    {...props}
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="yourbusiness.com"
                    value={contact.website}
                    onChange={(e) => updateContact('website', e.target.value)}
                  />
                )}
              </Field>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={submitting}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-base font-semibold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          {autoAdvances ? null : (
          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 cursor-pointer disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Finding your plan…
              </>
            ) : isContactStep ? (
              <>
                See my recommendation <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            ) : (
              <>
                Continue <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  className = '',
  children,
}: {
  id: keyof ContactInfo;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: (props: {
    id: string;
    name: string;
    required?: boolean;
    'aria-invalid': boolean;
    'aria-describedby'?: string;
    className: string;
  }) => ReactNode;
}) {
  const inputId = `gs-${id}`;
  const errorId = `${inputId}-error`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-neutral-800">
        {label}
        {required && <span className="text-blue-600"> *</span>}
      </label>
      {children({
        id: inputId,
        name: id,
        required,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
        className: inputClass,
      })}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function ResultCard({
  pkg,
  headingRef,
  onStartOver,
  embedded,
}: {
  pkg: Package;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onStartOver: () => void;
  embedded: boolean;
}) {
  const custom = isCustomPackage(pkg);

  return (
    <div className={embedded ? '' : 'max-w-2xl'}>
      <p className="font-mono text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">Your recommendation</p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 outline-none"
      >
        {custom ? 'Let’s build a custom plan.' : 'Here’s the best fit.'}
      </h2>

      <article className="mt-6 rounded-[28px] border-2 border-blue-600 bg-white p-6 sm:p-8 shadow-lg shadow-blue-600/10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-neutral-950">{pkg.name}</h3>
            <p className="mt-1.5 text-base text-neutral-600 leading-relaxed">{pkg.tagline}</p>
          </div>
          <p className="shrink-0 text-xl font-extrabold tracking-tight text-neutral-950 sm:text-right">{pkg.priceLabel}</p>
        </div>

        <ul className="mt-6 space-y-3 border-t border-neutral-100 pt-6">
          {pkg.includes.map((item) => (
            <li key={item} className="flex items-start gap-3 text-base text-neutral-800">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Check size={13} strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          <Link
            href={BOOKING_URL}
            data-track="cta_click"
            data-track-cta="get_started_book_call"
            className="inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            <CalendarCheck size={18} /> Book my free call to lock this in
          </Link>
          <p className="text-center text-sm text-neutral-500">
            We already have your answers, so the call starts with your plan, not a questionnaire.
          </p>
        </div>
      </article>

      <button
        type="button"
        onClick={onStartOver}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Start over
      </button>
    </div>
  );
}
