// app/f/[token]/page.tsx
// Where the "Was this report useful?" links and the owner's notes land. The
// tap in the email (?r=yes|sortof|no) is recorded on arrival, then the page
// says thanks and offers one box for a sentence. No login: the signed token in
// the URL is the credential (lib/feedback.ts).
import type { Metadata } from 'next';
import { AxeonLogo } from '@/components/brand/AxeonLogo';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { isFeedbackRating, readFeedbackToken, recordFeedback, type FeedbackRating } from '@/lib/feedback';
import { getOnboardingById } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Thanks', robots: { index: false, follow: false } };

export default async function FeedbackPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ r?: string }> }) {
  const { token } = await params;
  const { r } = await searchParams;
  const ref = readFeedbackToken(token);
  const onboarding = ref ? await getOnboardingById(ref.onboardingId).catch(() => null) : null;
  const rating: FeedbackRating | null = isFeedbackRating(r) ? r : null;
  if (ref && onboarding && rating) {
    await recordFeedback(ref, { rating }, { businessName: onboarding.businessName || onboarding.clientEmail, token: onboarding.token }).catch((err) =>
      console.error('[feedback] record failed', err instanceof Error ? err.message : err)
    );
  }
  const valid = !!(ref && onboarding);
  const first = onboarding?.clientName?.trim().split(/\s+/)[0];
  return (
    <main className="min-h-screen bg-[#F6F7F9] px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <AxeonLogo size="sm" />
        {valid ? (
          <>
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-neutral-950">
              {rating === 'no' ? 'Sorry about that.' : rating ? `Thanks${first ? `, ${first}` : ''}.` : `Hi${first ? ` ${first}` : ''}.`}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {rating === 'no'
                ? 'One sentence on what missed the mark and we will fix it in the next one.'
                : rating === 'sortof'
                  ? 'What would have made it more useful? One sentence is plenty.'
                  : rating === 'yes'
                    ? 'Anything you would like more of, or less of? Optional.'
                    : 'Anything about the site, the numbers or how we are working together? One sentence is plenty.'}
            </p>
            <FeedbackForm token={token} rating={rating} />
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
