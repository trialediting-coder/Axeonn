// scripts/stripe-seed.mjs
// Idempotent Stripe catalog seed. Run once per Stripe environment (sandbox first,
// then live before go-live):
//
//   npm run stripe:seed        (reads STRIPE_SECRET_KEY from .env.local)
//
// Matches lib/billing.ts by Price lookup_key and Product metadata.axeon_key.
// Changing an amount here creates a new Price, moves the lookup_key to it, and
// archives the old one, so historical invoices keep their original price.
//
// Tax codes are exact Stripe product tax codes pulled from the Tax Codes API on
// 2026-09-23. Stripe has no code for video production, so the videography add-on
// uses "General - Services"; confirm these with a tax advisor before collecting.
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('STRIPE_SECRET_KEY is not set. Put a restricted key (rk_...) in .env.local.');
  process.exit(1);
}
const stripe = new Stripe(key);

const TAX = {
  websiteDesign: 'txcd_10701200', // Website Design
  websiteHosting: 'txcd_10701100', // Website Hosting
  generalServices: 'txcd_20030000', // General - Services
};

// Amounts are integer cents and must match data/pricingData.ts and
// content/brand-guardrails.md.
const CATALOG = [
  {
    key: 'core-web-build',
    name: 'Core Web Build',
    description:
      'Up to 4 custom, mobile-first pages, SEO/AEO/GEO, instant lead alerts, conversion tracking. One-time build.',
    amount: 280000,
    taxCode: TAX.websiteDesign,
  },
  {
    key: 'axeoncore',
    name: 'AxeonCORE',
    description:
      'Everything in Core Web Build plus on-site videography, a 5-7 page conversion architecture, custom CRM pipeline, AI chat and scheduling, intake and follow-up automations. One-time build.',
    amount: 580000,
    taxCode: TAX.websiteDesign,
  },
  {
    key: 'addon-videography',
    name: 'Custom On-Site Videography',
    description: 'Half-day shoot at your location: hero film, 3 vertical cuts, photo set.',
    amount: 150000,
    taxCode: TAX.generalServices,
  },
  {
    key: 'addon-extra-page',
    name: 'Additional Custom Page Build',
    description: 'One additional custom-designed page.',
    amount: 45000,
    taxCode: TAX.websiteDesign,
  },
  {
    key: 'addon-directory-integration',
    name: 'Advanced Database/Directory Integration',
    description: 'Database-backed directory or listing integration.',
    amount: 85000,
    taxCode: TAX.websiteDesign,
  },
  {
    key: 'addon-landing-page-variant',
    name: 'Secondary Niche Landing Page Variant',
    description: 'A second landing page variant targeting another niche or service area.',
    amount: 50000,
    taxCode: TAX.websiteDesign,
  },
];

const CARE_PRODUCT = {
  key: 'hosting-care',
  name: 'Website Hosting & Care',
  description: 'Ongoing hosting and maintenance for a site built by Axeon Studio.',
  taxCode: TAX.websiteHosting,
};

// Standard hosting/maintenance plan. lib/billing.ts uses this Price whenever the
// admin leaves the amount at $49; other amounts are priced ad hoc per client.
const CARE_PRICE = {
  key: 'hosting-care-monthly',
  nickname: 'Hosting & Maintenance - $49/month',
  amount: 4900,
  recurring: { interval: 'month' },
};

// Per-tier monthly plans (public on /pay as "then $284/mo after launch"). Each is
// its own product so Dashboard reporting separates them from the $49 basics plan.
const PLAN_PRODUCTS = [
  {
    key: 'core-web-build-plan',
    name: 'Core Web Build Monthly Plan',
    description: 'Ongoing hosting, care, and support for a Core Web Build site. Starts after launch.',
    taxCode: TAX.websiteHosting,
    price: {
      key: 'core-web-build-monthly',
      nickname: 'Core Web Build Monthly Plan - $284/month',
      amount: 28400,
      recurring: { interval: 'month' },
    },
  },
  {
    key: 'axeoncore-plan',
    name: 'AxeonCORE Monthly Plan',
    description: 'Ongoing hosting, care, and support for an AxeonCORE site. Starts after launch.',
    taxCode: TAX.websiteHosting,
    price: {
      key: 'axeoncore-monthly',
      nickname: 'AxeonCORE Monthly Plan - $574/month',
      amount: 57400,
      recurring: { interval: 'month' },
    },
  },
];

async function findProduct(axeonKey) {
  const res = await stripe.products.search({ query: `metadata['axeon_key']:'${axeonKey}'`, limit: 1 });
  return res.data[0] ?? null;
}

async function ensureProduct(item) {
  let product = await findProduct(item.key);
  if (!product) {
    product = await stripe.products.create({
      name: item.name,
      description: item.description,
      tax_code: item.taxCode,
      metadata: { axeon_key: item.key },
    });
    console.log(`  created product ${product.id} (${item.name})`);
  } else if (!product.active) {
    product = await stripe.products.update(product.id, { active: true });
    console.log(`  re-activated product ${product.id} (${item.name})`);
  }
  return product;
}

async function ensurePrice(item, product) {
  const res = await stripe.prices.list({ lookup_keys: [item.key], limit: 1 });
  const existing = res.data[0];
  const existingProductId = existing
    ? typeof existing.product === 'string'
      ? existing.product
      : existing.product.id
    : null;
  if (existing && existing.active && existing.unit_amount === item.amount && existingProductId === product.id) {
    return existing;
  }
  if (existing) {
    console.log(`  price for ${item.key} changed (${existing.unit_amount} -> ${item.amount}); rotating`);
  }
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: item.amount,
    lookup_key: item.key,
    transfer_lookup_key: true,
    tax_behavior: 'exclusive',
    metadata: { axeon_key: item.key },
    ...(item.recurring ? { recurring: item.recurring } : {}),
    ...(item.nickname ? { nickname: item.nickname } : {}),
  });
  if (existing && existing.id !== price.id && existing.active) {
    await stripe.prices.update(existing.id, { active: false });
  }
  console.log(`  created price ${price.id} for ${item.key} at ${item.amount}`);
  return price;
}

async function main() {
  console.log('Seeding Stripe catalog...');
  for (const item of CATALOG) {
    console.log(`- ${item.key}`);
    const product = await ensureProduct(item);
    await ensurePrice(item, product);
  }
  console.log(`- ${CARE_PRODUCT.key}`);
  const careProduct = await ensureProduct(CARE_PRODUCT);
  await ensurePrice(CARE_PRICE, careProduct);
  for (const plan of PLAN_PRODUCTS) {
    console.log(`- ${plan.key}`);
    const product = await ensureProduct(plan);
    await ensurePrice(plan.price, product);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
