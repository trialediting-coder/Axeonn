export type NicheCategory = 'Home & Trade Services' | 'Professional Services' | 'Healthcare';

export interface NicheLeak {
  /** Mono time stamp shown on the featured leak, e.g. "MON 7:02 AM". */
  stamp?: string;
  title: string;
  scenario: string;
  cost: string;
  /** The fix, shown as a [ PLUG ] chip. */
  plug: string;
  plugHref: string;
}

export interface NicheWorkflowStep {
  text: string;
  /** 1-based leak numbers this step plugs, shown as [ PLUGS LEAK 0X ]. */
  plugsLeaks?: number[];
}

export interface Niche {
  slug: string;
  name: string;
  category: NicheCategory;
  /** Plural word for this industry's customers: "Ready for more {customerNoun}?" */
  customerNoun: string;
  /** Singular lead phrase for this industry's inquiries. */
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
  /** The niche's leak story in one line: Leaks section heading and /solutions card lead. */
  leakHeadline: string;
  /** Leak 01 is featured (and carries the stamp); 02-04 render as rows. */
  painPoints: NicheLeak[];
  /** Workflow section heading, told from the leak story. */
  workflowHeadline: string;
  intakeWorkflowSteps: NicheWorkflowStep[];
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
    leakHeadline: "The toothache call that hit voicemail.",
    painPoints: [
      {
        stamp: "SAT 7:10 AM",
        title: "Toothache call goes to voicemail",
        scenario: "A patient with a cracked molar calls before you open, gets the machine, and books whoever answers next.",
        cost: "An emergency patient, and likely their family's cleanings.",
        plug: "Missed-call text-back + AI chat booking",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "Cancel at 8, empty chair at 9",
        scenario: "A hygiene patient cancels by text and nobody has time to work the short-call list.",
        cost: "An hour of chair time billed to no one.",
        plug: "AI scheduling shows open slots online",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "Friday-night form, Monday reply",
        scenario: "A new patient fills out your form Friday night and hears back Monday.",
        cost: "A new patient who booked elsewhere Saturday.",
        plug: "Instant call-back + auto-reply",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Six months pass, no recall",
        scenario: "A patient leaves without the next cleaning booked and never gets a reminder.",
        cost: "A patient who quietly drifts away.",
        plug: "Automated recall texts and emails",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From toothache call to booked chair, automatically.",
    intakeWorkflowSteps: [
      { text: "A patient searching for a dentist nearby finds your practice first" },
      { text: "They book online, ask the AI chat, or tap to call, any time of day", plugsLeaks: [2, 3] },
      { text: "Intake flags emergencies so you can fit them in same-day", plugsLeaks: [1] },
      { text: "Missed calls get a text back right away, so after-hours patients aren't lost to voicemail", plugsLeaks: [1] },
      { text: "Automatic text and email reminders bring patients back for their next cleaning", plugsLeaks: [4] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "The filler question nobody answered at 10 PM.",
    painPoints: [
      {
        stamp: "10:04 PM",
        title: "Pricing question, answered Thursday",
        scenario: "Someone sees your before-and-afters, asks about filler pricing on your site at night, and waits two days.",
        cost: "A consult booked with the spa that answered that night.",
        plug: "AI chat answers and books 24/7",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "“Let me think about it,” then silence",
        scenario: "A laser client gets a quote and never hears from you again.",
        cost: "A high-ticket package that goes to whoever followed up.",
        plug: "Automatic text and email follow-up",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "First consult no-show",
        scenario: "A first-time consult forgets, and your injector sits idle.",
        cost: "A booked hour that earns nothing.",
        plug: "Automatic reminders",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Membership interest on a sticky note",
        scenario: "A client asks about membership at checkout and nobody follows up.",
        cost: "Recurring revenue you never start.",
        plug: "Lead list + follow-up",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From late-night question to booked consult, automatically.",
    intakeWorkflowSteps: [
      { text: "Someone researching a treatment finds your med spa on Google or in an AI answer" },
      { text: "Intake asks which treatment they want: injectables, laser, or body contouring" },
      { text: "AI chat answers common questions and books the consult on the spot", plugsLeaks: [1] },
      { text: "Automatic text and email reminders go out before the consult to cut no-shows", plugsLeaks: [3] },
      { text: "Your lead list and automatic follow-up track every quote and membership question until it's booked", plugsLeaks: [2, 4] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "No heat at 2 AM. Who picks up?",
    painPoints: [
      {
        stamp: "JAN · 2:14 AM",
        title: "Furnace dies overnight",
        scenario: "A family calls three companies in a row and books the first one that responds.",
        cost: "An emergency job, and that home's future service.",
        plug: "Missed-call text-back + instant call-back",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "First heat wave, lines jammed",
        scenario: "The office can't answer every line and callers keep dialing down the list.",
        cost: "The busiest week of the year leaks the most jobs.",
        plug: "AI chat books the overflow online",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "Tune-up season, no reminder",
        scenario: "Last year's customers never hear from you and call the fridge-magnet company when it breaks.",
        cost: "Easy recurring work turned into someone else's emergency call.",
        plug: "Automatic seasonal emails and texts",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Tech arrives blind",
        scenario: "The call said “not cooling” and the tech finds something else entirely.",
        cost: "A wasted trip and a second visit.",
        plug: "Intake form captures system and symptoms",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From 2 AM call to booked repair, automatically.",
    intakeWorkflowSteps: [
      { text: "A homeowner with no heat or no AC searches and finds you first" },
      { text: "They tap to call, and missed calls get a text back right away, even at 2 AM", plugsLeaks: [1] },
      { text: "Intake captures the system and symptoms and flags emergencies, so urgent jobs go first and techs arrive ready", plugsLeaks: [4] },
      { text: "AI chat books tune-ups and maintenance visits online", plugsLeaks: [2] },
      { text: "Automatic follow-up after the job invites them back for their next seasonal tune-up", plugsLeaks: [3] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "After the hail, the first roofer to answer wins.",
    painPoints: [
      {
        stamp: "MON 7:02 AM",
        title: "The Monday after the hailstorm",
        scenario: "Half the neighborhood calls roofers at once, and inspections go to whoever picks up first.",
        cost: "Storm jobs signed with a competitor while you're on a roof.",
        plug: "Instant call-back + missed-call text-back",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Bid sent, then silence",
        scenario: "The homeowner says they're getting two more quotes, and nobody checks back.",
        cost: "The job goes to whoever followed up, not the best bid.",
        plug: "Lead list + automatic bid follow-up",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Claim treated like a cash job",
        scenario: "An insurance customer gets the same generic call as an out-of-pocket buyer.",
        cost: "They pick the roofer who sounded ready for the claim.",
        plug: "Intake asks “insurance claim?” up front",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Drive out for a gutter",
        scenario: "A vague inquiry turns out to be a small repair after you've driven across town.",
        cost: "Half a day in peak season.",
        plug: "Request captures address, scope and damage photos",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From storm call to signed roof, automatically.",
    intakeWorkflowSteps: [
      { text: "After a storm, homeowners searching for roof repair find you first" },
      { text: "The inspection request captures the address, damage photos, and whether it's an insurance claim", plugsLeaks: [3, 4] },
      { text: "Instant call-back rings your phone the moment a request comes in", plugsLeaks: [1] },
      { text: "Your lead list tracks every inspection and bid until the job is signed", plugsLeaks: [2] },
      { text: "Automatic follow-up checks in on open bids so they don't go cold", plugsLeaks: [2] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "The night-after search goes to whoever answers.",
    painPoints: [
      {
        stamp: "9:40 PM",
        title: "Form filled, firm two called",
        scenario: "Someone in trouble fills out your form tonight and calls the next firm while waiting.",
        cost: "A case signed with the faster firm.",
        plug: "AI chat + instant call-back",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "Consult done, retainer unsigned",
        scenario: "A prospect leaves “thinking it over” and nobody follows up.",
        cost: "Attorney hours spent, no retainer.",
        plug: "Lead list + automatic follow-up",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Wrong practice area on the calendar",
        scenario: "A consult slot goes to a matter you don't handle.",
        cost: "Billable time given away.",
        plug: "Practice-area intake questions",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "A form that feels exposed",
        scenario: "Someone with a sensitive matter sees a bare “Message” box and closes the tab.",
        cost: "They never contact you at all.",
        plug: "Guided private intake that explains next steps",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From late-night form to signed retainer, automatically.",
    intakeWorkflowSteps: [
      { text: "Someone with a legal problem searches and finds your firm" },
      { text: "Practice-area intake asks the questions an attorney needs before the call", plugsLeaks: [3, 4] },
      { text: "AI chat answers first questions and schedules the consultation", plugsLeaks: [1] },
      { text: "Your lead list tracks every case evaluation through to a signed retainer", plugsLeaks: [2] },
      { text: "Automatic follow-up stays in touch with people who haven't signed yet", plugsLeaks: [2] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "In March, your best lead waits behind W-2s.",
    painPoints: [
      {
        stamp: "MARCH",
        title: "Advisory lead buried in tax season",
        scenario: "A business owner wanting CFO-level help sits in the same queue as simple returns.",
        cost: "Your highest-value client of the year hires the firm that called back.",
        plug: "Intake routes advisory to direct booking",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Every inquiry looks the same",
        scenario: "Staff hand-sort new requests during the busiest weeks.",
        cost: "Hours you don't have in March.",
        plug: "Intake separates tax, bookkeeping and advisory",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Documents in five threads",
        scenario: "You email the list three times and the pieces trickle in.",
        cost: "Returns stalled on paperwork.",
        plug: "Automatic “what to have ready” emails",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Full now, no “talk in May”",
        scenario: "At capacity, inquiries just go unanswered.",
        cost: "Clients you could have had after April, gone for good.",
        plug: "Lead list + post-season follow-up",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From March inquiry to signed engagement, automatically.",
    intakeWorkflowSteps: [
      { text: "A business owner looking for a CPA finds your firm on Google or in an AI answer" },
      { text: "Intake separates tax prep, bookkeeping, and advisory requests up front", plugsLeaks: [2] },
      { text: "Advisory leads book a consultation directly, so they don't wait behind tax-season questions", plugsLeaks: [1] },
      { text: "Automatic emails tell each new client which documents to have ready", plugsLeaks: [3] },
      { text: "Your lead list tracks every inquiry, and follow-up reaches the ones you couldn't take until after tax season", plugsLeaks: [4] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "You drove out to quote a kitchen they couldn't afford.",
    painPoints: [
      {
        stamp: "SAT 9 AM",
        title: "The estimate that couldn't close",
        scenario: "You give up a Saturday to walk a remodel, and the budget is a fraction of the scope.",
        cost: "Estimator time burned on a job that never had a chance.",
        plug: "Intake captures scope and budget range",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Quote sent, contractor two calls first",
        scenario: "Your bid lands and the homeowner signs with whoever followed up.",
        cost: "A qualified project lost on speed, not quality.",
        plug: "Lead list + automatic quote follow-up",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Best work lives on your phone",
        scenario: "Homeowners compare portfolios before calling and can't see yours.",
        cost: "They choose the contractor whose work they can see.",
        plug: "Portfolio site + on-site photo and video",
        plugHref: "/marketing-solutions/video-photography",
      },
      {
        title: "Earned reviews, invisible",
        scenario: "Great Google reviews never appear where homeowners decide.",
        cost: "Trust you earned never reaches the next client.",
        plug: "Reviews on site + Google Business Profile",
        plugHref: "/marketing-solutions/seo",
      },
    ],
    workflowHeadline: "From first inquiry to signed contract, automatically.",
    intakeWorkflowSteps: [
      { text: "A homeowner planning a project finds you on Google and sees your past work and reviews", plugsLeaks: [3, 4] },
      { text: "Intake captures project type, scope, and budget range before you drive out", plugsLeaks: [1] },
      { text: "They book the estimate visit online, or tap to call" },
      { text: "Your lead list tracks every bid through to a signed contract", plugsLeaks: [2] },
      { text: "Automatic follow-up checks in on open quotes before another contractor does", plugsLeaks: [2] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "Sunday-night valuation, Tuesday reply.",
    painPoints: [
      {
        stamp: "SUN 8:30 PM",
        title: "Valuation request goes unanswered",
        scenario: "A homeowner curious about their price hears nothing until Tuesday.",
        cost: "A listing appointment won by the agent who replied.",
        plug: "Valuation requests book into your calendar + auto follow-up",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "Buyer and seller in one pile",
        scenario: "A ready-to-list seller gets the same reply as a casual browser.",
        cost: "Your hottest lead treated like your coldest.",
        plug: "Intake sorts buyers from sellers",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Showing request lost in your texts",
        scenario: "Requests come in by text, call and form, and one slips through.",
        cost: "That buyer tours with someone else.",
        plug: "Showings book straight into your calendar",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "“Maybe next spring,” then nothing",
        scenario: "Nobody stays in touch until they're ready.",
        cost: "By spring they're working with another agent.",
        plug: "Automatic texts and emails until they're ready",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From Sunday-night valuation to listing appointment, automatically.",
    intakeWorkflowSteps: [
      { text: "Buyers and sellers searching your area find you on Google and in AI answers" },
      { text: "Intake sorts buyers from sellers at the first click", plugsLeaks: [2] },
      { text: "Showing and valuation requests book straight into your calendar", plugsLeaks: [1, 3] },
      { text: "Automatic text and email follow-up keeps every lead warm until they're ready to move", plugsLeaks: [4] },
      { text: "Your lead list shows where every lead stands, from first contact to closing" },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "First warm week of April, voicemail is full.",
    painPoints: [
      {
        stamp: "APRIL",
        title: "Spring rush hits voicemail",
        scenario: "Everyone wants a quote the same week while you're on a mower.",
        cost: "A season of customers booked with whoever called back.",
        plug: "Missed-call text-back + online quote form",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Patio bid behind a mow quote",
        scenario: "Weekly mowing and a backyard hardscape bid sit in one inbox, first come first served.",
        cost: "Your biggest job waits in line.",
        plug: "Intake separates maintenance from hardscape",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Scope discovered on-site",
        scenario: "You drive out and find far more work than described.",
        cost: "An unbillable trip and a rushed estimate.",
        plug: "Requests include photos and property size",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Last year's clients never rebooked",
        scenario: "No pre-season check-in, so they hire whoever knocks first.",
        cost: "Recurring revenue you already earned, handed away.",
        plug: "Automatic pre-season follow-up",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From spring-rush call to booked crew, automatically.",
    intakeWorkflowSteps: [
      { text: "A homeowner searching for landscaping finds you first" },
      { text: "Intake separates weekly maintenance from one-time hardscape and design bids", plugsLeaks: [2] },
      { text: "Estimate requests include photos and property size, so you know the scope before the visit", plugsLeaks: [3] },
      { text: "Missed calls get a text back during the spring rush", plugsLeaks: [1] },
      { text: "Automatic follow-up reaches maintenance customers before each season", plugsLeaks: [4] },
    ],
    primaryCTA: 'Book My Free Call',
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
    leakHeadline: "The ceramic coating call you missed mid-interior.",
    painPoints: [
      {
        stamp: "SAT 10:15 AM",
        title: "Missed the coating call",
        scenario: "A caller pricing ceramic coating hits voicemail and books the next shop on the map.",
        cost: "Your highest-ticket job of the week, gone.",
        plug: "Missed-call text-back + online booking",
        plugHref: "/marketing-solutions/lead-generation",
      },
      {
        title: "Wrong package, awkward pickup",
        scenario: "They booked “a detail” expecting paint correction, so the price talk happens at the bay.",
        cost: "A tense pickup instead of a happy review.",
        plug: "Package picked online, before arrival",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "Two cars, one bay, same hour",
        scenario: "A phone booking and a text booking land in the same slot.",
        cost: "One customer waits, one leaves.",
        plug: "Online scheduling with real availability",
        plugHref: "/marketing-solutions/ai-chat-scheduling",
      },
      {
        title: "Clean car, never heard from again",
        scenario: "No reminder goes out when the next wash is due.",
        cost: "Repeat business that goes to someone else.",
        plug: "Automated reminder texts",
        plugHref: "/marketing-solutions/lead-generation",
      },
    ],
    workflowHeadline: "From missed call to booked bay, automatically.",
    intakeWorkflowSteps: [
      { text: "Someone searching for detailing nearby finds your shop" },
      { text: "They pick their package online: wash, full detail, or ceramic coating", plugsLeaks: [2] },
      { text: "They book a time, mobile or in-shop, or tap to call", plugsLeaks: [1, 3] },
      { text: "Automatic text reminders before the appointment cut no-shows" },
      { text: "Repeat customers get a reminder when it's time for their next detail", plugsLeaks: [4] },
    ],
    primaryCTA: 'Book My Free Call',
    secondaryCTA: 'See Auto Detailing Package Pricing',
  },
];
