// scripts/stripe-seed.mjs
// Idempotent Stripe catalog seed. Run once per Stripe environment (sandbox first,
// then live before go-live):
//
//   npm run stripe:seed        (reads STRIPE_SECRET_KEY from .env.local)
//
// Matches lib/billing.ts by Price lookup_key and Product metadata.axeon_key.
// Changing an amount here creates a new Price, moves the lookup_key to it, and
// archives the old one, so historical invoices keep their original price.
// Keys listed in ARCHIVE get their price and product deactivated (never deleted),
// so past invoices and subscriptions are untouched.
//
// Pricing as of 2026-10-05 (data/pricingData.ts): $99 to start ($1,500 on
// AxeonGROWTH, covers the video shoot), then $149 / $299 / $999 a month. The
// $49 Website Hosting & Care plan stays as-is for existing clients (A-1).
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
// One-time items: the "to start" fee per plan, and the one-time add-ons.
const CATALOG = [
  {
    key: 'core-web-build',
    name: 'Essentials · to start',
    description: 'One-time start fee for the Essentials plan: up to 4 custom, mobile-first pages, SEO/AEO/GEO, lead alerts, tracking.',
    amount: 9900,
    taxCode: TAX.websiteDesign,
  },
  {
    key: 'axeoncore',
    name: 'AxeonCORE · to start',
    description:
      'One-time start fee for AxeonCORE: 5-7 page site, lead capture and follow-up, AI chat and scheduling, tracked numbers, AxeonPROOF, 90-day guarantee.',
    amount: 9900,
    taxCode: TAX.websiteDesign,
  },
  {
    key: 'axeongrowth',
    name: 'AxeonGROWTH · to start',
    description: 'One-time start fee for AxeonGROWTH. Covers the on-site video shoot (hero film, 3 vertical cuts, photo set).',
    amount: 150000,
    taxCode: TAX.generalServices,
  },
  {
    key: 'addon-videography',
    name: 'Custom On-Site Videography',
    description: 'Half-day shoot at your location: hero film, 3 vertical cuts, photo set. Included in AxeonGROWTH.',
    amount: 150000,
    taxCode: TAX.generalServices,
  },
  {
    key: 'addon-extra-page',
    name: 'Extra Service Page',
    description: 'One additional custom-designed service page, built to rank for another service.',
    amount: 45000,
    taxCode: TAX.websiteDesign,
  },
];

// Retired on 2026-10-05. Deactivated, never deleted.
const ARCHIVE = ['addon-directory-integration', 'addon-landing-page-variant'];

const CARE_PRODUCT = {
  key: 'hosting-care',
  name: 'Website Hosting & Care',
  description: 'Ongoing hosting and maintenance for a site built by Axeon Studio.',
  taxCode: TAX.websiteHosting,
};

// Standard hosting/maintenance plan for existing clients. lib/billing.ts uses this
// Price whenever the admin leaves the amount at $49; other amounts are priced ad hoc.
const CARE_PRICE = {
  key: 'hosting-care-monthly',
  nickname: 'Hosting & Maintenance - $49/month',
  amount: 4900,
  recurring: { interval: 'month' },
};

// Monthly plans and recurring add-ons. Each is its own product so Dashboard
// reporting separates them from the $49 basics plan.
const PLAN_PRODUCTS = [
  {
    key: 'core-web-build-plan',
    name: 'Essentials Monthly Plan',
    description: 'Essentials: custom site, hosting, security, 2 edits a month, monthly calls & leads report. 3-month minimum.',
    taxCode: TAX.websiteHosting,
    price: {
      key: 'core-web-build-monthly',
      nickname: 'Essentials - $149/month',
      amount: 14900,
      recurring: { interval: 'month' },
    },
  },
  {
    key: 'axeoncore-plan',
    name: 'AxeonCORE Monthly Plan',
    description: 'AxeonCORE: site plus lead capture, follow-up, tracked numbers, AxeonPROOF, 5 edits a month, 90-day guarantee. 3-month minimum.',
    taxCode: TAX.websiteHosting,
    price: {
      key: 'axeoncore-monthly',
      nickname: 'AxeonCORE - $299/month',
      amount: 29900,
      recurring: { interval: 'month' },
    },
  },
  {
    key: 'axeongrowth-plan',
    name: 'AxeonGROWTH Monthly Plan',
    description:
      'AxeonGROWTH: everything in AxeonCORE plus Google, Meta and Local Services Ads management, AI phone receptionist, a new service page every month, monthly strategy call. Ad spend billed separately. 3-month minimum.',
    taxCode: TAX.websiteHosting,
    price: {
      key: 'axeongrowth-monthly',
      nickname: 'AxeonGROWTH - $999/month',
      amount: 99900,
      recurring: { interval: 'month' },
    },
  },
  {
    key: 'addon-ads-plan',
    name: 'Google & Meta Ads Management (AxeonCORE add-on)',
    description: 'Ads run for you on the services you want more of, tracked to the booked job. Ad spend billed separately by Google and Meta.',
    taxCode: TAX.generalServices,
    price: {
      key: 'addon-ads-monthly',
      nickname: 'Ads Management - $399/month',
      amount: 39900,
      recurring: { interval: 'month' },
    },
  },
  {
    key: 'addon-ai-receptionist-plan',
    name: 'AI Phone Receptionist (add-on)',
    description: 'Picks up every call 24/7, answers questions, and books the job.',
    taxCode: TAX.generalServices,
    price: {
      key: 'addon-ai-receptionist-monthly',
      nickname: 'AI Phone Receptionist - $199/month',
      amount: 19900,
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
  } else {
    const changes = {};
    if (!product.active) changes.active = true;
    if (product.name !== item.name) changes.name = item.name;
    if ((product.description ?? '') !== item.description) changes.description = item.description;
    if (product.tax_code !== item.taxCode) changes.tax_code = item.taxCode;
    if (Object.keys(changes).length) {
      product = await stripe.products.update(product.id, changes);
      console.log(`  updated product ${product.id} (${item.name}): ${Object.keys(changes).join(', ')}`);
    }
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
    if (item.nickname && existing.nickname !== item.nickname) {
      await stripe.prices.update(existing.id, { nickname: item.nickname });
    }
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

async function archive(axeonKey) {
  const prices = await stripe.prices.list({ lookup_keys: [axeonKey], limit: 1 });
  for (const p of prices.data) {
    if (p.active) {
      await stripe.prices.update(p.id, { active: false });
      console.log(`  archived price ${p.id} (${axeonKey})`);
    }
  }
  const product = await findProduct(axeonKey);
  if (product && product.active) {
    await stripe.products.update(product.id, { active: false });
    console.log(`  archived product ${product.id} (${axeonKey})`);
  }
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
  for (const k of ARCHIVE) {
    console.log(`- archive ${k}`);
    await archive(k);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
