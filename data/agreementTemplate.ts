// data/agreementTemplate.ts
// The current Axeon Client Services Agreement: the 2026-10-19 practice agreement
// (AxeonCORE $799/mo or AxeonGROWTH $1,999/mo on a 12-month Initial Term with the
// implementation fee credited, a 90-day performance release, territory exclusivity,
// and no health information in intake). Only the bracketed fill-in fields are
// {{variables}}.
//
// Every signed agreement records its version and a hash of the exact text signed,
// and is always rendered with that version (agreementTemplateFor). To change the
// wording, copy this file to data/agreementTemplates/v<old version>.ts, register it
// below, and bump AGREEMENT_VERSION here. Never edit a version clients have signed.
import type { OnboardingTier } from '@/data/onboardingItems';
import { TEMPLATE_2026_10_06, SCHEDULE_WEBSITE } from '@/data/agreementTemplates/v2026-10-06';
import { money, monthsInWords, type AgreementSection, type AgreementTemplate, type AgreementTerms, type ScheduleColumn } from '@/data/agreementTemplates/shared';

export type { AgreementSection, AgreementTemplate, AgreementTerms, ScheduleColumn };
export { money, SCHEDULE_WEBSITE };

export const AGREEMENT_VERSION = '2026-10-19';

const AGREEMENT_INTRO =
  'This Client Services Agreement (the “Agreement”) is entered into as of {{effectiveDate}} (the “Effective Date”) by and between Axeon Studio, {{axeonEntity}} with its principal place of business in West Des Moines, Iowa (“Axeon,” “we,” or “us”), and the client identified below (“Client,” “you,” or “your”). Axeon and Client are each a “Party” and together the “Parties.”';

const isPractice = (t: AgreementTerms) => t.tier === 'axeoncore' || t.tier === 'axeongrowth';

function termParagraphs(t: AgreementTerms): string[] {
  const out =
    t.minimumMonths === 0
      ? [
          '2.1 Initial Term. This Agreement begins on the Effective Date and continues for an initial term of one (1) month beginning on the date the Services go live or thirty (30) days after the Effective Date, whichever comes first (the “Initial Term”). There is no minimum commitment beyond the Initial Term.',
        ]
      : [
          `2.1 Initial Term. This Agreement begins on the Effective Date and continues for an initial term of ${monthsInWords(t.minimumMonths)} beginning on the date the Services go live or forty-five (45) days after the Effective Date, whichever comes first (the “Initial Term”). Client is responsible for all Fees for the full Initial Term, whether or not Client uses the Services${isPractice(t) ? ', except as provided in Section 5' : ''}.`,
        ];
  out.push(
    '2.2 Renewal. After the Initial Term, this Agreement renews automatically month-to-month (each a “Renewal Term”) until either Party gives written notice of non-renewal at least thirty (30) days before the end of the then-current term. Fees are not prorated for a partial final month.'
  );
  if (t.billing === 'annual') {
    out.push(
      '2.3 Annual prepayment. Client has elected to prepay the Initial Term in full at signing, at the annual price stated above, in place of monthly Fees for the Initial Term. Prepaid Fees are non-refundable except as stated in Sections 5.2 and 10.3.'
    );
  }
  if (t.setupCreditCents > 0) {
    out.push(
      `2.4 Implementation fee credit. Axeon's standard implementation fee for the Plan is ${money(t.setupCreditCents)}. In consideration of Client's commitment to the full Initial Term, Axeon credits that fee in full and no implementation fee is due at signing. Client's obligations if this Agreement ends before the Initial Term is complete are stated in Section 10.1; the credited fee is never charged in addition to them.`
    );
  }
  if ((t.pilotDays ?? 0) > 0) {
    const days = `${NUMBER_WORDS_PILOT[t.pilotDays!] ?? t.pilotDays} (${t.pilotDays})`;
    out.push(
      `2.5 Pilot period. Client may end this Agreement for any reason by email to Axeon sent within ${days} days after Client signs it (the “Pilot Period”). On termination under this Section, Client owes nothing: no Fees are charged during the Pilot Period, any implementation fee credited under Section 2.4 is not charged, and Sections 2.1, 10.1, and 10.4(a) do not apply. Axeon will remove the call forwarding on any tracking number it provided, and Client keeps its own business phone numbers, domain, and Google Business Profile listing.`
    );
  }
  return out;
}

