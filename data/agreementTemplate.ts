// data/agreementTemplate.ts
// The Axeon Client Services Agreement, copied word for word from the Claude
// Design template ("Axeon Client Document Templates"). Only the bracketed fill-in
// fields became {{variables}}. Change the wording here and bump AGREEMENT_VERSION:
// every signed agreement records the version and a hash of the exact text signed.
import type { OnboardingTier } from '@/data/onboardingItems';

export const AGREEMENT_VERSION = '2026-10-06';

export interface AgreementSection {
  heading: string;
  paragraphs: string[];
}

export const AGREEMENT_INTRO =
  'This Client Services Agreement (the “Agreement”) is entered into as of {{effectiveDate}} (the “Effective Date”) by and between Axeon Studio, {{axeonEntity}} with its principal place of business in West Des Moines, Iowa (“Axeon,” “we,” or “us”), and the client identified below (“Client,” “you,” or “your”). Axeon and Client are each a “Party” and together the “Parties.”';

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    heading: '1. Services',
    paragraphs: [
      '1.1 Scope. Axeon will provide the services included in the Plan selected above, as described in Schedule A (together with any add-ons listed above, the “Services”). Schedule A is incorporated into this Agreement. Anything not expressly listed in Schedule A is outside the scope of the Services.',
      "1.2 Changes in scope. Requests outside Schedule A (including additional pages beyond the Plan allowance, redesigns after approval, new integrations, and work on third-party platforms) will be quoted separately and performed only after Client's written approval of the quote. Edits beyond the monthly edit allowance in Schedule A are billed at Axeon's then-current hourly rate of {{hourlyRate}}, rounded to the nearest quarter hour.",
      '1.3 Manner of performance. Axeon decides the methods, tools, platforms, personnel, and subcontractors used to deliver the Services. Axeon may use artificial-intelligence tools, automation, and its proprietary systems in performing the Services.',
      "1.4 Timelines. Dates provided by Axeon are good-faith estimates. Timelines depend on Client's timely delivery of content, access, feedback, and approvals under Section 3, and extend day-for-day for any Client delay. Axeon is not responsible for delays caused by Client, by third-party platforms (including Google, Meta, domain registrars, and hosting providers), or by events outside Axeon's reasonable control.",
    ],
  },
  {
    heading: '2. Term and renewal',
    paragraphs: [
      '2.1 Initial Term. This Agreement begins on the Effective Date and continues for an initial term of three (3) months beginning on the date the Services go live or thirty (30) days after the Effective Date, whichever comes first (the “Initial Term”). Client is responsible for all fees for the full Initial Term, whether or not Client uses or cancels the Services early.',
      '2.2 Renewal. After the Initial Term, this Agreement renews automatically month-to-month (each a “Renewal Term”) until either Party gives written notice of non-renewal at least thirty (30) days before the end of the then-current term. Fees are not prorated for a partial final month.',
      '2.3 Annual prepayment. If Client prepays twelve (12) months, Client receives two (2) months at no charge (fourteen months of service for the price of twelve). Prepaid fees are non-refundable except as stated in Section 10.4.',
    ],
  },
  {
    heading: '3. Client responsibilities',
    paragraphs: [
      "Client will, at its own expense: (a) provide all content, logos, photos, service descriptions, pricing, and other materials Axeon reasonably requests (“Client Materials”) within five (5) business days of request; (b) provide and maintain administrator or manager access to Client's domain registrar, Google Business Profile, existing website, ad accounts, and other accounts needed for the Services; (c) designate one primary contact with authority to approve work; (d) review deliverables and respond to requests for approval within five (5) business days, after which the deliverable is deemed approved; (e) respond to every new lead generated through the Services within one (1) business day; (f) keep its business information (hours, phone, address, services) accurate and notify Axeon of changes; and (g) comply with all laws applicable to Client's business and advertising, including licensing and truth-in-advertising rules for Client's industry.",
    ],
  },
  {
    heading: '4. Fees and payment',
    paragraphs: [
      "4.1 Fees. Client will pay the setup fee and monthly fees stated above (the “Fees”). The setup fee is due on signing and is non-refundable; it reserves Axeon's production capacity and covers onboarding. The first monthly fee is due on the first day of the Initial Term and each subsequent monthly fee is due on the same day of each month thereafter.",
      '4.2 Automatic payment. Client authorizes Axeon to charge the payment method on file (through Stripe or a successor processor) for all Fees and approved charges when due, and agrees to keep a valid payment method on file for the term of this Agreement.',
      "4.3 Ad spend. Advertising media costs (Google, Meta, and any other network) are separate from and in addition to the Fees, are paid by Client directly to the advertising platform using Client's own payment method, and are never refundable by Axeon. Axeon's management fee is not a percentage of or contingent on ad spend unless stated above.",
      "4.4 Late payment. Amounts not paid within five (5) days of the due date accrue a late fee of $35 or 1.5% per month, whichever is greater, to the extent permitted by law. If any amount is more than ten (10) days past due, Axeon may, on written notice, suspend the Services, take the website and any Axeon-hosted systems offline, and pause advertising until the account is current. Suspension does not relieve Client of its payment obligations, and the term is not extended by any suspension. Client is responsible for Axeon's reasonable costs of collection, including attorney's fees.",
      "4.5 Taxes. Fees exclude sales, use, and similar taxes. Client is responsible for any such taxes other than taxes on Axeon's income.",
      "4.6 Price changes. Axeon may change monthly Fees for any Renewal Term with at least thirty (30) days' written notice. Fees are fixed during the Initial Term and during any prepaid period.",
      '4.7 Chargebacks. Client agrees to raise any billing dispute with Axeon in writing within thirty (30) days of the charge and before initiating a chargeback. A chargeback initiated on a valid charge is a material breach of this Agreement.',
    ],
  },
  {
    heading: '5. 90-Day Customer Guarantee',
    paragraphs: [
      "5.1 The guarantee. For Clients on the AxeonCORE or AxeonGROWTH Plan only, if the total number of tracked phone calls and tracked form, chat, and booking submissions received through the Services (“Tracked Leads”) during the first ninety (90) days after launch (the “Guarantee Period”) is not greater than the Baseline, Axeon will continue providing the Services included in Client's Plan at no monthly charge until the month in which Tracked Leads exceed the Baseline (the “Remedy”).",
      '5.2 Baseline. The “Baseline” is the monthly volume of calls and leads Client was receiving before the Services, as recorded in writing by the Parties on the kickoff call and documented in AxeonPROOF. If Client cannot document prior volume, the Parties will agree on a reasonable Baseline in writing; absent agreement, the Baseline is zero. The Baseline is measured against the average monthly Tracked Leads over the Guarantee Period.',
      "5.3 Conditions. The guarantee applies only if, throughout the Guarantee Period, Client: (a) remains current on all Fees; (b) is on an eligible Plan; (c) has fulfilled its obligations under Section 3, including responding to new leads within one business day; (d) has not materially changed, taken offline, or interfered with the website, tracking numbers, forms, Google Business Profile, or automations provided by Axeon; (e) has not suspended its business operations or materially changed its services or service area; and (f) has not had its Google Business Profile or ad accounts suspended for reasons attributable to Client.",
      "5.4 Exclusive remedy. The Remedy is Client's sole and exclusive remedy for any shortfall in results. The guarantee is not a refund, does not entitle Client to terminate before the end of the Initial Term, and does not promise any specific ranking, position, traffic, revenue, number of booked jobs, or return on ad spend. Tracked Leads are measured solely by Axeon's tracking systems, whose records are presumed accurate.",
    ],
  },
  {
    heading: '6. Ownership and intellectual property',
    paragraphs: [
      "6.1 Client Materials. Client retains ownership of Client Materials and grants Axeon a non-exclusive, royalty-free license to use, reproduce, modify, and display them to perform the Services and as permitted by Section 6.5. Client represents that it owns or has the right to use all Client Materials and that they do not infringe any third party's rights.",
      "6.2 Deliverables. Upon Axeon's receipt of payment in full of all Fees due through the end of the Initial Term, Axeon assigns to Client all of Axeon's right, title, and interest in the custom website design, page copy, and site code written specifically for Client (the “Deliverables”), together with the design files. Until that time, Axeon owns the Deliverables and grants Client a limited license to use them solely for Client's business.",
      '6.3 Axeon Tools. Notwithstanding Section 6.2, Axeon retains all rights in its pre-existing and independently developed materials, including its templates, frameworks, component libraries, niche systems, prompts, automations, workflows, integrations, AxeonPROOF, dashboards, CRM pipelines, know-how, and any generic or reusable code (“Axeon Tools”). To the extent Axeon Tools are embedded in the Deliverables, Axeon grants Client a perpetual, non-exclusive, non-transferable license to use them as part of the Deliverables only. Client may not extract, resell, sublicense, or reuse Axeon Tools separately, and may not use them to provide services to third parties.',
      "6.4 Subscription systems. The lead system, call tracking numbers, AI chat, AI receptionist, missed-call text-back, automated follow-up, CRM pipeline, review automation, AxeonPROOF, and similar services (“Subscription Systems”) are provided as a service for the term of this Agreement, are not Deliverables, and cease on termination. Tracking phone numbers are owned or licensed by Axeon; Axeon will, on request and at Client's cost, make reasonable efforts to port a tracking number to Client at termination if the account is paid in full.",
      "6.5 Portfolio and publicity. Client grants Axeon the right to display the Deliverables, Client's name and logo, and non-confidential results (such as rankings and lead counts) in Axeon's portfolio, website, case studies, proposals, and marketing, and to include a small “Built by Axeon” credit in the website footer. Client may withdraw consent to future use by written notice, except for materials already published.",
      "6.6 Third-party components. Deliverables may include open-source software, stock assets, fonts, plugins, and third-party services licensed under their own terms, which Client accepts. Ongoing third-party subscription costs after termination are Client's responsibility.",
      "6.7 Domain and Google Business Profile. Client's domain name and Google Business Profile are and remain Client's property. Axeon will not register domains in its own name on Client's behalf unless Client requests it in writing, in which case Axeon will transfer the domain to Client at Client's request once the account is paid in full.",
    ],
  },
  {
    heading: '7. Hosting, security, and third-party platforms',
    paragraphs: [
      '7.1 Hosting. While this Agreement is in effect, Axeon will host the website on infrastructure Axeon selects and will use commercially reasonable efforts to keep it available, apply security updates, and maintain backups. Hosting is provided “as is” and uptime is not guaranteed; Axeon is not liable for outages caused by hosting providers, DNS, domain expiration, DDoS attacks, or Client actions.',
      "7.2 Third-party platforms. The Services depend on platforms Axeon does not control, including Google Search, Google Business Profile, Google Ads, Meta, AI search engines, telephony carriers, and payment processors. Axeon does not control and is not responsible for their algorithms, policies, pricing, account reviews, suspensions, outages, or changes, or for their effect on Client's results.",
      "7.3 Client credentials. Client is responsible for keeping its own credentials secure and for all activity under accounts Client controls. Client will promptly remove Axeon's access on termination.",
    ],
  },
  {
    heading: '8. Communications, data, and compliance',
    paragraphs: [
      "8.1 Messaging consent. Certain Subscription Systems send text messages, emails, and automated or AI-generated calls to Client's leads and customers on Client's behalf. These are sent as Client's agent, in Client's name. Client is solely responsible for obtaining and maintaining all consents required by law (including the TCPA, CAN-SPAM, state telemarketing laws, and carrier 10DLC registration requirements), for honoring opt-outs, and for the content of any scripts or messages Client approves or edits. Axeon will configure the systems with reasonable default consent language and opt-out handling, which Client agrees to review and approve.",
      "8.2 Reviews. Review requests will be sent only to Client's actual customers. Client will not ask Axeon to create, purchase, or incentivize reviews in violation of platform policies or the FTC's rules on consumer reviews, and Axeon may refuse any such request.",
      '8.3 Customer data. Lead and customer data collected through the Services (“Customer Data”) belongs to Client. Client grants Axeon a license to process Customer Data to perform the Services and to produce aggregated, de-identified analytics. Client is responsible for its own privacy policy and for complying with privacy laws applicable to its collection and use of Customer Data. Axeon will export Customer Data to Client in a standard format on request at termination, provided the account is paid in full.',
      "8.4 Industry rules. Client is responsible for ensuring that its advertising, claims, offers, and website content comply with laws and professional rules governing Client's industry (for example, legal, dental, financial, and real-estate advertising rules). Axeon relies on Client to identify and approve any regulated claims.",
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
      '10.1 By Client for convenience. Client may terminate this Agreement effective at the end of the Initial Term or any Renewal Term by giving written notice under Section 2.2. Client may not terminate for convenience during the Initial Term. If Client stops payment or abandons the project during the Initial Term, all remaining Fees for the Initial Term become immediately due.',
      "10.2 By either Party for cause. Either Party may terminate on written notice if the other materially breaches this Agreement and fails to cure within fifteen (15) days of written notice (five (5) days for non-payment). Axeon may terminate immediately if Client's account is more than thirty (30) days past due, if Client initiates a chargeback on a valid charge, if Client's business ceases operating, or if Client directs Axeon to do anything unlawful or in violation of platform policies.",
      "10.3 By Axeon for convenience. Axeon may terminate this Agreement for any reason on thirty (30) days' written notice, in which case Axeon will refund any prepaid Fees for periods after the termination date.",
      "10.4 Effect of termination. On termination: (a) all unpaid Fees through the end of the then-current term become due; (b) Subscription Systems, hosting, and Axeon access end on the termination date, and Client is responsible for arranging its own hosting; (c) if the account is paid in full, Axeon will provide Client's website files, design files, and Customer Data export within fifteen (15) business days of request, and will keep the site live for a transition period of up to thirty (30) days at Client's request; (d) if the account is not paid in full, Axeon may take the website offline and withhold Deliverables until payment; (e) Axeon has no obligation to transfer Axeon Tools or Subscription Systems; and (f) any Remedy under Section 5 ends. Refunds are not owed except as stated in Section 10.3.",
      '10.5 Survival. Sections 4, 5.4, 6, 8, 9, 10.4, 11, 12, and 13 survive termination.',
    ],
  },
  {
    heading: '11. Warranties and disclaimers',
    paragraphs: [
      "11.1 Axeon. Axeon warrants that it will perform the Services in a professional and workmanlike manner. Client's exclusive remedy for breach of this warranty is re-performance of the non-conforming Services, provided Client notifies Axeon in writing within thirty (30) days.",
      '11.2 Client. Client warrants that it has authority to enter this Agreement, that the person signing is authorized to bind Client, that Client Materials are accurate and lawful, and that Client holds all licenses required to offer its services.',
      "11.3 Disclaimer. Except as expressly stated in this Agreement, the Services, Deliverables, and Subscription Systems are provided “as is.” Axeon disclaims all other warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. Other than the remedy in Section 5, Axeon does not guarantee any search ranking, traffic level, number of leads, conversion rate, revenue, or return on investment, and Client acknowledges that results depend on factors outside Axeon's control, including Client's pricing, reputation, responsiveness, competition, and seasonality.",
    ],
  },
  {
    heading: '12. Limitation of liability and indemnification',
    paragraphs: [
      "12.1 Cap. To the fullest extent permitted by law, Axeon's total cumulative liability arising out of or related to this Agreement, under any theory, will not exceed the Fees actually paid by Client to Axeon in the three (3) months immediately before the event giving rise to the claim.",
      "12.2 Exclusion. In no event will Axeon be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages, or for lost profits, lost revenue, lost business, lost data, loss of goodwill, cost of substitute services, platform suspensions, or damages arising from Client's communications with its own customers, even if advised of the possibility of such damages.",
      "12.3 Indemnification by Client. Client will defend, indemnify, and hold harmless Axeon and its owners, employees, and contractors from and against all claims, damages, fines, penalties, and expenses (including reasonable attorney's fees) arising out of or related to: (a) Client Materials or any content, claims, or offers Client provides or approves; (b) Client's products, services, or business operations; (c) messages, calls, or communications sent to Client's leads or customers through the Services, including any alleged violation of the TCPA or similar laws; (d) Client's breach of this Agreement or of any law or platform policy; or (e) any dispute between Client and its customers.",
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
      "13.7 Entire agreement; amendments. This Agreement, including Schedule A, is the entire agreement between the Parties about its subject and supersedes all prior proposals, quotes, and communications. It may be amended only in a writing signed (including electronically) by both Parties. Axeon's website descriptions and marketing are for information only and are not part of this Agreement except as restated in Schedule A.",
      "13.8 Severability; waiver. If any provision is unenforceable, it will be enforced to the maximum extent permitted and the rest of the Agreement remains in effect. A Party's failure to enforce a provision is not a waiver of it.",
      "13.9 Electronic signatures; counterparts. This Agreement may be signed electronically and in counterparts, each of which is an original. Client's payment of the setup fee, click-through acceptance, or written acceptance by email also constitutes acceptance of this Agreement.",
    ],
  },
];

