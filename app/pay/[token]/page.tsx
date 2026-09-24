import type { Metadata } from 'next';
import { depositPercent, planForTier } from '@/lib/billing';
import { computeSplit, formatCents } from '@/lib/billingMath';
import { getPayLink, payLinkState } from '@/lib/payLinks';
import { getPublicCatalog } from '@/lib/publicCatalog';
import { isStripeConfigured } from '@/lib/stripe';
import { PersonalizedPayment, type PersonalizedPaymentProps } from '@/components/pay/PersonalizedPayment';

// A personalized pay link: /pay/K7QZ2MPD. The admin minted it for one client with
// the scope locked; this page just renders that scope and hands off to Stripe.
// Never indexed, never cached: state changes the moment the client pays.
export const metadata: Metadata = {
  title: 'Your payment | Axeon Studio',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

const money = (cents: number) => formatCents(cents).replace(/\.00$/, '');

/** "jane@smithroofing.com" -> "j***@smithroofing.com": the URL may get forwarded. */
function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user[0]}${'*'.repeat(Math.min(6, Math.max(2, user.length - 1)))}@${domain}`;
}

const INVALID: PersonalizedPaymentProps = {
  token: '',
  state: 'invalid',
  clientName: null,
  maskedEmail: null,
  note: null,
  headline: '',
  lines: [],
  total: null,
  dueLabel: '',
  due: '',
  dueNote: '',
  expiresAt: null,
  stripeConfigured: false,
};

async function buildProps(rawToken: string): Promise<PersonalizedPaymentProps> {
  const token = rawToken.trim().toUpperCase();
  const link = await getPayLink(token).catch((err) => {
    console.error('[pay-link]', err instanceof Error ? err.message : err);
    return null;
  });
  if (!link) return INVALID;

  const catalog = await getPublicCatalog();
  const base = {
    token: link.token,
    state: payLinkState(link),
    clientName: link.clientName,
    maskedEmail: maskEmail(link.clientEmail),
    note: link.note,
    expiresAt: link.expiresAt,
    stripeConfigured: isStripeConfigured(),
  };

  if (link.kind === 'plan') {
    const plan = link.planKey ? catalog.plans[link.planKey] : null;
    if (!plan) return INVALID;
    return {
      ...base,
      headline: plan.label,
      lines: [{ label: plan.label, amount: `${money(plan.amountCents)}/mo` }],
      total: null,
      dueLabel: 'Per month',
      due: money(plan.amountCents),
      dueNote:
        'Billed monthly from today. Renewals run automatically, and you can update your card or view invoices any time.',
    };
  }

  const tier = catalog.tiers.find((t) => t.key === link.tier);
  if (!tier) return INVALID;
  const addOns = catalog.addOns.filter((a) => link.addOns.includes(a.key));
  const total = tier.amountCents + addOns.reduce((sum, a) => sum + a.amountCents, 0);
  const percent = depositPercent();
  const split = computeSplit(total, percent);
  const due = link.kind === 'full' ? total : link.kind === 'deposit' ? split.deposit : split.balance;

  const headline =
    link.kind === 'deposit'
      ? `${percent}% deposit for your ${tier.label}`
      : link.kind === 'balance'
        ? `Remaining balance for your ${tier.label}`
        : `Your ${tier.label}`;

  const planKey = planForTier(tier.key);
  const plan = planKey ? catalog.plans[planKey] : null;
  const planNote = plan
    ? ` Your ${plan.label} (${money(plan.amountCents)}/mo) starts after launch and is set up separately.`
    : '';
  const dueNote =
    link.kind === 'deposit'
      ? `The remaining ${money(split.balance)} is due at launch.${planNote}`
      : link.kind === 'balance'
        ? `Assumes the ${money(split.deposit)} deposit has already been paid.${planNote}`
        : `Covers the full project. Nothing further is due for the build.${planNote}`;

  return {
    ...base,
    headline,
    lines: [
      { label: tier.label, amount: money(tier.amountCents) },
      ...addOns.map((a) => ({ label: a.label, amount: `+${money(a.amountCents)}` })),
    ],
    total: money(total),
    dueLabel: 'Due today',
    due: money(due),
    dueNote,
  };
}

export default async function PayLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const props = await buildProps(token);

  return (
    <main className="min-h-screen bg-white text-neutral-950 pt-28 sm:pt-32 pb-24 px-6 sm:px-10">
      <div className="max-w-xl mx-auto mb-8 text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-600">Axeon Studio · Secure payment</p>
      </div>
      <PersonalizedPayment {...props} />
    </main>
  );
}
