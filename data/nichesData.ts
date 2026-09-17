export type NicheCategory = 'Home & Trade Services' | 'Professional Services' | 'Healthcare';

export interface Niche {
  slug: string;
  name: string;
  category: NicheCategory;
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
  industryTerms: string[];
  primaryCTA: string;
  secondaryCTA: string;
}

export const niches: Niche[] = [
  {
    slug: 'dental',
    name: 'Dental Practices',
    category: 'Healthcare',
    schemaType: 'Dentist',
    seoTitle: 'Dental Practice Marketing in Iowa',
    headline: 'Fill Chairtime and Stop Losing Emergency Patients to Voicemail',
    subheadline:
      'A storefront and Custom CRM Pipeline built around same-day emergency triage, insurance verification, and hygiene recall — not a generic contact form.',
    tagline: 'Emergency triage, chairtime filling, and automated hygiene recall.',
    painPoints: [
      'Empty chairtime from same-day cancellations with no rebooking system',
      'Front desk drowning in insurance verification calls during patient hours',
      'New patient inquiries going straight to voicemail after hours',
      'Hygiene recall and rebooking falling through the cracks month over month',
    ],
    intakeWorkflowSteps: [
      'Patient finds the practice site during a dental pain or scheduling moment',
      'Symptom-based intake form flags urgency: routine cleaning vs. emergency',
      'Automated triage routes emergency requests into a same-day booking queue',
      'Custom CRM Pipeline confirms the appointment and sends an insurance pre-verification request',
      'Recall reminders are automatically scheduled for the next hygiene visit',
    ],
    industryTerms: ['chairtime', 'hygiene recall', 'insurance verification', 'same-day emergency slot', 'treatment plan acceptance'],
    primaryCTA: 'Book a Strategy Call for Your Practice',
    secondaryCTA: 'See Dental Package Pricing',
  },
  {
    slug: 'med-spa',
    name: 'Med Spas & Aesthetic Clinics',
    category: 'Healthcare',
    schemaType: 'MedicalBusiness',
    seoTitle: 'Med Spa & Aesthetic Clinic Marketing in Iowa',
    headline: 'Turn Consult Requests Into Recurring Membership Revenue',
    subheadline:
      'A conversion-built storefront that segments treatment interest at intake and routes every consult into a Custom CRM Pipeline built for membership retention.',
    tagline: 'Consultation intake funnels and recurring membership retention.',
    painPoints: [
      'Consult requests abandoned on a generic, one-size-fits-all contact form',
      'Membership signups stall waiting on manual staff follow-up',
      'High-ticket injectable and laser services get price-shopped with no nurture sequence',
      'No-shows on aesthetic consults with no automated confirmation cadence',
    ],
    intakeWorkflowSteps: [
      'Consult request form segments the lead by treatment interest (injectables, laser, body contouring)',
      'Automated nurture sequence sends pre-consult expectations and pricing context',
      'Membership tier selection funnel presents recurring plans before the consult happens',
      'Custom CRM Pipeline tracks consult-to-treatment conversion by service line',
      'Maintenance visits are automatically rebooked on a treatment-specific cadence',
    ],
    industryTerms: ['aesthetic consult', 'membership funnel', 'treatment interest', 'maintenance cadence', 'injectable services'],
    primaryCTA: 'Book a Strategy Call for Your Med Spa',
    secondaryCTA: 'See Med Spa Package Pricing',
  },
  {
    slug: 'hvac',
    name: 'HVAC Companies',
    category: 'Home & Trade Services',
    schemaType: 'HVACBusiness',
    seoTitle: 'HVAC Website Design & Marketing in Iowa',
    headline: 'Emergency Calls Answered and Dispatched — Even at 2 AM',
    subheadline:
      'A storefront wired into a Custom CRM Pipeline that separates emergency dispatch from seasonal tune-up bookings the moment a lead comes in.',
    tagline: '24/7 emergency dispatch routing and seasonal tune-up bookings.',
    painPoints: [
      'After-hours emergency calls going unanswered or to a full voicemail box',
      'Seasonal tune-up campaigns running with no tracking of who actually booked',
      'Dispatch scheduling handled by phone tag between office and techs',
      'Truck rolls happening without qualified job details, wasting a technician visit',
    ],
    intakeWorkflowSteps: [
      'Intake form branches emergency no-heat/no-cool requests from routine maintenance requests',
      'Emergency requests route directly into a dispatch queue with service-area matching',
      'Seasonal tune-up requests enroll into a maintenance plan booking flow',
      'Custom CRM Pipeline confirms the appointment window and texts the technician\'s ETA',
      'Post-service follow-up automatically offers a maintenance plan enrollment',
    ],
    industryTerms: ['emergency dispatch', 'service area routing', 'maintenance plan', 'truck roll', 'seasonal tune-up'],
    primaryCTA: 'Book a Strategy Call for Your HVAC Company',
    secondaryCTA: 'See HVAC Package Pricing',
  },
  {
    slug: 'roofing',
    name: 'Roofing Contractors',
    category: 'Home & Trade Services',
    schemaType: 'HomeAndConstructionBusiness',
    seoTitle: 'Roofing Company Marketing in Iowa',
    headline: 'Turn Storm Leads Into Booked Inspections Before They Go Cold',
    subheadline:
      'A storefront built for storm-damage urgency, with a Custom CRM Pipeline that separates insurance-claim jobs from cash buyers at intake.',
    tagline: 'Storm-damage inspection triage and insurance claim qualification.',
    painPoints: [
      'Storm leads going cold before a bid ever gets sent out',
      'Square footage and scope guessed over the phone instead of qualified upfront',
      'Insurance-claim customers need a completely different intake than out-of-pocket buyers',
      'No system to prioritize genuine storm-damage urgency over routine inquiries',
    ],
    intakeWorkflowSteps: [
      'Storm inspection request captures address and uploaded damage photos',
      'Intake branches insurance-claim jobs from out-of-pocket, cash-pay jobs',
      'Square-footage bid estimator gives a directional range before the site visit',
      'Custom CRM Pipeline schedules the inspection and tracks the bid-to-signed job pipeline',
      'Automated follow-up chases outstanding bids before storm-chaser competitors do',
    ],
    industryTerms: ['storm inspection', 'square footage bid', 'insurance claim intake', 'scope of work', 'tear-off estimate'],
    primaryCTA: 'Book a Strategy Call for Your Roofing Company',
    secondaryCTA: 'See Roofing Package Pricing',
  },
  {
    slug: 'law-firms',
    name: 'Law Firms',
    category: 'Professional Services',
    schemaType: 'LegalService',
    seoTitle: 'Law Firm Website Design & Marketing in Iowa',
    headline: 'Qualify Case Evaluations Before They Reach Your Desk',
    subheadline:
      'A storefront that routes inquiries by practice area and a Custom CRM Pipeline that tracks every case evaluation through to signed retainer.',
    tagline: 'Case evaluation intake, practice routing, and retainer pipelines.',
    painPoints: [
      'Case evaluation requests arrive with no qualifying intake information',
      'Retainer conversion lost to slow, inconsistent follow-up after the first call',
      'Practice-area mismatch wastes attorney time on inquiries you don\'t handle',
      'Generic contact forms feel exposed for what should be a confidential intake',
    ],
    intakeWorkflowSteps: [
      'Practice-area selector routes the inquiry to the correct intake questionnaire',
      'Case evaluation intake form captures the facts an attorney needs before the call',
      'Custom CRM Pipeline schedules the consultation and runs an automated conflict check flag',
      'Case-to-retainer conversion is tracked by practice area',
      'Secure document intake follow-up is triggered once the retainer is signed',
    ],
    industryTerms: ['case evaluation', 'retainer intake', 'practice area routing', 'consultation scheduling', 'conflict check'],
    primaryCTA: 'Book a Strategy Call for Your Firm',
    secondaryCTA: 'See Law Firm Package Pricing',
  },
  {
    slug: 'accounting',
    name: 'Accounting & CPA Firms',
    category: 'Professional Services',
    schemaType: 'AccountingService',
    seoTitle: 'CPA & Accounting Firm Marketing in Iowa',
    headline: 'Separate Tax-Season Noise From High-Value Advisory Leads',
    subheadline:
      'A storefront and Custom CRM Pipeline that triages tax-prep requests from CFO-level advisory inquiries so your best leads never wait in the same queue.',
    tagline: 'Advisory client triage and seasonal document intake automation.',
    painPoints: [
      'Tax-season inquiry floods arrive with no triage between simple and complex returns',
      'CFO and advisory-level leads get buried under basic tax-prep requests',
      'Document collection happens over scattered email threads',
      'Seasonal capacity constraints with no waitlist or overflow system',
    ],
    intakeWorkflowSteps: [
      'Service-type intake separates tax prep, bookkeeping, and CFO advisory requests',
      'Automated document checklist is delivered based on the selected service',
      'Consultation scheduling is tiered by service complexity',
      'Custom CRM Pipeline tracks engagement-to-retainer status through signing',
      'Overflow requests during peak season are queued with automated expectation-setting',
    ],
    industryTerms: ['tax prep intake', 'CFO consultation', 'document checklist', 'engagement letter', 'seasonal capacity'],
    primaryCTA: 'Book a Strategy Call for Your Firm',
    secondaryCTA: 'See Accounting Package Pricing',
  },
  {
    slug: 'home-remodeling',
    name: 'Home Remodeling & General Contractors',
    category: 'Home & Trade Services',
    schemaType: 'GeneralContractor',
    seoTitle: 'Remodeling & Contractor Marketing in Iowa',
    headline: 'Qualify Budget and Scope Before You Ever Drive to the Site',
    subheadline:
      'A storefront that captures project scope and budget range upfront, feeding a Custom CRM Pipeline that tracks every bid through to signed contract.',
    tagline: 'Upfront scope and budget qualification before on-site estimates.',
    painPoints: [
      'Budget-mismatched leads waste estimator time on jobs that were never going to close',
      'Project scope stays unclear until the in-home visit, if it happens at all',
      'Multiple trades and subs need coordinated scheduling that phone calls can\'t manage',
      'Slow quote turnaround loses homeowners to whichever contractor answers first',
    ],
    intakeWorkflowSteps: [
      'Project-type and budget-range intake filters serious jobs from tire-kickers',
      'Scope questionnaire captures rooms, square footage, and materials interest before the site visit',
      'Custom CRM Pipeline schedules the estimate visit and assigns the right trade specialist',
      'Bid-to-signed-contract pipeline is tracked with automated follow-up on outstanding quotes',
      'Trade and sub-contractor scheduling syncs once the contract is signed',
    ],
    industryTerms: ['project scope intake', 'budget qualification', 'site visit scheduling', 'bid-to-contract pipeline', 'trade coordination'],
    primaryCTA: 'Book a Strategy Call for Your Company',
    secondaryCTA: 'See Remodeling Package Pricing',
  },
  {
    slug: 'real-estate',
    name: 'Real Estate Agents & Teams',
    category: 'Professional Services',
    schemaType: 'RealEstateAgent',
    seoTitle: 'Real Estate Agent Website Design in Iowa',
    headline: 'Route Buyers and Sellers Into the Right Pipeline Automatically',
    subheadline:
      'A storefront with instant valuation and showing requests wired into a Custom CRM Pipeline that nurtures every lead from first click to closing.',
    tagline: 'Buyer and seller pipeline routing with instant valuation funnels.',
    painPoints: [
      'Buyer and seller leads treated identically instead of routed into distinct pipelines',
      'Home valuation requests sit with no automated follow-up',
      'Showing requests scattered across texts, calls, and social DMs',
      'Leads going cold in the gap between first contact and first showing',
    ],
    intakeWorkflowSteps: [
      'Intake branches buyer inquiries from seller/valuation inquiries at the first click',
      'Instant home valuation request triggers an automated estimate and follow-up sequence',
      'Showing requests are scheduled directly into the agent\'s calendar',
      'Custom CRM Pipeline nurtures every lead with market updates until they\'re ready to move',
      'Closed transactions trigger an automated referral and review request',
    ],
    industryTerms: ['buyer/seller pipeline', 'home valuation funnel', 'showing scheduling', 'lead-to-close nurture', 'listing inquiry'],
    primaryCTA: 'Book a Strategy Call for Your Team',
    secondaryCTA: 'See Real Estate Package Pricing',
  },
  {
    slug: 'landscaping',
    name: 'Landscaping Companies',
    category: 'Home & Trade Services',
    schemaType: 'HomeAndConstructionBusiness',
    seoTitle: 'Landscaping Company Marketing in Iowa',
    headline: 'Book More Hardscape Jobs and Stop Losing Mow Clients to Voicemail',
    subheadline:
      'A storefront and Custom CRM Pipeline built to separate recurring maintenance requests from one-time hardscape and design bids — not a generic contact form.',
    tagline: 'Hardscape quote qualification and recurring maintenance renewals.',
    painPoints: [
      'Recurring mow-and-maintenance requests and one-time hardscape bids pile into the same generic inbox',
      'Estimate requests with no photos or property size waste an on-site visit before you know the scope',
      'Spring rush overwhelms phone lines with no overflow system',
      'Recurring maintenance contracts fall through the cracks without automatic seasonal rebooking',
    ],
    intakeWorkflowSteps: [
      'Intake branches recurring maintenance requests from one-time hardscape and design bids',
      'Photo and property-size based estimate intake captures scope before a truck ever rolls out',
      'Custom CRM Pipeline schedules crews by service type and season',
      'Recurring maintenance contracts auto-renew and rebook each season',
      'Spring and fall surge requests route into a prioritized queue',
    ],
    industryTerms: ['hardscape estimate', 'recurring maintenance contract', 'seasonal crew scheduling', 'property walkthrough', 'mow route'],
    primaryCTA: 'Book a Strategy Call for Your Company',
    secondaryCTA: 'See Landscaping Package Pricing',
  },
  {
    slug: 'auto-detailing',
    name: 'Auto Detailing Shops',
    category: 'Home & Trade Services',
    schemaType: 'AutoRepair',
    seoTitle: 'Auto Detailing Shop Marketing in Iowa',
    headline: 'Fill Every Bay Slot With the Right Package Selected Upfront',
    subheadline:
      'A storefront with clear package selection and bay scheduling wired into a Custom CRM Pipeline that keeps repeat customers coming back.',
    tagline: 'Package tier selection, bay scheduling, and repeat-client nurture.',
    painPoints: [
      'Package selection confusion between basic wash, full detail, and ceramic coating',
      'Bay scheduling conflicts and accidental double-bookings',
      'Mobile detailing vs. in-shop requests handled inconsistently',
      'No system for repeat-customer maintenance wash reminders',
    ],
    intakeWorkflowSteps: [
      'Package/tier selector clarifies scope (wash, full detail, ceramic coating) before booking',
      'Mobile vs. in-shop request branches into the correct scheduling flow',
      'Custom CRM Pipeline confirms the bay slot or mobile dispatch window',
      'Automated confirmation and day-of reminder reduces no-shows',
      'Repeat customers are automatically re-engaged on a maintenance wash cadence',
    ],
    industryTerms: ['package tier selection', 'bay scheduling', 'mobile detailing dispatch', 'ceramic coating consult', 'maintenance wash cadence'],
    primaryCTA: 'Book a Strategy Call for Your Shop',
    secondaryCTA: 'See Auto Detailing Package Pricing',
  },
];
