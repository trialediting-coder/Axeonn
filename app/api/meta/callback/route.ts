// app/api/meta/callback/route.ts
// Facebook Login comes back here with ?code&state (or ?error). We check the
// signed state and the nonce cookie, trade the code for a long-lived user token,
// list the pages the person granted in Meta's dialog, and for each page: find
// the linked Instagram account, seal and store the page token, and subscribe the
// page to our webhook. Then the portal item is marked done and the person lands
// back where they started with ?meta=<result>. No token is ever logged.
import { NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { inboxEnabled } from '@/lib/contactsShared';
import { exchangeCode, igAccountFor, listPages, longLivedToken, metaUnavailable, metaUserId, subscribePage, verifyState } from '@/lib/meta';
import { errText } from '@/lib/dbRows';
import { META_CONNECT_ITEM, META_NONCE_COOKIE, connectOutcome, secretRedact, type ConnectResult } from '@/lib/metaShared';
import { markNeedsReconnect, savePage } from '@/lib/metaPages';
import { markConnectedItem, welcomeUrl } from '@/lib/onboarding';
import { afterOnboardingChange } from '@/lib/onboardingSync';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { loadOnboarding } from '@/lib/welcomeApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const redactedErr = (err: unknown) => secretRedact(errText(err));

/** Every exit clears the nonce cookie, including the early 400/404 ones. */
function clearNonce<T extends NextResponse>(res: T): T {
  res.cookies.set({ name: META_NONCE_COOKIE, value: '', path: '/api/meta', maxAge: 0 });
  return res;
}

export async function GET(req: Request) {
  const unavailable = metaUnavailable();
  if (unavailable) return unavailable;
  const url = new URL(req.url);
  const state = verifyState(url.searchParams.get('state'));
  if (!state) return clearNonce(new NextResponse('This connection link expired. Go back to your setup page and press Connect again.', { status: 400 }));
  const onboarding = await loadOnboarding(state.token);
  if (!onboarding || onboarding.status === 'closed' || !inboxEnabled(onboarding.tier)) return clearNonce(new NextResponse('Not found', { status: 404 }));

  const back = (result: ConnectResult) => {
    const target = state.from === 'admin' ? `${APP_ORIGIN}/admin/onboarding/${onboarding.token}` : welcomeUrl(onboarding.token);
    return clearNonce(NextResponse.redirect(`${target}?meta=${result}`, 303));
  };

  const jar = await cookies();
  if (jar.get(META_NONCE_COOKIE)?.value !== state.nonce) return back('error');
  if (url.searchParams.get('error')) return back('cancelled');
  const code = url.searchParams.get('code');
  if (!code) return back('error');

  try {
    const userToken = await longLivedToken(await exchangeCode(code));
    const fbUserId = await metaUserId(userToken);
    const pages = await listPages(userToken);
    if (!pages.length) return back('no-pages');
    let saved = 0;
    let failed = 0;
    for (const page of pages) {
      let stored = false;
      try {
        // null means "no Instagram linked"; a thrown lookup keeps whatever link is already stored.
        let ig: Awaited<ReturnType<typeof igAccountFor>> = null;
        let igFailed = false;
        try {
          ig = await igAccountFor(page.id, page.accessToken);
        } catch (err) {
          igFailed = true;
          console.error('[meta:callback] instagram lookup', page.id, redactedErr(err));
        }
        await savePage({ onboardingId: onboarding.id, pageId: page.id, pageName: page.name, igUserId: ig?.id ?? null, igUsername: ig?.username ?? null, fbUserId, pageToken: page.accessToken, keepExistingIg: igFailed });
        stored = true;
        await subscribePage(page.id, page.accessToken);
        saved += 1;
      } catch (err) {
        failed += 1;
        const why = redactedErr(err);
        console.error('[meta:callback] page', page.id, why);
        // Stored but not subscribed: no webhooks will arrive, so the admin card must say so.
        if (stored) {
          await markNeedsReconnect(page.id, `Webhook subscription failed: ${why}`).catch((e) => console.error('[meta:callback] mark', page.id, redactedErr(e)));
        }
      }
    }
    const result = connectOutcome(saved, failed);
    if (saved) {
      await markConnectedItem(onboarding, META_CONNECT_ITEM);
      after(() => afterOnboardingChange(onboarding.token));
    }
    return back(result);
  } catch (err) {
    console.error('[meta:callback]', redactedErr(err));
    return back('error');
  }
}
