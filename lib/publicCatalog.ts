// lib/publicCatalog.ts
// Catalog for the public /pay pages. Amounts come from the Stripe Prices seeded by
// scripts/stripe-seed.mjs (matched by lookup_key) so the page always shows what
// Checkout will actually charge. When Stripe is not configured, or a lookup fails,
// the seeded amounts are used as a fallback so the page still renders.
//
// Page copy (descriptions) is intentionally local rather than pulled from Stripe
// product descriptions, so it can be edited without touching the Stripe catalog.
// Keep amounts in sync with scripts/stripe-seed.mjs, data/pricingData.ts and
// content/brand-guardrails.md.
import { unstable_cache } from 'next/cache';
import {
  CATALOG,
  CATALOG_KEYS,
  PLANS,
  PLAN_KEYS,
  getPlanPrice,
  getPrice,
  type CatalogKey,
  type PlanKey,
} from '@/lib/billing';
import { isStripeConfigured } from '@/lib/stripe';

export interface PublicCatalogItem {
  key: CatalogKey;
  label: string;
  kind: 'tier' | 'addon';
  amountCents: number;
  description: string;
}

export interface PublicPlan {
  key: PlanKey;
  label: string;
  /** Per month. */
  amountCents: number;
}

export interface PublicCatalog {
  tiers: PublicCatalogItem[];
  addOns: PublicCatalogItem[];
  /** Every seeded monthly plan, public or private. Pages decide what to show. */
  plans: Record<PlanKey, PublicPlan>;
  /** True when every amount came from Stripe, false when any fell back to the seeded amount. */
  fromStripe: boolean;
}

const FALLBACK_CENTS: Record<CatalogKey, number> = {
  'core-web-build': 9900,
  axeoncore: 9900,
  axeongrowth: 150000,
  'addon-videography': 150000,
  'addon-extra-page': 45000,
};

const DESCRIPTIONS: Record<CatalogKey, string> = {
  'core-web-build':
    'To start on Essentials: up to 4 custom, mobile-first pages with SEO, AEO and GEO built in, lead alerts, and tracking. Then $149 a month.',
  axeoncore:
    'To start on AxeonCORE: a 5–7 page site plus lead capture, follow-up, tracked phone numbers, AxeonPROOF, and the 90-day guarantee. Then $299 a month.',
  axeongrowth:
    'To start on AxeonGROWTH: covers your on-site video shoot. Then $999 a month for ads management, the AI receptionist, and a new page every month.',
  'addon-videography': 'Half-day shoot at your location: a hero film, 3 vertical cuts, and a photo set.',
  'addon-extra-page': 'One additional custom-designed service page.',
};

function buildItem(key: CatalogKey, amountCents: number): PublicCatalogItem {
  return {
    key,
    label: CATALOG[key].label,
    kind: CATALOG[key].kind,
    amountCents,
    description: DESCRIPTIONS[key],
  };
}

function buildPlan(key: PlanKey, amountCents: number): PublicPlan {
  return { key, label: PLANS[key].label, amountCents };
}

function assemble(items: PublicCatalogItem[], plans: PublicPlan[], fromStripe: boolean): PublicCatalog {
  return {
    tiers: items.filter((i) => i.kind === 'tier'),
    addOns: items.filter((i) => i.kind === 'addon'),
    plans: Object.fromEntries(plans.map((p) => [p.key, p])) as Record<PlanKey, PublicPlan>,
    fromStripe,
  };
}

export function getFallbackCatalog(): PublicCatalog {
  return assemble(
    CATALOG_KEYS.map((key) => buildItem(key, FALLBACK_CENTS[key])),
    PLAN_KEYS.map((key) => buildPlan(key, PLANS[key].amountCents)),
    false
  );
}

async function loadFromStripe(): Promise<PublicCatalog> {
  let fromStripe = true;
  const [items, plans] = await Promise.all([
    Promise.all(
      CATALOG_KEYS.map(async (key) => {
        try {
          const price = await getPrice(key);
          return buildItem(key, price.unit_amount);
        } catch (err) {
          fromStripe = false;
          console.error('[public-catalog]', key, err instanceof Error ? err.message : err);
          return buildItem(key, FALLBACK_CENTS[key]);
        }
      })
    ),
    Promise.all(
      PLAN_KEYS.map(async (key) => {
        try {
          const price = await getPlanPrice(key);
          return buildPlan(key, price.unit_amount);
        } catch (err) {
          fromStripe = false;
          console.error('[public-catalog]', key, err instanceof Error ? err.message : err);
          return buildPlan(key, PLANS[key].amountCents);
        }
      })
    ),
  ]);
  return assemble(items, plans, fromStripe);
}

// Nine price lookups per render is too many for a public page, so the result is
// cached for ten minutes. A price change in Stripe shows up within that window.
const cachedLoad = unstable_cache(loadFromStripe, ['public-catalog-v2'], { revalidate: 600 });

export async function getPublicCatalog(): Promise<PublicCatalog> {
  if (!isStripeConfigured()) return getFallbackCatalog();
  try {
    return await cachedLoad();
  } catch (err) {
    console.error('[public-catalog]', err instanceof Error ? err.message : err);
    return getFallbackCatalog();
  }
}
