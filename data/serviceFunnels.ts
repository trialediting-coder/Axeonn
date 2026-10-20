// One funnel page per service × practice type: /marketing-solutions/{service}/{vertical}
// (owner, 2026-10-20: "Pages should act as individual service funnels. All
// tailored towards that vertical"). The six service pages link here from their
// per-practice section; each /solutions/{vertical} page links to its six.
//
// Rules: every line short (owner hates text blobs), written in that practice
// type's own words, unique per page (not a find-and-replace template). No
// invented clients, stats or results; never promise rankings, a Google badge or
// an outcome. Dental and med spa: no health information. Med spa: before-and-
// after only with signed consent. Law: attorney advertising rules, no
// "specialist"/"expert", no outcomes. Accounting: no tax advice.

import type { FaqItem } from '@/data/faqData';
import type { PracticeVertical } from '@/data/servicePages';

export type FunnelService = 'website' | 'seo' | 'lead-generation' | 'ai-chat-scheduling' | 'advertising' | 'video-photography';

export const FUNNEL_SERVICES: readonly FunnelService[] = [
  'website',
  'seo',
  'lead-generation',
  'ai-chat-scheduling',
  'advertising',
  'video-photography',
];
export const FUNNEL_VERTICALS: readonly PracticeVertical[] = ['dental', 'med-spa', 'law-firms', 'accounting'];

/** Short service names for eyebrows, titles and links. */
export const SERVICE_SHORT: Record<FunnelService, string> = {
  website: 'Websites',
  seo: 'Local SEO',
  'lead-generation': 'Lead generation & intake',
  'ai-chat-scheduling': 'AI chat & online booking',
  advertising: 'Google Ads & Local Services Ads',
  'video-photography': 'Photo & video',
};

export const VERTICAL_PLURAL: Record<PracticeVertical, string> = {
  dental: 'dental practices',
  'med-spa': 'med spas',
  'law-firms': 'law firms',
  accounting: 'accounting & CPA firms',
};

/** Title-case form for headings and breadcrumbs. */
export const VERTICAL_TITLE: Record<PracticeVertical, string> = {
  dental: 'Dental practices',
  'med-spa': 'Med spas',
  'law-firms': 'Law firms',
  accounting: 'Accounting & CPA firms',
};

/** Price chip and note per service, matching data/servicePages.ts. */
export const SERVICE_PRICE: Record<FunnelService, { line: string; note: string }> = {
  website: { line: 'Included in AxeonCORE · From $799/mo', note: "$0 to start. Nothing due until it's working." },
  seo: { line: 'Included in AxeonCORE · From $799/mo', note: "$0 to start. Nothing due until it's working." },
  'lead-generation': { line: 'Included in AxeonCORE · From $799/mo', note: "$0 to start. Nothing due until it's working." },
  'ai-chat-scheduling': { line: 'Included in AxeonCORE · From $799/mo', note: "$0 to start. Nothing due until it's working." },
  advertising: { line: 'AxeonGROWTH · From $1,999/mo + ad spend', note: 'or +$750/mo on AxeonCORE' },
  'video-photography': { line: 'Quarterly in AxeonGROWTH · From $1,999/mo', note: 'or a single on-site shoot for $1,500' },
};

/** What the "moment" block is called on each service. */
export const MOMENT_LABEL: Record<FunnelService, string> = {
  website: 'Who you are building for',
  seo: 'The search',
  'lead-generation': 'The moment',
  'ai-chat-scheduling': 'The question',
  advertising: 'Where ads start',
  'video-photography': 'Who you are shooting for',
};

export interface FunnelPage {
  service: FunnelService;
  vertical: PracticeVertical;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  sub: string;
  /** The real search, question or moment this page is about. */
  moment: string;
  /** Three things we do about it. */
  does: [string, string, string];
  /** Three short steps. */
  steps: [string, string, string];
  included: string[];
  faqs: FaqItem[];
}

type Draft = Omit<FunnelPage, 'service' | 'vertical' | 'metaTitle' | 'metaDescription'> & { metaTitle?: string; metaDescription?: string };

const q = (question: string, answer: string): FaqItem => ({ question, answer });

