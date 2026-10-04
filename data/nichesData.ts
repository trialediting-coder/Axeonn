export type NicheCategory = 'Home & Trade Services' | 'Professional Services' | 'Healthcare';

export interface Niche {
  slug: string;
  name: string;
  category: NicheCategory;
  /** Plural word for this industry's customers: "Ready for more {customerNoun}?" */
  customerNoun: string;
  /** Singular lead phrase for the workflow title: "How a {leadNoun} becomes a booking". */
  leadNoun: string;
  /** One outcome line for the /solutions hub card. */
  cardLine: string;
  schemaType: string;
  // Short, SEO-tuned <title> tag text (kept separate from `headline`, the
  // on-page H1) — includes a local modifier and stays under ~45 chars so the
  // full "<seoTitle> | Axeon Studio" title tag doesn't get truncated in search results.
  seoTitle: string;
  headline: string;
  subheadline: string;
  tagline: string;
  painPoints: string[];
  intakeWorkflowSteps: string[];
  primaryCTA: string;
  secondaryCTA: string;
}

export const niches: Niche[] = [
  {
    slug: 'dental',
    name: 'Dental Practices',
    category: 'Healthcare',
    customerNoun: 'patients',
    leadNoun: 'new patient',
    cardLine: 'More new-patient calls and fuller hygiene chairs.',
    schemaType: 'Dentist',
    seoTitle: 'Dental Practice Marketing in Iowa',
    headline: 'Fill Chairtime and Stop Losing Emergency Patients to Voicemail',
    subheadline:
      'More new-patient calls, emergencies booked same-day instead of lost to voicemail, and hygiene chairs kept full.',
    tagline: 'More new-patient calls and fuller hygiene chairs.',
    painPoints: [
      'Empty chairtime from same-day cancellations with no rebooking system',
      'Front desk drowning in insurance verification calls during patient hours',
      'New patient inquiries going straight to voicemail after hours',
      'Hygiene recall and rebooking falling through the cracks month over month',
    ],
    intakeWorkflowSteps: [
      'A patient searching for a dentist nearby finds your practice first',
      'They book online, ask the AI chat, or tap to call, any time of day',
      'Intake flags emergencies so you can fit them in same-day',
      "Missed calls get a text back right away, so after-hours patients aren't lost to voicemail",
      'Automatic text and email reminders bring patients back for their next cleaning',
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Dental Package Pricing',
  },
  {
    slug: 'med-spa',
    name: 'Med Spas & Aesthetic Clinics',
    category: 'Healthcare',
    customerNoun: 'clients',
    leadNoun: 'consult request',
    cardLine: 'More booked consults and clients who come back.',
    schemaType: 'MedicalBusiness',
    seoTitle: 'Med Spa & Aesthetic Clinic Marketing in Iowa',
    headline: 'Turn Consult Requests Into Recurring Membership Revenue',
    subheadline:
      'More booked consults, fewer no-shows, and clients who come back for their next treatment.',
    tagline: 'More booked consultations and returning clients.',
    painPoints: [
      'Consult requests abandoned on a generic, one-size-fits-all contact form',
      'Membership signups stall waiting on manual staff follow-up',
      'High-ticket injectable and laser services get price-shopped with no nurture sequence',
      'No-shows on aesthetic consults with no automated confirmation cadence',
    ],
    intakeWorkflowSteps: [
      'Someone researching a treatment finds your med spa on Google or in an AI answer',
      'Intake asks which treatment they want: injectables, laser, or body contouring',
      'AI chat answers common questions and books the consult on the spot',
      'Automatic text and email reminders go out before the consult to cut no-shows',
      'Your CRM pipeline shows every consult, from first request to booked treatment',
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Med Spa Package Pricing',
  },
  {
    slug: 'hvac',
    name: 'HVAC Companies',
    category: 'Home & Trade Services',
    customerNoun: 'customers',
    leadNoun: 'service call',
    cardLine: 'Get the emergency call before the next company does.',
    schemaType: 'HVACBusiness',
    seoTitle: 'HVAC Website Design & Marketing in Iowa',
    headline: 'Emergency Calls Answered and Dispatched — Even at 2 AM',
    subheadline:
      'Get the emergency call before the next company does, book more tune-ups, and bring customers back every season.',
    tagline: 'Get the emergency call before the next company does.',
    painPoints: [
      'After-hours emergency calls going unanswered or to a full voicemail box',
      'Seasonal tune-up campaigns running with no tracking of who actually booked',
      'Dispatch scheduling handled by phone tag between office and techs',
      'Truck rolls happening without qualified job details, wasting a technician visit',
    ],
    intakeWorkflowSteps: [
      'A homeowner with no heat or no AC searches and finds you first',
      'They tap to call, and missed calls get a text back right away, even at 2 AM',
      'Intake separates emergencies from routine tune-ups, so urgent jobs get handled first',
      'AI chat books tune-ups and maintenance visits online',
      'Automatic follow-up after the job invites them back for their next seasonal tune-up',
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See HVAC Package Pricing',
  },
  {
    slug: 'roofing',
    name: 'Roofing Contractors',
    category: 'Home & Trade Services',
    customerNoun: 'homeowners',
    leadNoun: 'storm lead',
    cardLine: 'Book storm inspections before the lead goes cold.',
    schemaType: 'HomeAndConstructionBusiness',
    seoTitle: 'Roofing Company Marketing in Iowa',
    headline: 'Turn Storm Leads Into Booked Inspections Before They Go Cold',
    subheadline:
      'Show up first after the storm, answer every inspection request fast, and follow up until the job is signed.',
    tagline: 'Book storm inspections before the lead goes cold.',
    painPoints: [
      'Storm leads going cold before a bid ever gets sent out',
      'Square footage and scope guessed over the phone instead of qualified upfront',
      'Insurance-claim customers need a completely different intake than out-of-pocket buyers',
      'No system to prioritize genuine storm-damage urgency over routine inquiries',
    ],
    intakeWorkflowSteps: [
      'After a storm, homeowners searching for roof repair find you first',
      "The inspection request captures the address, damage photos, and whether it's an insurance claim",
      'Speed-to-lead call connect rings your phone the moment a request comes in',
      'Your CRM pipeline tracks every inspection and bid until the job is signed',
      "Automatic follow-up checks in on open bids so they don't go cold",
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Roofing Package Pricing',
  },
  {
    slug: 'law-firms',
    name: 'Law Firms',
    category: 'Professional Services',
    customerNoun: 'clients',
    leadNoun: 'case inquiry',
    cardLine: 'More of the right cases, signed faster.',
    schemaType: 'LegalService',
    seoTitle: 'Law Firm Website Design & Marketing in Iowa',
    headline: 'Qualify Case Evaluations Before They Reach Your Desk',
    subheadline:
      'More of the right cases, answered fast and followed up until the retainer is signed.',
    tagline: 'More case inquiries answered and booked.',
    painPoints: [
      'Case evaluation requests arrive with no qualifying intake information',
      'Retainer conversion lost to slow, inconsistent follow-up after the first call',
      'Practice-area mismatch wastes attorney time on inquiries you don\'t handle',
      'Generic contact forms feel exposed for what should be a confidential intake',
    ],
    intakeWorkflowSteps: [
      'Someone with a legal problem searches and finds your firm',
      'Practice-area intake asks the questions an attorney needs before the call',
      'AI chat answers first questions and schedules the consultation',
      'Your CRM pipeline tracks every case evaluation through to a signed retainer',
      "Automatic follow-up stays in touch with people who haven't signed yet",
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Law Firm Package Pricing',
  },
  {
    slug: 'accounting',
    name: 'Accounting & CPA Firms',
    category: 'Professional Services',
    customerNoun: 'clients',
    leadNoun: 'new client',
    cardLine: 'More advisory clients, less tax-season noise.',
    schemaType: 'AccountingService',
    seoTitle: 'CPA & Accounting Firm Marketing in Iowa',
    headline: 'Separate Tax-Season Noise From High-Value Advisory Leads',
    subheadline:
      'More high-value advisory clients, without them getting buried under tax-season noise.',
    tagline: 'More qualified clients, before tax season hits.',
    painPoints: [
      'Tax-season inquiry floods arrive with no triage between simple and complex returns',
      'CFO and advisory-level leads get buried under basic tax-prep requests',
      'Document collection happens over scattered email threads',
      'Seasonal capacity constraints with no waitlist or overflow system',
    ],
    intakeWorkflowSteps: [
      'A business owner looking for a CPA finds your firm on Google or in an AI answer',
      'Intake separates tax prep, bookkeeping, and advisory requests up front',
      "Advisory leads book a consultation directly, so they don't wait behind tax-season questions",
      'Automatic emails tell each new client which documents to have ready',
      'Your CRM pipeline tracks every inquiry through to a signed engagement',
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Accounting Package Pricing',
  },
  {
    slug: 'home-remodeling',
    name: 'Home Remodeling & General Contractors',
    category: 'Home & Trade Services',
    customerNoun: 'homeowners',
    leadNoun: 'project inquiry',
    cardLine: 'More qualified projects, scoped before you drive out.',
    schemaType: 'GeneralContractor',
    seoTitle: 'Remodeling & Contractor Marketing in Iowa',
    headline: 'Qualify Budget and Scope Before You Ever Drive to the Site',
    subheadline:
      'More qualified project leads, with scope and budget known before you ever drive out.',
    tagline: 'More serious homeowners booking estimates.',
    painPoints: [
      'Budget-mismatched leads waste estimator time on jobs that were never going to close',
      'Project scope stays unclear until the in-home visit, if it happens at all',
      'Multiple trades and subs need coordinated scheduling that phone calls can\'t manage',
      'Slow quote turnaround loses homeowners to whichever contractor answers first',
    ],
    intakeWorkflowSteps: [
      'A homeowner planning a project finds you on Google',
      'Intake captures project type, scope, and budget range before you drive out',
      'They book the estimate visit online, or tap to call',
      'Your CRM pipeline tracks every bid through to a signed contract',
      'Automatic follow-up checks in on open quotes before another contractor does',
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Remodeling Package Pricing',
  },
  {
    slug: 'real-estate',
    name: 'Real Estate Agents & Teams',
    category: 'Professional Services',
    customerNoun: 'clients',
    leadNoun: 'new lead',
    cardLine: 'Get found by more buyers and sellers in your area.',
    schemaType: 'RealEstateAgent',
    seoTitle: 'Real Estate Agent Website Design in Iowa',
    headline: 'Route Buyers and Sellers Into the Right Pipeline Automatically',
    subheadline:
      "Get found by more buyers and sellers, answer every one fast, and stay in touch until they're ready to move.",
    tagline: 'More buyer and seller leads, followed up fast.',
    painPoints: [
      'Buyer and seller leads treated identically instead of routed into distinct pipelines',
      'Home valuation requests sit with no automated follow-up',
      'Showing requests scattered across texts, calls, and social DMs',
      'Leads going cold in the gap between first contact and first showing',
    ],
    intakeWorkflowSteps: [
      'Buyers and sellers searching your area find you on Google and in AI answers',
      'Intake sorts buyers from sellers at the first click',
      'Showing and valuation requests book straight into your calendar',
      "Automatic text and email follow-up keeps every lead warm until they're ready to move",
      'Your CRM pipeline shows where every lead stands, from first contact to closing',
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Real Estate Package Pricing',
  },
  {
    slug: 'landscaping',
    name: 'Landscaping Companies',
    category: 'Home & Trade Services',
    customerNoun: 'customers',
    leadNoun: 'quote request',
    cardLine: 'More hardscape jobs and maintenance customers who stay.',
    schemaType: 'HomeAndConstructionBusiness',
    seoTitle: 'Landscaping Company Marketing in Iowa',
    headline: 'Book More Hardscape Jobs and Stop Losing Mow Clients to Voicemail',
    subheadline:
      'Book more hardscape jobs, answer every spring-rush call, and keep maintenance customers coming back each season.',
    tagline: 'More quote requests and repeat maintenance customers.',
    painPoints: [
      'Recurring mow-and-maintenance requests and one-time hardscape bids pile into the same generic inbox',
      'Estimate requests with no photos or property size waste an on-site visit before you know the scope',
      'Spring rush overwhelms phone lines with no overflow system',
      'Recurring maintenance contracts fall through the cracks without automatic seasonal rebooking',
    ],
    intakeWorkflowSteps: [
      'A homeowner searching for landscaping finds you first',
      'Intake separates weekly maintenance from one-time hardscape and design bids',
      'Estimate requests include photos and property size, so you know the scope before the visit',
      'Missed calls get a text back during the spring rush',
      'Automatic follow-up reaches maintenance customers before each season',
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Landscaping Package Pricing',
  },
  {
    slug: 'auto-detailing',
    name: 'Auto Detailing Shops',
    category: 'Home & Trade Services',
    customerNoun: 'customers',
    leadNoun: 'detail request',
    cardLine: 'More booked details, with the right package picked upfront.',
    schemaType: 'AutoRepair',
    seoTitle: 'Auto Detailing Shop Marketing in Iowa',
    headline: 'Fill Every Bay Slot With the Right Package Selected Upfront',
    subheadline:
      'Get found for detailing near you, let customers pick their package online, and bring repeat customers back.',
    tagline: 'More booked details and repeat customers.',
    painPoints: [
      'Package selection confusion between basic wash, full detail, and ceramic coating',
      'Bay scheduling conflicts and accidental double-bookings',
      'Mobile detailing vs. in-shop requests handled inconsistently',
      'No system for repeat-customer maintenance wash reminders',
    ],
    intakeWorkflowSteps: [
      'Someone searching for detailing nearby finds your shop',
      'They pick their package online: wash, full detail, or ceramic coating',
      'They book a time, mobile or in-shop, or tap to call',
      'Automatic text reminders before the appointment cut no-shows',
      "Repeat customers get a reminder when it's time for their next detail",
    ],
    primaryCTA: 'Book a Free Strategy Call',
    secondaryCTA: 'See Auto Detailing Package Pricing',
  },
];