const NUMBER_WORDS_PILOT: Record<number, string> = { 14: 'fourteen', 30: 'thirty', 45: 'forty-five', 60: 'sixty' };

const PERFORMANCE_SECTION: AgreementSection = {
  heading: '5. 90-Day Performance Commitment',
  paragraphs: [
    '5.1 Commitments. For Clients on the AxeonCORE or AxeonGROWTH Plan, Axeon commits that: (a) the website and Subscription Systems listed in Schedule A will go live within thirty (30) days after Client has delivered the materials and access required by Section 3; (b) once live, the missed-call text-back and the web-inquiry response will send a first reply within sixty (60) seconds of a missed call or a new web inquiry in at least ninety-five percent (95%) of events, as recorded in AxeonPROOF; and (c) a review request will be sent for each appointment that Client marks complete or that is reported to the Services (together, the “Performance Commitments”).',
    "5.2 Release. If Axeon misses a Performance Commitment before the Services go live or during the first ninety (90) days after they go live, and does not cure the miss within fifteen (15) days after Client's written notice describing it, Client may terminate this Agreement by written notice given no later than one hundred five (105) days after the Services go live (or at any time before they go live). On a termination under this Section, Client owes only the Fees for months that began before the termination date, the remaining Fees for the Initial Term are not due, any implementation fee credited under Section 2.4 is not charged, and any prepaid Fees for whole months after the termination date are refunded.",
    "5.3 Conditions. Delays caused by Client, by Client's failure to meet Section 3, or by third-party platforms (including carrier and 10DLC registration, Google verification, and domain transfers) extend the deadlines in Section 5.1 day-for-day and are not a missed Performance Commitment. The release in Section 5.2 is not available if Client is more than ten (10) days past due on any Fees or has changed, taken offline, or interfered with the website, tracking numbers, forms, Google Business Profile, or automations provided by Axeon.",
    "5.4 What is not promised. The release in Section 5.2 is Client's sole and exclusive remedy for a missed Performance Commitment. Axeon does not promise any number of calls, leads, inquiries, booked appointments, new patients or clients, revenue, search ranking, or return on investment, and a lower volume of any of them than Client expected is not a missed Performance Commitment. Performance is measured by Axeon's systems and AxeonPROOF, whose records are presumed accurate.",
  ],
};

const territoryParagraph = (t: AgreementTerms) =>
  `6.8 Territory exclusivity. While Client is on the AxeonCORE or AxeonGROWTH Plan and no Fees are more than ten (10) days past due, Axeon will not provide the Subscription Systems to another business whose primary specialty is ${t.specialty} at a location within five (5) miles of Client's business address stated above. This Section applies only to agreements Axeon signs after the Effective Date, does not restrict Axeon's marketing, audits, or proposals to any business, and ends automatically on termination or if Client's account becomes more than ten (10) days past due.`;

