// lib/clientBilling.test.ts
// Run with: npm run test:onboarding   (pure summary; no Stripe)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, summarizeBilling } from './clientBilling';

const customer = {
  id: 'cus_1',
  invoice_settings: { default_payment_method: { card: { brand: 'visa', last4: '4242', exp_month: 7, exp_year: 2028 } } },
};
const sub = (status: string, extra: Partial<{ cancel_at_period_end: boolean }> = {}) => ({
  status,
  cancel_at_period_end: false,
  ...extra,
  items: { data: [{ current_period_end: 1762041600, price: { unit_amount: 29900, currency: 'usd', recurring: { interval: 'month' }, product: { name: 'AxeonCORE' } } }] },
});
const inv = (id: string, status: string, created: number, amount = 29900) => ({
  id, number: `AX-${id}`, created, amount_due: amount, currency: 'usd', status, hosted_invoice_url: `https://pay.stripe.com/${id}`, invoice_pdf: `https://pay.stripe.com/${id}.pdf`,
});

test('billing summary: plan, card, invoices newest first, open balance', () => {
  const s = summarizeBilling(customer, [sub('canceled'), sub('active')], [inv('a', 'paid', 1756684800), inv('b', 'open', 1759363200), inv('d', 'draft', 1759400000), inv('c', 'paid', 1754006400)]);
  assert.equal(s.plan?.name, 'AxeonCORE');
  assert.equal(s.plan?.status, 'active', 'the live plan wins over an ended one');
  assert.equal(s.plan?.amount, 299);
  assert.equal(s.plan?.interval, 'month');
  assert.equal(s.plan?.periodEnd, '2025-11-02T00:00:00.000Z');
  assert.deepEqual(s.card, { brand: 'visa', last4: '4242', expMonth: 7, expYear: 2028 });
  assert.deepEqual(s.invoices.map((i) => i.id), ['b', 'a', 'c'], 'drafts are left out');
  assert.equal(s.invoices[0].status, 'open');
  assert.equal(s.due, 299);
  assert.equal(s.currency, 'USD');
});

test('billing summary: no plan and no card still gives a usable summary', () => {
  const s = summarizeBilling({ id: 'cus_2', invoice_settings: { default_payment_method: 'pm_123' } }, [], [inv('x', 'paid', 1754006400, 149000)]);
  assert.equal(s.plan, null);
  assert.equal(s.card, null, 'an unexpanded payment method id is not a card');
  assert.equal(s.invoices[0].amount, 1490);
  assert.equal(s.due, 0);
});

test('money formats whole and fractional amounts', () => {
  assert.equal(money(299), '$299');
  assert.equal(money(1250.5), '$1,250.50');
});