/** Schedule A: only the selected Plan's column is shown, as the template instructs. */
export const SCHEDULE_A: Record<OnboardingTier, { title: string; lead?: string; items: string[] }> = {
  essentials: {
    title: 'Essentials',
    items: [
      'Up to 4 custom mobile-first pages',
      'SEO, AEO & GEO setup',
      'Google Business Profile upkeep',
      'Quote form with instant lead alerts',
      'Hosting & security',
      '2 small edits / month',
      'Monthly calls & leads report by email',
      'Client owns site, code & design files (Sec. 6.2)',
      'No 90-day guarantee',
    ],
  },
  axeoncore: {
    title: 'AxeonCORE',
    lead: 'Everything in Essentials, plus:',
    items: [
      '5–7 conversion-focused pages',
      'AxeonPROOF live dashboard',
      '90-day customer guarantee (Sec. 5)',
      'Missed-call text-back',
      'Speed-to-lead call connect',
      'AI chat & online scheduling',
      'Automated SMS & email follow-up; CRM pipeline',
      'Call tracking numbers',
      'Review requests after each job',
      'Exit-intent offers',
      '5 edits / month',
    ],
  },
  axeongrowth: {
    title: 'AxeonGROWTH',
    lead: 'Everything in AxeonCORE, plus:',
    items: [
      'Google & Meta ads management (ad spend separate, Sec. 4.3)',
      'AI phone receptionist',
      'One half-day on-site video shoot: hero film, 3 vertical cuts, photo set',
      'AxeonPROOF ad reporting',
      'One new service page / month',
      'Full review campaigns',
      'Monthly strategy call',
      'Same-day priority support',
    ],
  },
};