function agreementSections(t: AgreementTerms): AgreementSection[] {
  const practice = isPractice(t);
  const sections: AgreementSection[] = [
    {
      heading: '1. Services',
      paragraphs: [
        '1.1 Scope. Axeon will provide the services included in the Plan selected above, as described in Schedule A (together with any add-ons listed above, the “Services”). Schedule A is incorporated into this Agreement. Anything not expressly listed in Schedule A is outside the scope of the Services.',
        "1.2 Changes in scope. Requests outside Schedule A (including additional pages beyond the Plan allowance, redesigns after approval, new integrations, and work on third-party platforms) will be quoted separately and performed only after Client's written approval of the quote. Content updates beyond the monthly allowance in Schedule A are billed at Axeon's then-current hourly rate of {{hourlyRate}}, rounded to the nearest quarter hour.",
        '1.3 Manner of performance. Axeon decides the methods, tools, platforms, personnel, and subcontractors used to deliver the Services. Axeon may use artificial-intelligence tools, automation, and its proprietary systems in performing the Services.',
        `1.4 Timelines. Dates provided by Axeon are good-faith estimates${practice ? ', except the Performance Commitments in Section 5' : ''}. Timelines depend on Client's timely delivery of content, access, feedback, and approvals under Section 3, and extend day-for-day for any Client delay. Axeon is not responsible for delays caused by Client, by third-party platforms (including Google, Meta, telephony carriers, domain registrars, and hosting providers), or by events outside Axeon's reasonable control.`,
      ],
    },
    { heading: '2. Term and renewal', paragraphs: termParagraphs(t) },
    {
      heading: '3. Client responsibilities',
      paragraphs: [
        "Client will, at its own expense: (a) provide all content, logos, photos, provider and team information, service descriptions, pricing, and other materials Axeon reasonably requests (“Client Materials”) within five (5) business days of request; (b) provide and maintain administrator or manager access to Client's domain registrar, Google Business Profile, existing website, phone system, ad accounts, and other accounts needed for the Services; (c) designate one primary contact with authority to approve work; (d) review deliverables and respond to requests for approval within five (5) business days, after which the deliverable is deemed approved; (e) respond to every new inquiry routed to Client through the Services within one (1) business day; (f) keep its business information (hours, phone, address, services, providers) accurate and notify Axeon of changes; and (g) comply with all laws and professional rules applicable to Client's business and advertising, including licensing, professional-conduct, and truth-in-advertising rules for Client's profession.",
      ],
    },
    {
      heading: '4. Fees and payment',
      paragraphs: [
        `4.1 Fees. Client will pay the Fees stated above (the “Fees”). Any implementation fee stated as due is payable on signing and is non-refundable${practice ? ' except as stated in Section 5.2' : ''}; it reserves Axeon's production capacity and covers implementation. Unless the Fees above are an annual prepayment, nothing else is due at signing: the first monthly Fee is due on the date the Services go live, and each subsequent monthly Fee is due on the same day of each month thereafter. If go-live is delayed because Client has not met its obligations under Section 3, the first monthly Fee is instead due forty-five (45) days after the Effective Date.`,
        '4.2 Automatic payment. Client authorizes Axeon to charge the payment method on file (through Stripe or a successor processor) for all Fees and approved charges when due, and agrees to keep a valid payment method on file for the term of this Agreement.',
        "4.3 Ad spend. Advertising media costs (Google, Google Local Services, Meta, and any other network) are separate from and in addition to the Fees, are paid by Client directly to the advertising platform using Client's own payment method, and are never refundable by Axeon. Ads management requires a minimum ad spend of $500 per month. Axeon's management fee is not a percentage of or contingent on ad spend unless stated above.",
        "4.4 Late payment. Amounts not paid within five (5) days of the due date accrue a late fee of $35 or 1.5% per month, whichever is greater, to the extent permitted by law. If any amount is more than ten (10) days past due, Axeon may, on written notice, suspend the Services, take the website and any Axeon-hosted systems offline, and pause advertising until the account is current. Suspension does not relieve Client of its payment obligations, and the term is not extended by any suspension. Client is responsible for Axeon's reasonable costs of collection, including attorney's fees.",
        "4.5 Taxes. Fees exclude sales, use, and similar taxes. Client is responsible for any such taxes other than taxes on Axeon's income.",
        "4.6 Price changes. Axeon may change monthly Fees for any Renewal Term with at least thirty (30) days' written notice. Fees are fixed during the Initial Term and during any prepaid period.",
        '4.7 Chargebacks. Client agrees to raise any billing dispute with Axeon in writing within thirty (30) days of the charge and before initiating a chargeback. A chargeback initiated on a valid charge is a material breach of this Agreement.',
      ],
    },
    practice ? PERFORMANCE_SECTION : { heading: '5. Reserved', paragraphs: ['Section 5 (Performance Commitment) applies only to the AxeonCORE and AxeonGROWTH Plans and is intentionally omitted for this Plan.'] },
    {
      heading: '6. Ownership and intellectual property',
      paragraphs: [
        "6.1 Client Materials. Client retains ownership of Client Materials and grants Axeon a non-exclusive, royalty-free license to use, reproduce, modify, and display them to perform the Services and as permitted by Section 6.5. Client represents that it owns or has the right to use all Client Materials and that they do not infringe any third party's rights.",
        "6.2 Deliverables. Upon Axeon's receipt of payment in full of all Fees due through the end of the Initial Term, Axeon assigns to Client all of Axeon's right, title, and interest in the custom website design, page copy, and site code written specifically for Client (the “Deliverables”), together with the design files. Until that time, Axeon owns the Deliverables and grants Client a limited license to use them solely for Client's business.",
        '6.3 Axeon Tools. Notwithstanding Section 6.2, Axeon retains all rights in its pre-existing and independently developed materials, including its templates, frameworks, component libraries, prompts, automations, workflows, integrations, middleware, webhooks, AxeonPROOF, dashboards, CRM pipelines, know-how, and any generic or reusable code (“Axeon Tools”). To the extent Axeon Tools are embedded in the Deliverables, Axeon grants Client a perpetual, non-exclusive, non-transferable license to use them as part of the Deliverables only. Client may not extract, resell, sublicense, or reuse Axeon Tools separately, and may not use them to provide services to third parties.',
        "6.4 Subscription Systems. The intake and messaging system, call tracking and texting numbers, missed-call text-back, web-inquiry response, online booking, AI chat, AI receptionist, automated follow-up, CRM pipeline, review automation, database reactivation campaigns, AxeonPROOF, and similar services (“Subscription Systems”) are provided as a service for the term of this Agreement, are not Deliverables, and cease on termination. Tracking and texting numbers are owned or licensed by Axeon; Client's own business phone numbers remain Client's property at all times. At termination, Axeon will, on request and at Client's cost, port a tracking number to Client once all Fees are paid in full.",
        "6.5 Portfolio and publicity. Client grants Axeon the right to display the Deliverables, Client's name and logo, and non-confidential results (such as response times and inquiry counts, never patient or client information) in Axeon's portfolio, website, case studies, proposals, and marketing, and to include a small “Powered by Axeon” credit in the website footer. Client may withdraw consent to future use by written notice, except for materials already published.",
        "6.6 Third-party components. Deliverables may include open-source software, stock assets, fonts, plugins, and third-party services licensed under their own terms, which Client accepts. Ongoing third-party subscription costs after termination are Client's responsibility.",
        "6.7 Domain and Google Business Profile. Client's domain name and Google Business Profile are and remain Client's property. Axeon will not register domains in its own name on Client's behalf unless Client requests it in writing, in which case Axeon will transfer the domain to Client at Client's request once the account is paid in full.",
        ...(practice && t.specialty ? [territoryParagraph(t)] : []),
      ],
    },
    {
      heading: '7. Hosting, security, and third-party platforms',
      paragraphs: [
        '7.1 Hosting. While this Agreement is in effect, Axeon will host the website on infrastructure Axeon selects and will use commercially reasonable efforts to keep it available, apply security updates, and maintain backups. Hosting is provided “as is” and uptime is not guaranteed; Axeon is not liable for outages caused by hosting providers, DNS, domain expiration, DDoS attacks, or Client actions.',
        "7.2 Third-party platforms. The Services depend on platforms Axeon does not control, including Google Search, Google Business Profile, Google Ads and Local Services Ads, Meta, AI search engines, telephony carriers, and payment processors. Axeon does not control and is not responsible for their algorithms, policies, pricing, account reviews, suspensions, outages, or changes, or for their effect on Client's results.",
        "7.3 Client credentials. Client is responsible for keeping its own credentials secure and for all activity under accounts Client controls. Client will promptly remove Axeon's access on termination.",
      ],
    },
    {
      heading: '8. Communications, data, and compliance',
      paragraphs: [
        "8.1 Messaging consent. Certain Subscription Systems send text messages, emails, and automated or AI-generated calls to Client's leads, patients, and clients on Client's behalf. These are sent as Client's agent, in Client's name. Client is solely responsible for obtaining and maintaining all consents required by law (including the TCPA, CAN-SPAM, state telemarketing laws, and carrier 10DLC registration requirements), including before any database reactivation campaign to past patients or clients, for honoring opt-outs, and for the content of any scripts or messages Client approves or edits. Axeon will configure the systems with reasonable default consent language and opt-out handling, which Client agrees to review and approve.",
        "8.2 Reviews. Review requests will be sent only to Client's actual patients or clients. Client will not ask Axeon to create, purchase, filter, or incentivize reviews in violation of platform policies, professional rules, or the FTC's rules on consumer reviews, and Axeon may refuse any such request.",
        '8.3 Customer data. Lead, patient, and client contact data collected through the Services (“Customer Data”) belongs to Client. Client grants Axeon a license to process Customer Data to perform the Services and to produce aggregated, de-identified analytics. Client is responsible for its own privacy policy and for complying with privacy laws applicable to its collection and use of Customer Data. Axeon will export Customer Data to Client in a standard format on request at termination, provided the account is paid in full.',
        "8.4 Professional rules. Client is responsible for ensuring that its advertising, claims, offers, testimonials, and website content comply with laws and professional rules governing Client's profession (for example, attorney advertising and solicitation rules, dental and medical board advertising rules, and accountancy rules). Axeon relies on Client to identify and approve any regulated claims.",
        "8.5 No health information. The Services are not designed to receive protected health information as defined under HIPAA or similar laws. Axeon configures intake to collect only contact details, the service of interest, and scheduling preferences. Client will not configure, request, or approve forms, scripts, or messages that ask leads for symptoms, diagnoses, treatment history, insurance details, or other health information, and will not send such information to Axeon. Axeon is not Client's business associate unless the Parties sign a separate business associate agreement.",
      ],
    },
    {
      heading: '9. Confidentiality and non-solicitation',
      paragraphs: [
        "9.1 Confidential Information. Each Party will keep the other's non-public business information confidential and use it only to perform this Agreement, for the term and for two (2) years after. Axeon's pricing, proposals, processes, Axeon Tools, and this Agreement's terms are Axeon's Confidential Information. Information that is public, independently developed, or lawfully received from a third party is excluded.",
        "9.2 Non-solicitation. During the term and for twelve (12) months after, Client will not directly or indirectly solicit for hire or engage any Axeon employee or contractor who performed Services for Client, without Axeon's written consent. Client agrees that a breach of this Section would cause harm that is difficult to measure and that liquidated damages equal to twelve (12) months of the Fees are a reasonable estimate of that harm.",
      ],
    },
    {
      heading: '10. Termination',
      paragraphs: [
        t.minimumMonths === 0
          ? '10.1 By Client for convenience. Client may terminate this Agreement for any reason by giving written notice under Section 2.2, effective at the end of the then-current term. If Client stops payment or abandons the Services, all Fees for the then-current term become immediately due.'
          : `10.1 By Client for convenience. Client may terminate this Agreement effective at the end of the Initial Term or any Renewal Term by giving written notice under Section 2.2. Client may not terminate for convenience during the Initial Term${practice ? ((t.pilotDays ?? 0) > 0 ? ', except under Sections 2.5 and 5.2' : ', except under Section 5.2') : ''}. If Client terminates, stops payment, or abandons the Services during the Initial Term${practice ? ' other than under Section 5.2' : ''}, all remaining Fees for the Initial Term become immediately due.`,
        "10.2 By either Party for cause. Either Party may terminate on written notice if the other materially breaches this Agreement and fails to cure within fifteen (15) days of written notice (five (5) days for non-payment). Axeon may terminate immediately if Client's account is more than thirty (30) days past due, if Client initiates a chargeback on a valid charge, if Client's business ceases operating, or if Client directs Axeon to do anything unlawful or in violation of platform policies or professional rules. If Axeon terminates for Client's breach, Section 10.1 applies as if Client had terminated.",
        "10.3 By Axeon for convenience. Axeon may terminate this Agreement for any reason on thirty (30) days' written notice, in which case Axeon will refund any prepaid Fees for periods after the termination date and no remaining Initial Term Fees are due.",
        `10.4 Effect of termination. On termination: (a) all unpaid Fees through the end of the then-current term become due, except as stated in ${practice ? 'Sections 5.2 and 10.3' : 'Section 10.3'}; (b) Subscription Systems, hosting, AxeonPROOF, and Axeon access end on the termination date, and Client is responsible for arranging its own hosting; (c) if the account is paid in full, Axeon will provide Client's website files, design files, and Customer Data export within fifteen (15) business days of request, and will keep the site live for a transition period of up to thirty (30) days at Client's request; (d) if the account is not paid in full, Axeon may take the website offline and withhold Deliverables until payment; and (e) Axeon has no obligation to transfer Axeon Tools or Subscription Systems. Refunds are not owed except as stated in ${practice ? 'Sections 5.2 and 10.3' : 'Section 10.3'}.`,
        `10.5 Survival. Sections 4, ${practice ? '5.4, ' : ''}6, 8, 9, 10.4, 11, 12, and 13 survive termination.`,
      ],
    },
    {
      heading: '11. Warranties and disclaimers',
      paragraphs: [
        "11.1 Axeon. Axeon warrants that it will perform the Services in a professional and workmanlike manner. Client's exclusive remedy for breach of this warranty is re-performance of the non-conforming Services, provided Client notifies Axeon in writing within thirty (30) days.",
        '11.2 Client. Client warrants that it has authority to enter this Agreement, that the person signing is authorized to bind Client, that Client Materials are accurate and lawful, and that Client holds all licenses required to offer its services.',
        `11.3 Disclaimer. Except as expressly stated in this Agreement, the Services, Deliverables, and Subscription Systems are provided “as is.” Axeon disclaims all other warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. ${practice ? 'Other than the Performance Commitments in Section 5, Axeon' : 'Axeon'} does not guarantee any search ranking, traffic level, number of leads, conversion rate, revenue, or return on investment, and Client acknowledges that results depend on factors outside Axeon's control, including Client's pricing, reputation, responsiveness, competition, and seasonality.`,
      ],
    },
    {
      heading: '12. Limitation of liability and indemnification',
      paragraphs: [
        "12.1 Cap. To the fullest extent permitted by law, Axeon's total cumulative liability arising out of or related to this Agreement, under any theory, will not exceed the Fees actually paid by Client to Axeon in the three (3) months immediately before the event giving rise to the claim.",
        "12.2 Exclusion. In no event will Axeon be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages, or for lost profits, lost revenue, lost business, lost data, loss of goodwill, cost of substitute services, platform suspensions, or damages arising from Client's communications with its own patients, clients, or leads, even if advised of the possibility of such damages.",
        "12.3 Indemnification by Client. Client will defend, indemnify, and hold harmless Axeon and its owners, employees, and contractors from and against all claims, damages, fines, penalties, and expenses (including reasonable attorney's fees) arising out of or related to: (a) Client Materials or any content, claims, or offers Client provides or approves; (b) Client's products, services, or professional practice; (c) messages, calls, or communications sent to Client's leads, patients, or clients through the Services, including any alleged violation of the TCPA or similar laws; (d) any health information Client sends or causes to be collected in breach of Section 8.5; (e) Client's breach of this Agreement or of any law, professional rule, or platform policy; or (f) any dispute between Client and its patients or clients.",
        '12.4 Time limit on claims. Any claim by Client arising out of this Agreement must be brought within one (1) year after the claim accrues or it is waived.',
      ],
    },
    {
      heading: '13. General terms',
      paragraphs: [
        '13.1 Governing law and venue. This Agreement is governed by the laws of the State of Iowa, without regard to conflict-of-laws rules. The Parties consent to the exclusive jurisdiction and venue of the state and federal courts located in Polk County, Iowa, except that Axeon may seek collection or injunctive relief in any court of competent jurisdiction.',
        "13.2 Dispute resolution. Before filing any lawsuit (other than for non-payment or injunctive relief), the Parties will attempt in good faith to resolve the dispute through direct discussion for at least thirty (30) days after written notice. The prevailing Party in any action to enforce this Agreement is entitled to recover its reasonable attorney's fees and costs. Each Party waives any right to a jury trial.",
        '13.3 Independent contractor. Axeon is an independent contractor. Nothing in this Agreement creates a partnership, joint venture, employment, or fiduciary relationship.',
        '13.4 Force majeure. Neither Party is liable for failure or delay caused by events beyond its reasonable control, including internet or platform outages, carrier failures, acts of God, government action, pandemic, or labor disputes; payment obligations are not excused.',
        '13.5 Notices. Notices must be in writing and sent by email with confirmation of receipt to Axeon at hello@axeonstudio.co and to Client at the email on file, or by courier to the addresses above. Notices are effective on receipt.',
        "13.6 Assignment. Client may not assign this Agreement without Axeon's written consent. Axeon may assign this Agreement to an affiliate or successor to its business.",
        "13.7 Entire agreement; amendments. This Agreement, including Schedule A, is the entire agreement between the Parties about its subject and supersedes all prior proposals, quotes, audits, and communications. It may be amended only in a writing signed (including electronically) by both Parties. Axeon's website descriptions and marketing are for information only and are not part of this Agreement except as restated in Schedule A.",
        "13.8 Severability; waiver. If any provision is unenforceable, it will be enforced to the maximum extent permitted and the rest of the Agreement remains in effect. A Party's failure to enforce a provision is not a waiver of it.",
        "13.9 Electronic signatures; counterparts. This Agreement may be signed electronically and in counterparts, each of which is an original. Client's payment of the first Fees, click-through acceptance, or written acceptance by email also constitutes acceptance of this Agreement.",
      ],
    },
  ];
  return sections;
}

