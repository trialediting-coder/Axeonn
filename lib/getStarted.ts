// lib/getStarted.ts
// Pure logic for the /get-started flow: package recommendation, the lead
// payload the lead route saves to Airtable, and the Stripe Payment Link URL. No I/O and
// no randomness, so the same answers always give the same result (see
// lib/getStarted.test.ts).
import {
  CUSTOM_BUDGET,
  CUSTOM_PACKAGE,
  PACKAGES,
  type Budget,
  type BusinessType,
  type Goal,
  type HasWebsite,
  type Package,
  type Service,
  type Timeline,
} from '../data/getStartedPackages';

export interface GetStartedAnswers {
  services: Service[];
  businessType: BusinessType | '';
  hasWebsite: HasWebsite | '';
  goal: Goal | '';
  budget: Budget | '';
  timeline: Timeline | '';
}

export interface ContactInfo {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
}

/** Exact shape POSTed to /api/get-started/lead. lib/airtableSync.ts maps these keys to Airtable columns. */
export interface LeadPayload {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  services: Service[];
  packageId: string;
  packageName: string;
  packagePrice: number;
  answers: {
    businessType: string;
    hasWebsite: string;
    goal: string;
    budget: string;
    timeline: string;
  };
  company_fax: string;
}

// AxeonGROWTH covers every service, so only an empty pick or a $3k+ budget is custom.
const MAX_SERVICES_FOR_PACKAGE = 6;

/**
 * Picks the package for a set of answers.
 *
 * Rules, in order:
 *  1. No services, more than MAX_SERVICES_FOR_PACKAGE, or a $3k+ budget → custom.
 *  2. Budget is a hard filter: a package whose budgets don't include the
 *     visitor's is never considered.
 *  3. Every selected service must be covered by the package, and the optional
 *     hasWebsite filter must pass.
 *  4. Among survivors, the tightest fit wins (fewest services the visitor
 *     didn't ask for), then config order.
 *  5. Nothing left → custom.
 */
/** Pure matching on the package criteria. Visitors should get recommendPackage(), which hides placeholders. */
export function matchPackage(answers: GetStartedAnswers, packages: Package[] = PACKAGES): Package {
  const selected = [...new Set(answers.services)];
  if (selected.length === 0 || selected.length > MAX_SERVICES_FOR_PACKAGE) return CUSTOM_PACKAGE;
  if (!answers.budget || answers.budget === CUSTOM_BUDGET) return CUSTOM_PACKAGE;

  let best: { pkg: Package; extra: number } | null = null;
  for (const pkg of packages) {
    const match = pkg.match;
    if (!match) continue;
    if (!match.budgets.includes(answers.budget)) continue;
    if (match.hasWebsite && (!answers.hasWebsite || !match.hasWebsite.includes(answers.hasWebsite))) continue;
    if (!selected.every((s) => match.services.includes(s))) continue;

    const extra = match.services.length - selected.length;
    if (!best || extra < best.extra) best = { pkg, extra };
  }
  return best?.pkg ?? CUSTOM_PACKAGE;
}

/** A package whose copy is still a TODO placeholder must never be shown to a visitor. */
export const isPlaceholderPackage = (pkg: Package) => pkg.name.trim().startsWith('TODO');

export function recommendPackage(answers: GetStartedAnswers, packages: Package[] = PACKAGES): Package {
  const pkg = matchPackage(answers, packages);
  return isPlaceholderPackage(pkg) ? CUSTOM_PACKAGE : pkg;
}

export const isCustomPackage = (pkg: Package) => pkg.id === CUSTOM_PACKAGE.id;

/** A package can take payment only once its real Stripe Payment Link is filled in. */
export function isPaymentLinkReady(pkg: Package): boolean {
  return typeof pkg.stripePaymentLink === 'string' && pkg.stripePaymentLink.startsWith('https://buy.stripe.com/');
}

/**
 * Payment Link + prefilled email. The backend matches the Stripe payment to
 * the lead by email, so this must receive the exact string sent in the payload.
 */
export function buildPaymentUrl(paymentLink: string, email: string): string {
  const separator = paymentLink.includes('?') ? '&' : '?';
  return `${paymentLink}${separator}prefilled_email=${encodeURIComponent(email)}`;
}

/** Trims every field once, so the payload email and the Stripe prefill are identical. */
export function normalizeContact(contact: ContactInfo): ContactInfo {
  return {
    businessName: contact.businessName.trim(),
    contactName: contact.contactName.trim(),
    email: contact.email.trim(),
    phone: contact.phone.trim(),
    website: contact.website.trim(),
  };
}

export function buildLeadPayload(
  answers: GetStartedAnswers,
  contact: ContactInfo,
  pkg: Package,
  honeypot: string,
): LeadPayload {
  const c = normalizeContact(contact);
  return {
    businessName: c.businessName,
    contactName: c.contactName,
    email: c.email,
    phone: c.phone,
    website: c.website,
    // Custom has no fixed scope, so pass through what the visitor picked.
    services: isCustomPackage(pkg) ? [...new Set(answers.services)] : [...pkg.services],
    packageId: pkg.id,
    packageName: pkg.name,
    packagePrice: pkg.price,
    answers: {
      businessType: answers.businessType,
      hasWebsite: answers.hasWebsite,
      goal: answers.goal,
      budget: answers.budget,
      timeline: answers.timeline,
    },
    company_fax: honeypot,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (email: string) => EMAIL_RE.test(email.trim());
