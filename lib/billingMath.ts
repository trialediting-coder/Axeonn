// lib/billingMath.ts
// Pure, dependency-free money helpers so they can be unit tested without Stripe.
// All amounts are integer cents.

export type PaymentKind = 'deposit' | 'balance' | 'full';
export const PAYMENT_KINDS: readonly PaymentKind[] = ['deposit', 'balance', 'full'];

export function isPaymentKind(value: unknown): value is PaymentKind {
  return typeof value === 'string' && (PAYMENT_KINDS as readonly string[]).includes(value);
}

/** Split a project total into a deposit and a remaining balance that always sum to the total. */
export function computeSplit(totalCents: number, depositPercent: number): { deposit: number; balance: number } {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new Error('Total must be a positive integer number of cents');
  }
  if (!Number.isFinite(depositPercent) || depositPercent <= 0 || depositPercent >= 100) {
    throw new Error('Deposit percent must be between 0 and 100 (exclusive)');
  }
  const deposit = Math.round((totalCents * depositPercent) / 100);
  return { deposit, balance: totalCents - deposit };
}

/**
 * Parse a dollar amount typed by an admin ("2,800", "$2,800.50", 450) into cents.
 * Throws on anything that is not a positive, sane amount.
 */
export function dollarsToCents(value: unknown): number {
  const raw =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[$,\s]/g, '')) : NaN;
  if (!Number.isFinite(raw) || raw <= 0) {
    throw new Error('Amount must be a positive number of dollars');
  }
  const cents = Math.round(raw * 100);
  if (cents > 100_000_00) {
    throw new Error('Amount exceeds the $100,000 single-charge limit set in lib/billingMath.ts');
  }
  return cents;
}

export function formatCents(cents: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}
