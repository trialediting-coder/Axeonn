import { redirect } from 'next/navigation';

// /get-started used to be the self-serve plan picker. Since the 2026-10-19
// practice repositioning there is no self-serve path: every practice starts
// with the free after-hours audit. Kept as a route (not deleted) so old links,
// ads and emails still land somewhere useful. /get-started/success stays for
// any Stripe link that still redirects there.
export default function GetStartedPage() {
  redirect('/audit');
}
