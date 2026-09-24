import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeSplit, dollarsToCents, formatCents, isPaymentKind } from './billingMath';

describe('computeSplit', () => {
  it('splits a total so deposit and balance always sum to the total', () => {
    assert.deepEqual(computeSplit(280000, 50), { deposit: 140000, balance: 140000 });
    assert.deepEqual(computeSplit(580000, 50), { deposit: 290000, balance: 290000 });
    const odd = computeSplit(100001, 33);
    assert.equal(odd.deposit + odd.balance, 100001);
  });

  it('rejects bad totals and percents', () => {
    assert.throws(() => computeSplit(0, 50));
    assert.throws(() => computeSplit(100.5, 50));
    assert.throws(() => computeSplit(1000, 0));
    assert.throws(() => computeSplit(1000, 100));
  });
});

describe('dollarsToCents', () => {
  it('parses admin-typed amounts', () => {
    assert.equal(dollarsToCents('2,800'), 280000);
    assert.equal(dollarsToCents('$2,800.50'), 280050);
    assert.equal(dollarsToCents(450), 45000);
    assert.equal(dollarsToCents(' 99.99 '), 9999);
  });

  it('rejects nonsense', () => {
    assert.throws(() => dollarsToCents(''));
    assert.throws(() => dollarsToCents('abc'));
    assert.throws(() => dollarsToCents(-5));
    assert.throws(() => dollarsToCents(0));
    assert.throws(() => dollarsToCents(null));
    assert.throws(() => dollarsToCents('250000'));
  });
});

describe('formatCents', () => {
  it('formats USD', () => {
    assert.equal(formatCents(280000), '$2,800.00');
    assert.equal(formatCents(9999, 'usd'), '$99.99');
  });
});

describe('isPaymentKind', () => {
  it('accepts only the three kinds', () => {
    assert.equal(isPaymentKind('deposit'), true);
    assert.equal(isPaymentKind('balance'), true);
    assert.equal(isPaymentKind('full'), true);
    assert.equal(isPaymentKind('refund'), false);
    assert.equal(isPaymentKind(undefined), false);
  });
});