export const SCHEDULE_A_DEFINITIONS = [
  "Definitions: A “small edit” is a text, image, or link change on an existing page taking 30 minutes or less. One “edit” is a single request of 30 minutes or less. A “page” is one URL on Client's site. Unused edits do not roll over. Design revisions before launch: up to two (2) rounds on the homepage mockup and one (1) round per additional page; further rounds are billed under Section 1.2.",
  "Launch: The Services “go live” on the date Client's domain first points to the Axeon-built website or, for Clients without a website component, the date the first Subscription System is activated.",
];

/** The add-ons the template lists, with their prices. */
export const AGREEMENT_ADD_ONS = [
  'Google & Meta Ads Management +$399/mo',
  'AI Phone Receptionist +$199/mo',
  'Extra Service Page +$450/page',
  'On-Site Videography +$1,500',
] as const;

/** Default fees per Plan, from /pricing. The admin can change them per agreement. */
export const PLAN_DEFAULT_FEES: Record<OnboardingTier, { setupCents: number; monthlyCents: number }> = {
  essentials: { setupCents: 9900, monthlyCents: 14900 },
  axeoncore: { setupCents: 9900, monthlyCents: 29900 },
  axeongrowth: { setupCents: 150000, monthlyCents: 99900 },
};

export const AXEON_ENTITY_OPTIONS = ['an Iowa limited liability company', 'a sole proprietorship'] as const;
export const ENTITY_TYPES = ['LLC', 'Corp', 'Sole Prop', 'Partnership', 'Other'] as const;
