'use client';

// Tags a signed-in AxeonPROOF session in PostHog with the client business and
// plan, so we can see which clients use the dashboard and which tabs they open.
// No email or customer data: the id is the account number. A no-op wherever
// instrumentation-client.ts did not start PostHog (admin previews, GPC).
import { useEffect } from 'react';
import posthog from 'posthog-js';

export function ProofAnalyticsIdentify({ accountId, businessName, plan }: { accountId: number; businessName: string; plan: string }) {
  useEffect(() => {
    if (!posthog.__loaded) return;
    posthog.identify(`proof-account-${accountId}`, { business_name: businessName, plan, axeon_client: true });
  }, [accountId, businessName, plan]);
  return null;
}
