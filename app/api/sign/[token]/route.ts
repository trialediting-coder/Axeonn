// app/api/sign/[token]/route.ts
// The client signs their agreement: typed name + consent checkbox. We store the
// signature with a SHA-256 of the exact text, then email the signed copy.
import { NextResponse, after } from 'next/server';
import { agreementUrl, getAgreement, signAgreement } from '@/lib/agreements';
import { sendAgreementSignedEmails } from '@/lib/email';
import { clientIp, notFound, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const ip = clientIp(req);
  if (rateLimited(`sign:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  const agreement = await getAgreement(token).catch(() => null);
  if (!agreement) return notFound();
  const body = (await req.json().catch(() => ({}))) as { name?: unknown; title?: unknown; consent?: unknown };
  try {
    const signed = await signAgreement(agreement, {
      name: body.name,
      title: body.title,
      consent: body.consent,
      ip,
      userAgent: req.headers.get('user-agent') ?? '',
    });
    after(async () => {
      await sendAgreementSignedEmails({
        to: signed.clientEmail,
        contactName: signed.contactName || signed.signedName || '',
        businessName: signed.legalName,
        number: signed.number,
        url: agreementUrl(signed.token),
        signedName: signed.signedName ?? '',
      }).catch((err) => console.error('[sign] email failed', err instanceof Error ? err.message : err));
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Could not sign.' }, { status: 400 });
  }
}