const DRAFTS: Record<FunnelService, Record<PracticeVertical, Draft>> = {
  website: {
    dental: {
      headline: 'A dental website that books new-patient exams.',
      sub: 'Built for the patient comparing three offices on their phone.',
      moment: 'A new patient comparing three offices on their phone during lunch.',
      does: [
        'New-patient, emergency and implant or cosmetic pages, each with a booking button',
        'Dentist and hygienist bios with credentials and real photos',
        'Insurance and payment explained as plain text, never a form that asks for it',
      ],
      steps: [
        'We review your site and the top 3 offices near you',
        'We write every page; you approve the words',
        'Live in 30 days, with exam booking on from day one',
      ],
      included: [
        'A page for new patients, emergencies, implants and cosmetic work',
        'New-patient exam booking on every page',
        'Dentist and hygienist bios with credentials',
        'Insurance and financing explained as plain text',
        'A reply to every form within 60 seconds, 24/7',
        'Hosting, security and monthly updates',
      ],
      faqs: [
        q('Can patients book an exam right on the site?', 'Yes. Every page has a booking button for new-patient exams, tied to the times you open. Emergencies get their own path.'),
        q('Will the site ask about insurance or symptoms?', 'No. Insurance is explained as plain text, and forms ask for name, contact and a preferred time only, so no health information is collected.'),
        q('Can you feature our hygienists and team?', 'Yes. Each dentist and hygienist can have a bio with credentials and real photos from your office.'),
      ],
    },
    'med-spa': {
      headline: 'A med spa website that books consultations, not just likes.',
      sub: 'For the person who found you on Instagram and wants to know who injects.',
      moment: 'Someone who saw you on Instagram and wants to know who does the injecting.',
      does: [
        'Treatment pages for injectables, laser and skin, each ending in a consultation booking',
        'Provider credentials and medical oversight stated plainly',
        'Memberships and packages laid out so the front desk gets fewer pricing calls',
      ],
      steps: [
        'We map every treatment you want more of',
        'We write and design; you and your medical director approve',
        'Live in 30 days, with consultation booking on',
      ],
      included: [
        'A page per treatment, named the way people search',
        'Consultation booking on every treatment page',
        'Injector and provider credentials up front',
        'Memberships and packages in plain view',
        'Before-and-after galleries only with signed consent',
        'Hosting, security and monthly updates',
      ],
      faqs: [
        q('Can we show before-and-after photos?', 'Yes, only with signed client consent on file, and with nothing that promises a result.'),
        q('Do clients book treatments or consultations?', 'Consultations first, so a provider sees every new client before any treatment is booked.'),
        q('Can we list prices?', 'Yes, if you want. Most spas list starting prices and memberships so the front desk gets fewer pricing calls.'),
      ],
    },
    'law-firms': {
      headline: 'A law firm website that turns late-night readers into consultations.',
      sub: 'For the person reading your site at 9 PM, deciding who to call.',
      moment: 'A potential client reading your site at 9 PM, deciding who to call in the morning.',
      does: [
        'Practice-area pages and attorney bios with bar admissions',
        'A consultation request that collects no case facts',
        'Copy written with attorney advertising rules in mind, approved by you',
      ],
      steps: [
        'We list the case types you take, and the ones you don’t',
        'We write practice-area pages; you approve every word',
        'Live in 30 days, with every request answered in 60 seconds',
      ],
      included: [
        'A page for each practice area you take',
        'Attorney bios with bar admissions',
        'A consultation request that asks for no case facts',
        'Disclaimers placed where your bar expects them',
        'A reply to every request within 60 seconds',
        'Hosting, security and monthly updates',
      ],
      faqs: [
        q('Does the site follow attorney advertising rules?', 'We write with Iowa’s rules in mind and you approve every page before launch. No “specialist” or “expert” claims, and nothing that implies an outcome.'),
        q('Will the form collect case details?', 'No. It asks for name, contact, practice area and a good time. Case facts wait for your conflict check and consultation.'),
        q('Can we stop getting calls for cases we don’t take?', 'Yes. Only the practice areas you approve get pages, so fewer wrong-fit calls come in.'),
      ],
    },
    accounting: {
      headline: 'A CPA firm website that books the right clients before tax season.',
      sub: 'Separate paths for individuals and businesses, with booking on both.',
      moment: 'A business owner looking for a new CPA before tax season.',
      does: [
        'Separate paths for individuals and businesses',
        'Tax-prep and advisory meetings booked online',
        'A clear link to the client portal you already use',
      ],
      steps: [
        'We sort your services into individual and business paths',
        'We write the pages; you approve every word',
        'Live in 30 days, ahead of your busy season if we start early',
      ],
      included: [
        'Separate pages for tax prep, bookkeeping and advisory',
        'Online booking for tax-prep and advisory meetings',
        'Intake cut-off dates shown during tax season',
        'A link to the client portal you already use',
        'A reply to every form within 60 seconds',
        'Hosting, security and monthly updates',
      ],
      faqs: [
        q('Will the site collect tax documents?', 'No. Documents go through the portal you already use. The site links to it and books meetings only.'),
        q('Can we stop taking new individual returns in March?', 'Yes. We update the cut-off on the site and the booking times the same day you tell us.'),
        q('Can business owners book advisory separately?', 'Yes. Advisory has its own page and booking, so it doesn’t get lost in tax-season traffic.'),
      ],
    },
  },
  seo: {
    dental: {
      headline: 'Show up when someone nearby needs a dentist.',
      sub: 'Google Maps and search, built around the procedures you want more of.',
      moment: 'Someone searching “emergency dentist near me” on a Saturday.',
      does: [
        'Pages for new patients, emergencies, implants and cosmetic work',
        'Google profile services and photos matched to those pages',
        'Recent reviews that mention the visit, not a pile from 2019',
      ],
      steps: [
        'We check where you rank against the top 3 nearby',
        'We fix your Google profile and build a page per procedure',
        'Review requests go out after every visit',
      ],
      included: [
        'Google Business Profile setup and upkeep',
        'A page per procedure, written the way patients search',
        'Emergency and weekend hours kept current',
        'Review requests after every completed appointment',
        'Call tracking for calls that came from Google',
        'Monthly report in AxeonPROOF',
      ],
      faqs: [
        q('Can you get us into the top 3 on Google Maps?', 'No one can promise a spot. We fix what Google weighs, your profile, pages, reviews and consistency, and report where you rank every month.'),
        q('Do review requests mention treatment?', 'No. They thank the patient for the visit and link to Google, with nothing about their care.'),
        q('How long until we see movement?', 'Map rankings usually take a few months. Your profile fixes and new pages go live in the first 30 days.'),
      ],
    },
    'med-spa': {
      headline: 'Be the spa that comes up when someone searches the treatment.',
      sub: 'A page per treatment, named the way people actually search.',
      moment: 'Someone searching “Botox West Des Moines” after a friend’s recommendation.',
      does: [
        'A page per treatment, named the way people search for it',
        'Provider credentials visible on the page and the profile',
        'Before-and-after photos only with signed client consent',
      ],
      steps: [
        'We find the treatment searches near you worth winning',
        'We build treatment pages and tune your Google profile',
        'Reviews keep coming in after every visit',
      ],
      included: [
        'Google Business Profile setup and upkeep',
        'A page per treatment, named the way people search',
        'Provider credentials on the page and the profile',
        'Fresh photos on your profile every month',
        'Review requests after every completed visit',
        'Monthly report in AxeonPROOF',
      ],
      faqs: [
        q('Should each treatment have its own page?', 'Yes. People search “lip filler” or “laser hair removal”, not “med spa”. A page per treatment is how you show up for each one.'),
        q('Can reviews mention treatments?', 'Clients can write what they like. Our requests never mention their treatment, and nothing is offered in exchange for a review.'),
        q('Does Instagram help on Google?', 'Indirectly. We reuse your best photos on your Google profile, where they count toward local search.'),
      ],
    },
    'law-firms': {
      headline: 'Be the firm Google shows when it matters.',
      sub: 'A page per practice area, found by people who need you now.',
      moment: 'Someone searching “estate planning attorney Des Moines” after a family change.',
      does: [
        'A page per practice area, written with advertising rules in mind',
        'Attorney bios that connect to each practice area',
        'Review requests sent in a way that fits your bar’s rules',
      ],
      steps: [
        'We check which practice-area searches you show up for',
        'We build pages and tune your Google profile',
        'Review requests go out with wording you approve',
      ],
      included: [
        'Google Business Profile setup and upkeep',
        'A page per practice area you take',
        'Attorney bios connected to each practice area',
        'Name, address and phone matched across directories',
        'Review requests that fit your bar’s rules',
        'Monthly report in AxeonPROOF',
      ],
      faqs: [
        q('Can you rank us for “best lawyer”?', 'We don’t promise rankings or use “best” or “specialist” claims. We build pages for the practice areas you take and track where they show up.'),
        q('Which directories matter for a law firm?', 'Google first, then the legal and general directories your clients use. We keep your details identical on all of them.'),
        q('Are we allowed to ask for reviews?', 'Generally yes, asked plainly and with no incentive. You approve the wording before anything goes out.'),
      ],
    },
    accounting: {
      headline: 'Be the CPA business owners find in January.',
      sub: 'Separate pages for tax, bookkeeping and advisory, timed to your season.',
      moment: 'A business owner searching “small business CPA Ankeny” in January.',
      does: [
        'Separate pages for tax prep, bookkeeping and advisory',
        'Tax-season hours kept current on the profile',
        'Reviews from clients who just finished their return',
      ],
      steps: [
        'We check what you rank for before tax season',
        'We build service pages and update your Google profile',
        'Review requests go out as returns are finished',
      ],
      included: [
        'Google Business Profile setup and upkeep',
        'Separate pages for tax prep, bookkeeping and advisory',
        'Tax-season hours kept current',
        'Pages for the towns your business clients are in',
        'Review requests timed to finished returns',
        'Monthly report in AxeonPROOF',
      ],
      faqs: [
        q('When should we start before tax season?', 'Fall is best. Pages and profile changes need a few months to settle before the January rush.'),
        q('Can we rank for advisory, not just tax prep?', 'Yes. Advisory gets its own page and profile service, so business owners who want more than a return can find you.'),
        q('Will our pages give tax advice?', 'No. Pages explain your services and who they’re for. Anything that reads as advice is yours to write or approve.'),
      ],
    },
  },
  'lead-generation': {
    dental: {
      headline: 'Every new-patient call answered, even at 7 PM.',
      sub: 'Missed calls get a text back in 60 seconds, so patients don’t call the next office.',
      moment: 'A toothache call at 7 PM on a Thursday.',
      does: [
        'A text back within 60 seconds with a link to book an emergency exam',
        'Your front desk sees the thread first thing in the morning',
        'No questions about symptoms or insurance in the reply',
      ],
      steps: [
        'A call goes unanswered',
        'A text from your number goes out within 60 seconds',
        'They book an exam, or the front desk picks it up in the morning',
      ],
      included: [
        'Missed-call text-back from your own number, 24/7',
        'An instant reply to every website form',
        'One inbox for texts, calls and forms',
        'New-patient exam booking in the reply',
        'Tracked numbers, so you see where calls came from',
        'No questions about symptoms or insurance',
      ],
      faqs: [
        q('Does the text sound like a robot?', 'No. We write it with you, in your office’s voice, and it comes from your number.'),
        q('Is this safe for patient privacy?', 'The texts never ask about symptoms, treatment or insurance, so no health information is collected. We sign a BAA if you want one.'),
        q('What does the front desk do differently?', 'Open the inbox at the start of the day, reply to anything waiting, and mark who booked.'),
      ],
    },
    'med-spa': {
      headline: 'Answer the 10 PM filler question before they find another spa.',
      sub: 'Every inquiry gets a reply in 60 seconds, with consultation times.',
      moment: 'A filler question sent through your site at 10 PM.',
      does: [
        'A reply with consultation times before they move on to the next spa',
        'Your coordinator picks it up in the text inbox the next day',
        'Past clients due for a touch-up get a check-in each quarter on AxeonGROWTH',
      ],
      steps: [
        'A form or call comes in after hours',
        'A reply with consultation times goes out within 60 seconds',
        'Your coordinator follows up from one inbox',
      ],
      included: [
        'An instant reply to every form and missed call',
        'Consultation times offered in the first reply',
        'One inbox for your coordinator',
        'Short follow-ups for people who don’t book',
        'Tracked sources, like Instagram or Google',
        'No medical advice in any reply',
      ],
      faqs: [
        q('Can the reply quote prices?', 'It can share your published starting prices. Anything specific goes to a consultation with a provider.'),
        q('What about people who never book?', 'They get a short follow-up you approve, then it stops. No endless texting.'),
        q('Does it work with Instagram?', 'Your bio link and site forms feed the same inbox, so nothing gets lost between apps.'),
      ],
    },
    'law-firms': {
      headline: 'Never lose a potential client to voicemail during a hearing.',
      sub: 'Every call gets a text back in 60 seconds, logged for intake.',
      moment: 'A call that comes in while you’re in a hearing.',
      does: [
        'A text back confirming the firm got the call and offering a consultation time',
        'No legal advice and no case facts collected',
        'Every call logged, so nobody falls through the cracks',
      ],
      steps: [
        'A call goes unanswered while you’re in court',
        'A text confirms you got it and offers a time',
        'Intake runs the conflict check and books',
      ],
      included: [
        'Missed-call text-back from the firm’s number, 24/7',
        'An instant reply to every consultation request',
        'Every call and form logged for intake',
        'A note that no attorney-client relationship exists yet',
        'No case facts collected by text',
        'Tracked numbers by source',
      ],
      faqs: [
        q('Does the text give legal advice?', 'Never. It confirms the firm received the call and offers a time to talk. Nothing about their matter.'),
        q('How does this fit our conflict check?', 'We collect names and contact details only. Your intake team runs conflicts before anyone discusses the case.'),
        q('What about urgent calls, like an arrest?', 'You choose which hours forward straight to an attorney’s cell. The rest get the text.'),
      ],
    },
    accounting: {
      headline: 'Answer every March call, even when the team is buried in returns.',
      sub: 'Missed calls get a text and a booking link, so clients don’t go elsewhere.',
      moment: 'Calls stacking up in March while the team is buried in returns.',
      does: [
        'Every missed call gets a text with a link to book a tax-prep appointment',
        'Your team answers in batches from one inbox',
        'Past clients get a note before the next season on AxeonGROWTH',
      ],
      steps: [
        'Calls pile up during tax season',
        'Each one gets a text with a booking link within 60 seconds',
        'Your team answers in batches from one inbox',
      ],
      included: [
        'Missed-call text-back from your number, 24/7',
        'Booking links for tax prep and advisory',
        'One inbox the whole team can work from',
        'Your intake cut-off in replies after the deadline',
        'Tracked numbers by source',
        'No documents or Social Security numbers by text',
      ],
      faqs: [
        q('Will clients send documents by text?', 'We ask them not to and point them to your portal. Replies never request documents or Social Security numbers.'),
        q('Can replies change after our intake cut-off?', 'Yes. After your date, the reply offers an extension appointment or a spot for next season.'),
        q('Does this help outside tax season?', 'Yes. Advisory and bookkeeping inquiries get the same 60-second reply all year.'),
      ],
    },
  },
  'ai-chat-scheduling': {
    dental: {
      headline: 'Let new patients book their own exam, any hour.',
      sub: 'A chat that answers your common questions and offers exam times.',
      moment: '“Are you taking new patients, and do you see kids?”',
      does: [
        'Answers from your approved list, then offers new-patient exam times',
        'Never asks about symptoms or insurance details',
        'Routes to the right dentist or hygienist schedule on AxeonGROWTH',
      ],
      steps: [
        'You approve the answers',
        'The chat answers and offers open exam times',
        'The booking lands on your calendar',
      ],
      included: [
        'A website chat trained on your approved answers',
        'New-patient exam booking inside the chat',
        'Answers on hours, location, kids and plans you accept',
        'A hand-off to your front desk for anything else',
        'No symptom or insurance-detail questions',
        'Transcripts in your inbox',
      ],
      faqs: [
        q('Can it say which insurance we take?', 'It can list the plans you accept. It never asks for a patient’s insurance details.'),
        q('What if someone describes an emergency?', 'It offers your emergency booking or your phone number. It doesn’t assess symptoms.'),
        q('Does it replace the front desk?', 'No. It handles after-hours and repeat questions, so the front desk gets bookings instead of busywork.'),
      ],
    },
    'med-spa': {
      headline: 'Book consultations at 11 PM, while they’re still deciding.',
      sub: 'A chat that explains your treatments and books the consult, not the treatment.',
      moment: '“How long does a lip filler consultation take?”',
      does: [
        'Explains what the consultation covers, in your words',
        'Books the consultation, so a provider sees them first',
        'No medical advice, ever',
      ],
      steps: [
        'You approve treatment answers and policies',
        'The chat answers and offers consultation times',
        'A provider sees every new client first',
      ],
      included: [
        'A chat trained on your treatments and policies',
        'Consultation booking inside the chat',
        'Answers on memberships and packages',
        'A hand-off to your coordinator',
        'No medical advice, ever',
        'Transcripts in your inbox',
      ],
      faqs: [
        q('Can it say whether a treatment is right for someone?', 'No. It explains what the consultation covers and books it. Whether a treatment fits is a provider’s call.'),
        q('Can it book Botox directly?', 'New clients book a consultation first. You decide whether existing clients can book treatments.'),
        q('Does it mention prices?', 'Only the prices you approve, like starting prices and memberships.'),
      ],
    },
    'law-firms': {
      headline: 'Answer “do you handle this?” at midnight, and book the consultation.',
      sub: 'A chat that confirms your practice areas and books a time, with no case facts.',
      moment: '“Do you handle custody cases in Polk County?”',
      does: [
        'Confirms the practice areas you approved and offers a consultation',
        'Collects no case facts and gives no legal advice',
        'A clear note that no attorney-client relationship exists yet',
      ],
      steps: [
        'You approve practice areas and wording',
        'The chat confirms fit and offers consultation times',
        'Intake runs conflicts before the meeting',
      ],
      included: [
        'A chat trained on the practice areas you take',
        'Consultation booking inside the chat',
        'The counties and courts you cover',
        'A plain no-attorney-client-relationship note',
        'No legal advice and no case facts',
        'Transcripts logged for intake',
      ],
      faqs: [
        q('Could the chat create an attorney-client relationship?', 'It says plainly that it doesn’t, gives no advice and collects no case facts. You approve the wording.'),
        q('What if they ask about a case type we don’t take?', 'It says so politely and, if you like, points them to the bar’s lawyer referral service.'),
        q('Can it screen inquiries?', 'Only on what you approve, like practice area and county. Anything about the facts waits for the consultation.'),
      ],
    },
    accounting: {
      headline: 'Book tax-prep and advisory meetings without a phone call.',
      sub: 'A chat that knows your deadlines and books the right meeting.',
      moment: '“Can I still get my return done before April 15?”',
      does: [
        'Shares your intake cut-off dates and books a tax-prep appointment',
        'Points business owners to an advisory meeting',
        'No documents or Social Security numbers through the chat',
      ],
      steps: [
        'You approve answers, deadlines and services',
        'The chat books the right meeting type',
        'Your team sees the booking and transcript',
      ],
      included: [
        'A chat trained on your services and deadlines',
        'Separate booking for tax prep and advisory',
        'Your intake cut-off dates, every season',
        'A hand-off to your team for anything specific',
        'No documents or Social Security numbers in chat',
        'Transcripts in your inbox',
      ],
      faqs: [
        q('Will it answer tax questions?', 'No. It explains your services and deadlines and books a meeting. Tax questions go to your team.'),
        q('Can it handle extensions?', 'It can book an extension appointment once your cut-off passes, using the wording you approve.'),
        q('Can clients upload documents in the chat?', 'No. It points them to your secure portal.'),
      ],
    },
  },
  advertising: {
    dental: {
      headline: 'Ads that fill the schedule with new-patient exams.',
      sub: 'Local Services and search ads aimed at the procedures you want booked.',
      moment: 'Local Services Ads for “dentist near me”, plus search ads for implants or emergencies.',
      does: [
        'Budget pointed at the procedures you want on the schedule',
        'Every ad call answered or texted back within 60 seconds',
        'Booked new-patient exams counted in AxeonPROOF',
      ],
      steps: [
        'We pick the procedures worth paying for',
        'Ads go live, with every call answered in 60 seconds',
        'You see booked exams per dollar in AxeonPROOF',
      ],
      included: [
        'Google Local Services Ads setup and management',
        'Search ads for implants, emergencies or cosmetic work',
        'Call tracking on every ad',
        'A 60-second reply to every ad call and form',
        'Booked exams counted, not just clicks',
        'No markup on ad spend',
      ],
      faqs: [
        q('Can you get us the Google badge?', 'Google decides that after its own screening, so we never promise it. We prepare everything it asks for.'),
        q('How much should we spend?', 'The minimum is $500/mo, paid to Google. We start where the procedures you want are searched most.'),
        q('How do we know the ads work?', 'AxeonPROOF shows calls, forms and booked exams by ad, so you see what each booked exam cost.'),
      ],
    },
    'med-spa': {
      headline: 'Ads for the treatments you want to grow, measured in consultations.',
      sub: 'Search ads that land on a treatment page with consultation booking.',
      moment: 'Search ads for the treatments you want to grow, like injectables or laser.',
      does: [
        'Ads that lead to a treatment page with consultation booking',
        'Ad copy that stays within Google’s health-care ad policies',
        'Consultations booked, not just clicks, in your report',
      ],
      steps: [
        'We pick the treatments with room to grow',
        'Ads land on that treatment’s page, with booking',
        'You see consultations per dollar, not clicks',
      ],
      included: [
        'Search ads per treatment',
        'Landing on the treatment page, with booking',
        'Copy within Google’s health-care ad policies',
        'A 60-second reply to every ad inquiry',
        'Consultations counted in AxeonPROOF',
        'No markup on ad spend',
      ],
      faqs: [
        q('Can we advertise Botox on Google?', 'Google restricts ads for prescription treatments. We write within its policies, usually advertising the consultation rather than the product.'),
        q('Do you run Instagram ads too?', 'Google search and Local Services Ads come first. Meta ads are available on AxeonGROWTH.'),
        q('What counts as a result?', 'A booked consultation, tracked from the ad to your calendar.'),
      ],
    },
    'law-firms': {
      headline: 'Ads that end in a case review, not a click.',
      sub: 'Local Services and search ads only for the case types you take.',
      moment: 'Local Services Ads for your practice areas, where Google offers them.',
      does: [
        'Ads only for the case types you take',
        'Every ad call logged, so intake never loses one',
        'Ad copy written with attorney advertising rules in mind',
      ],
      steps: [
        'We pick the practice areas worth advertising',
        'Ads run, with every call logged for intake',
        'You see consultations per dollar in AxeonPROOF',
      ],
      included: [
        'Local Services Ads where Google offers your practice areas',
        'Search ads for the case types you take',
        'Every ad call logged and answered',
        'Copy written with advertising rules in mind',
        'Consultations counted, not clicks',
        'No markup on ad spend',
      ],
      faqs: [
        q('Aren’t legal ads expensive?', 'Some case types cost more per click. We start where your cost per consultation makes sense and show it every month.'),
        q('Do Local Services Ads cover our practice area?', 'Google offers them for many areas, not all. We check yours before spending anything.'),
        q('Who approves the ad copy?', 'You do. Every ad is written with advertising rules in mind, and nothing implies an outcome.'),
      ],
    },
    accounting: {
      headline: 'Ads timed to the weeks people look for a CPA.',
      sub: 'Tax and advisory campaigns that run when searches peak.',
      moment: 'Local Services Ads for tax services and search ads before tax season.',
      does: [
        'Campaigns timed to when people look for a CPA',
        'Calls answered even when the team is buried in returns',
        'Advisory meetings tracked separately from tax prep',
      ],
      steps: [
        'We plan campaigns around your season',
        'Ads run, with every call answered even in March',
        'You see tax and advisory meetings separately',
      ],
      included: [
        'Local Services Ads for tax services',
        'Search ads timed to tax season',
        'Advisory campaigns for business owners',
        'A 60-second reply to every ad call',
        'Tax and advisory meetings counted separately',
        'No markup on ad spend',
      ],
      faqs: [
        q('Should ads run all year?', 'Tax campaigns run in season. Advisory and bookkeeping can run year-round on a smaller budget.'),
        q('Will ads bring in clients we can’t take in March?', 'We pause or narrow campaigns at your intake cut-off, the same day you tell us.'),
        q('How do we measure it?', 'Meetings booked per dollar, split by tax prep and advisory, in AxeonPROOF.'),
      ],
    },
  },
  'video-photography': {
    dental: {
      headline: 'Photos that put a nervous patient at ease before they call.',
      sub: 'Your real dentists, hygienists and rooms, not stock models in scrubs.',
      moment: 'A nervous patient deciding whether your office feels calm.',
      does: [
        'Dentists and hygienists, not stock models in scrubs',
        'Rooms and equipment, with no screens or charts in frame',
        'Before-and-after photos only with signed patient consent',
      ],
      steps: [
        'We plan a shot list around your team and rooms',
        'One on-site shoot, scheduled around patients',
        'Photos and clips go on your site and Google profile',
      ],
      included: [
        'Dentist and hygienist portraits',
        'Office and treatment-room photos',
        'Short intro clips for the website',
        'New photos on your Google profile',
        'No screens, charts or patients without consent',
        'Before-and-after photos only with signed consent',
      ],
      faqs: [
        q('Will patients be in the photos?', 'Only with written consent. Most shoots use your team and empty rooms.'),
        q('Do you shoot during patient hours?', 'We work around your schedule, usually early, late or a blocked hour, and keep charts and screens out of frame.'),
        q('How often do we need new photos?', 'Quarterly on AxeonGROWTH keeps new team members current. A single shoot is $1,500.'),
      ],
    },
    'med-spa': {
      headline: 'Show the injector and the room the right way.',
      sub: 'Real providers and treatment rooms, with consent for every client shot.',
      moment: 'Someone choosing between two spas with similar prices.',
      does: [
        'Providers at work and the treatment rooms people will sit in',
        'Short reels explaining a treatment in your provider’s words',
        'Client photos and videos only with written consent',
      ],
      steps: [
        'We plan shots for the treatments you’re growing',
        'An on-site shoot with your providers',
        'Reels and photos go to your site, profile and Instagram',
      ],
      included: [
        'Provider portraits and at-work photos',
        'Treatment-room photos',
        'Short reels explaining a treatment',
        'Photos for your Google profile and Instagram',
        'Client photos only with written consent',
        'Nothing that promises a result',
      ],
      faqs: [
        q('Can you film a treatment?', 'Yes, with the client’s written consent and your provider’s approval, and nothing that promises a result.'),
        q('Do the reels work on Instagram and the site?', 'Yes. We cut vertical versions for social and wide ones for your site.'),
        q('How often should we shoot?', 'Quarterly on AxeonGROWTH keeps new treatments and providers current.'),
      ],
    },
    'law-firms': {
      headline: 'Let them meet the attorney before they call.',
      sub: 'Headshots and short intro videos, by practice area.',
      moment: 'Someone who wants to see the attorney before they call.',
      does: [
        'Attorney headshots and a short intro video per practice area',
        'Office photos that show where a consultation happens',
        'Nothing that implies an outcome, in line with advertising rules',
      ],
      steps: [
        'We plan a short script per practice area with you',
        'One on-site shoot at your office',
        'Videos go on each practice-area page and your profile',
      ],
      included: [
        'Attorney headshots',
        'A short intro video per practice area',
        'Office and conference-room photos',
        'New photos on your Google profile',
        'Scripts you approve, with nothing implying outcomes',
        'No client files or screens in frame',
      ],
      faqs: [
        q('Are attorney videos allowed?', 'Generally yes. Scripts stay factual with no outcome claims, and you approve every word.'),
        q('Can we feature client testimonials?', 'Only where your bar’s rules allow it, with written consent. Many firms skip them.'),
        q('How long are the videos?', 'Usually 30 to 60 seconds: who you are, what you handle, and what the first meeting looks like.'),
      ],
    },
    accounting: {
      headline: 'Show business owners who will actually do the work.',
      sub: 'Your CPAs and staff, photographed at the firm.',
      moment: 'A business owner who wants to know who will actually do the work.',
      does: [
        'CPAs and staff photographed at the firm',
        'A short video on how you work with business clients',
        'No client documents or screens in any shot',
      ],
      steps: [
        'We plan shots of the team and how you work',
        'One on-site shoot, outside your busiest weeks',
        'Photos and video go on your site and profile',
      ],
      included: [
        'CPA and staff portraits',
        'Office photos',
        'A short video on how you work with business clients',
        'New photos on your Google profile',
        'No client documents or screens in any shot',
        'Scheduled outside tax season',
      ],
      faqs: [
        q('When should we shoot?', 'Outside tax season. Late spring or fall works best for most firms.'),
        q('Will client information show up?', 'No. Desks are cleared and screens are off or out of frame.'),
        q('Do we need video?', 'One short video helps business owners see how you work. Photos alone are fine to start.'),
      ],
    },
  },
};