const SCHEDULE_A: Record<Exclude<OnboardingTier, 'website'>, ScheduleColumn> = {
  essentials: {
    title: 'Essentials',
    items: [
      'Up to 4 custom mobile-first pages',
      'SEO, AEO & GEO setup',
      'Google Business Profile upkeep',
      'Inquiry form with instant alerts',
      'Hosting & security',
      '2 small edits / month',
      'Monthly calls & leads report by email',
      'Client owns site, code & design files once paid (Sec. 6.2)',
      'No Performance Commitment, territory exclusivity, or AxeonPROOF',
    ],
  },
  axeoncore: {
    title: 'AxeonCORE · Patient & Client Intake Infrastructure',
    items: [
      'Custom mobile-first practice website (5–7 pages): providers & credentials, services, reviews, booking',
      '24/7 missed-call text-back',
      'First reply to every web inquiry within 60 seconds',
      'Online consultation & appointment booking',
      'Two-way text inbox for the front desk; CRM pipeline',
      'Call tracking & texting numbers',
      'Automated review requests after each appointment',
      'AxeonPROOF client portal: live recovered-inquiry counter, change requests, monthly reports',
      'Hosting, security, monitoring & backups',
      'Up to 2 hours of content updates / month',
      '90-day Performance Commitment (Sec. 5)',
      '5-mile territory exclusivity for Client’s specialty (Sec. 6.8)',
    ],
  },
  axeongrowth: {
    title: 'AxeonGROWTH · Intake Infrastructure + Active Acquisition',
    lead: 'Everything in AxeonCORE, plus:',
    items: [
      'Google Local Services Ads & search ads management (ad spend separate, $500/mo minimum, Sec. 4.3)',
      'Quarterly database reactivation campaign to past patients or clients (Sec. 8.1)',
      'AI phone receptionist',
      'Multi-provider calendar & intake routing',
      'Quarterly conversion media: on-site photo & video, review videos, short-form reels',
      'AxeonPROOF ad & acquisition reporting',
      'Monthly strategy call and quarterly business review',
      'Up to 4 hours of content updates / month; same-day priority support',
    ],
  },
};

