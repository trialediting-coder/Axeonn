// app/f/[token]/page.tsx
// Where the "Was this report useful?" links and the owner's notes land. The
// tap in the email (?r=yes|sortof|no) is recorded on arrival, then the page
// says thanks and offers one box for a sentence. No login: the signed token in
// the URL is the credential (lib/feedback.ts).
import type { Metadata } from 'next';
import { AxeonLogo } from '@/components/brand/AxeonLogo';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { getFeedback, isFeedbackRating, readFeedbackToken, recordFeedback, surveyFor, type FeedbackRating } from '@/lib/feedback';
import { getOnboardingById } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Thanks', robots: { index: false, follow: false } };

/** Axeon's own Google review link (GOOGLE_REVIEW_URL). Without it the day-90 "yes" page just says thanks. */
const REVIEW_URL = process.env.GOOGLE_REVIEW_URL || null;

export default async function FeedbackPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ r?: string; q?: string; a?: string }> }) {
  const { token } = await params;
  const { r, q, a } = await searchParams;
  const ref = readFeedbackToken(token);
  const onboarding = ref ? await getOnboardingById(ref.onboardingId).catch(() => null) : null;
  const rating: FeedbackRating | null = isFeedbackRating(r) ? r : null;
  // A survey tap in the email arrives as ?q=<question>&a=<answer>; it is recorded before the page asks the rest.
  const tapped = ref && typeof q === 'string' && typeof a === 'string' ? { [q]: a } : null;
  if (ref && onboarding && (rating || tapped)) {
    await recordFeedback(ref, { rating, answers: tapped }, { businessName: onboarding.businessName || onboarding.clientEmail, token: onboarding.token }).catch((err) =>
      console.error('[feedback] record failed', err instanceof Error ? err.message : err)
    );
  }
  const valid = !!(ref && onboarding);
  const questions = ref ? surveyFor(ref.kind) : [];
  const existing = valid && questions.length ? await getFeedback(ref!).catch(() => null) : null;
  const answered = existing?.answers ?? {};
  const remaining = questions.filter((x) => !answered[x.key]);
  const first = onboarding?.clientName?.trim().split(/\s+/)[0];
  return (
    <main className="min-h-screen bg-[#F6F7F9] px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <AxeonLogo size="sm" />
        {valid ? (
          <>
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-neutral-950">
              {questions.length
                ? remaining.length
                  ? `Got it${first ? `, ${first}` : ''}. ${remaining.length === questions.length ? 'Three quick ones.' : remaining.length === 1 ? 'One more.' : `${remaining.length} more.`}`
                  : `That is all of them. Thank you${first ? `, ${first}` : ''}.`
                : rating === 'no'
                  ? 'Sorry about that.'
                  : rating
                    ? `Thanks${first ? `, ${first}` : ''}.`
                    : `Hi${first ? ` ${first}` : ''}.`}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {questions.length
                ? remaining.length
                  ? 'Tap one answer each. What you pick decides what we work on next.'
                  : 'Anything else you want more of, or less of? One sentence is plenty, and optional.'
                : rating === 'no'
                  ? 'One sentence on what missed the mark and we will fix it in the next one.'
                  : rating === 'sortof'
                    ? 'What would have made it more useful? One sentence is plenty.'
                    : rating === 'yes'
                      ? 'Anything you would like more of, or less of? Optional.'
                      : 'Anything about the site, the numbers or how we are working together? One sentence is plenty.'}
            </p>
            {ref?.kind === 'note90' && rating === 'yes' && REVIEW_URL ? (
              <a
                href={REVIEW_URL}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Leave a Google review
              </a>
            ) : null}
            <FeedbackForm token={token} rating={rating} questions={remaining} />
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-neutral-950">This link has expired.</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Reply to the email you got from us instead, or write to <a className="font-semibold text-blue-600" href="mailto:hello@axeonstudio.co">hello@axeonstudio.co</a>.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