// Titles lead with the phrase people actually search (Semrush US, 2026-10-20:
// "dental website design" 2.9K, "dental seo marketing" 3.6K, "law firm marketing"
// 8.1K, "med spa marketing agency" 1.3K, "cpa firm marketing" 1.3K), e.g.
// "Dental Website Design for Iowa Practices | Axeon Studio".
const META_SERVICE: Record<FunnelService, string> = {
  website: 'Website Design',
  seo: 'SEO',
  'lead-generation': 'Lead Generation',
  'ai-chat-scheduling': 'AI Chat & Online Booking',
  advertising: 'Google Ads',
  'video-photography': 'Photography & Video',
};

const META_VERTICAL: Record<PracticeVertical, string> = {
  dental: 'Dental',
  'med-spa': 'Med Spa',
  'law-firms': 'Law Firm',
  accounting: 'CPA',
};

const META_AUDIENCE: Record<PracticeVertical, string> = {
  dental: 'Iowa Practices',
  'med-spa': 'Iowa Med Spas',
  'law-firms': 'Iowa Firms',
  accounting: 'Iowa Firms',
};

function build(service: FunnelService, vertical: PracticeVertical): FunnelPage {
  const d = DRAFTS[service][vertical];
  const metaTitle = d.metaTitle ?? `${META_VERTICAL[vertical]} ${META_SERVICE[service]} for ${META_AUDIENCE[vertical]} | Axeon Studio`;
  const desc = `${d.headline} ${d.sub} Des Moines and Iowa.`;
  return { service, vertical, ...d, metaTitle, metaDescription: d.metaDescription ?? desc };
}

export const funnelPages: FunnelPage[] = FUNNEL_SERVICES.flatMap((s) => FUNNEL_VERTICALS.map((v) => build(s, v)));

export const funnelPath = (service: FunnelService, vertical: PracticeVertical) => `/marketing-solutions/${service}/${vertical}`;

export const funnelFor = (service: string, vertical: string): FunnelPage | undefined =>
  funnelPages.find((p) => p.service === service && p.vertical === vertical);

export const isFunnelService = (s: string): s is FunnelService => (FUNNEL_SERVICES as readonly string[]).includes(s);