const SCHEDULE_A_DEFINITIONS = [
  "Definitions: A “content update” is a change to text, images, links, providers, hours, or fee schedules on existing pages; time is counted in 15-minute increments and unused time does not roll over. A “small edit” is a text, image, or link change on an existing page taking 30 minutes or less. A “page” is one URL on Client's site. Design revisions before launch: up to two (2) rounds on the homepage and one (1) round per additional page; further rounds are billed under Section 1.2.",
  "Launch: The Services “go live” on the date Client's domain first points to the Axeon-built website or, for Clients without a website component, the date the first Subscription System is activated.",
];

/** The add-ons the template lists, with their prices. */
export const AGREEMENT_ADD_ONS = [
  'Google Local Services Ads management +$750/mo (AxeonCORE; ad spend separate)',
  'Database reactivation campaign: $100 per showed appointment',
  'AI Phone Receptionist +$199/mo',
  'Extra Service Page +$450/page',
  'On-Site Videography +$1,500',
] as const;

/**
 * Default deal per Plan; the admin can change any of it per agreement. Practice
 * plans default to the 12-month Initial Term with the implementation fee
 * credited. Month-to-month = term 0 with the implementation fee charged upfront;
 * annual = the Initial Term prepaid at ten months' price.
 */
export const PLAN_DEFAULTS: Record<
  OnboardingTier,
  { setupCents: number; monthlyCents: number; minimumMonths: number; setupCreditCents: number }
