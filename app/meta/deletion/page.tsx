// app/meta/deletion/page.tsx
// Where Meta sends a person who asked Facebook to delete their Axeon data:
// /meta/deletion?code=<confirmation code from /api/meta/data-deletion>.
// The code is 96 random bits stored only as a hash, and the page shows nothing
// but the date and a page count, so a guessed code reveals nothing.
import type { Metadata } from 'next';
import { deletionStatus } from '@/lib/metaPages';

export const metadata: Metadata = { title: 'Facebook data deletion | Axeon Studio', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function MetaDeletionPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const { code: raw } = await searchParams;
  const code = typeof raw === 'string' ? raw : null;
  const status = code ? await deletionStatus(code).catch(() => null) : null;
  const pages = status
    ? status.pagesRemoved === 0
      ? 'No Facebook pages were connected under your account'
      : `We removed the connection to ${status.pagesRemoved === 1 ? '1 Facebook page' : `${status.pagesRemoved} Facebook pages`} and deleted the access Facebook gave us`
    : '';
  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-16 text-neutral-950">
      <div className="mx-auto max-w-lg rounded-[28px] border border-neutral-200 bg-white p-8 shadow-xs">
        <h1 className="text-2xl font-extrabold tracking-tight">Facebook data deletion</h1>
        {status && code ? (
          <p className="mt-4 text-base leading-relaxed text-neutral-700">
            Done on {new Date(status.at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' })}. {pages}. We also
            deleted any messages and contact details we held under your Facebook account. Your confirmation code is <span className="font-mono">{code}</span>.
          </p>
        ) : (
          <p className="mt-4 text-base leading-relaxed text-neutral-700">
            We could not find that confirmation code. If you asked Facebook to delete your Axeon data, email hello@axeonstudio.co and we will confirm it by hand.
          </p>
        )}
      </div>
    </main>
  );
}
