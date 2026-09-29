'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/components/providers/AnalyticsTracker';

/**
 * Fires the GA4 `purchase` key event once per Checkout Session. The success
 * page can be refreshed or revisited, so the session id is remembered in
 * sessionStorage and GA also dedupes on transaction_id.
 */
export default function PurchaseTracker({
  transactionId,
  valueCents,
  currency,
}: {
  transactionId: string;
  valueCents: number;
  currency: string;
}) {
  useEffect(() => {
    const key = `axeon_purchase_${transactionId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Storage blocked: rely on GA's transaction_id dedupe.
    }
    trackEvent('purchase', {
      transaction_id: transactionId,
      value: valueCents / 100,
      currency: currency.toUpperCase(),
    });
  }, [transactionId, valueCents, currency]);

  return null;
}