> = {
  website: { setupCents: 0, monthlyCents: 4900, minimumMonths: 3, setupCreditCents: 0 },
  essentials: { setupCents: 9900, monthlyCents: 14900, minimumMonths: 3, setupCreditCents: 0 },
  axeoncore: { setupCents: 0, monthlyCents: 79900, minimumMonths: 12, setupCreditCents: 300000 },
  axeongrowth: { setupCents: 0, monthlyCents: 199900, minimumMonths: 12, setupCreditCents: 500000 },
};

/** Default fees per Plan (the welcome packet reads these when no agreement exists). */
export const PLAN_DEFAULT_FEES = Object.fromEntries(
  Object.entries(PLAN_DEFAULTS).map(([k, v]) => [k, { setupCents: v.setupCents, monthlyCents: v.monthlyCents }])
) as Record<OnboardingTier, { setupCents: number; monthlyCents: number }>;

/** Annual prepay: twelve months at the price of ten. */
export const annualCents = (monthlyCents: number) => monthlyCents * 10;

export const AXEON_ENTITY_OPTIONS = ['an Iowa limited liability company', 'a sole proprietorship'] as const;
export const ENTITY_TYPES = ['LLC', 'PLLC', 'PC', 'Corp', 'Sole Prop', 'Partnership', 'Other'] as const;

export const TEMPLATE_2026_10_19: AgreementTemplate = {
  version: '2026-10-19',
  intro: AGREEMENT_INTRO,
  sections: agreementSections,
  termSummary: (t) =>
    t.minimumMonths === 0
      ? 'Month-to-month, no minimum'
      : `${t.minimumMonths} month${t.minimumMonths === 1 ? '' : 's'}${t.billing === 'annual' ? ', prepaid' : ''}, then month-to-month${(t.pilotDays ?? 0) > 0 ? `; ${t.pilotDays}-day pilot (Sec. 2.5)` : ''}`,
  fees: (t) => {
    if (t.billing === 'annual') {
      return `${money(annualCents(t.monthlyCents))} for the ${monthsInWords(t.minimumMonths || 12)} Initial Term, paid in full at signing (twelve months at the price of ten; ${money(t.monthlyCents)} / month thereafter)`;
    }
    const credit = t.setupCreditCents > 0 ? `; the ${money(t.setupCreditCents)} implementation fee is credited in full (Sec. 2.4)` : '';
    return t.setupCents > 0
      ? `${money(t.setupCents)} implementation fee due at signing + ${money(t.monthlyCents)} / month, billed from the day the Services go live (Sec. 4.1)`
      : `${money(t.monthlyCents)} / month${credit}; nothing is due at signing, and the first month is billed when the Services go live (Sec. 4.1)`;
  },
  schedule: (t) => (t.scope === 'website' || t.tier === 'website' ? SCHEDULE_WEBSITE : SCHEDULE_A[t.tier]),
  definitions: SCHEDULE_A_DEFINITIONS,
};

const TEMPLATES: Record<string, AgreementTemplate> = {
  '2026-10-06': TEMPLATE_2026_10_06,
  '2026-10-19': TEMPLATE_2026_10_19,
};

/** The template an agreement was created and signed under. */
export const agreementTemplateFor = (version: string | null | undefined): AgreementTemplate =>
  (version && TEMPLATES[version]) || TEMPLATE_2026_10_19;
