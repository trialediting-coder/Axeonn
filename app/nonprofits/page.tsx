import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import {
  ArrowRight,
  Globe,
  Search,
  MapPin,
  HeartHandshake,
  ClipboardList,
  Languages,
  Stethoscope,
  Trees,
  Users,
} from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS } from '@/lib/seo';
import { HeroYouTube } from '@/components/nonprofits/HeroYouTube';

const PROGRAM_NAME = 'Axeon Groundwork Grant';
// Current seasonal group. Update both when a group closes (next: winter).
const GROUP_NAME = 'fall';
const GROUP_DEADLINE = 'October 31';
// Food Bank of Iowa's public BackPack Program b-roll; credited in the hero.
const HERO_VIDEO_ID = 'HiscjGeuNxc';

const GLANCE = [
  { label: 'Design and build', value: '$0' },
  { label: 'You cover', value: 'Basic hosting only' },
  { label: 'Ownership', value: 'Yours, 100%' },
  { label: `${GROUP_NAME[0].toUpperCase()}${GROUP_NAME.slice(1)} group closes`, value: GROUP_DEADLINE },
];

export const metadata = buildMetadata({
  path: '/nonprofits',
  title: 'Free Websites for Iowa Nonprofits | Axeon Groundwork Grant',
  description:
    'The Axeon Groundwork Grant gives Iowa nonprofits a free website, Google and AI search visibility, a Business Profile and donate pages. You only cover hosting.',
});

// No application form: an email or a call is all it takes.
const CONTACT_SUBJECT = `${PROGRAM_NAME}: our nonprofit`;
const CONTACT_BODY = ['Nonprofit name:', 'City:', 'Website (if any):'].join('\n\n');
const CONTACT_HREF = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;

const INCLUDED = [
  {
    icon: Globe,
    title: 'A real website',
    description:
      'Custom design, mobile-first, fast, and accessible. The same quality our paying clients get, not a stripped-down template.',
    short: 'Custom, mobile-first, fast and accessible. Not a template.',
  },
  {
    icon: Search,
    title: 'Found on Google and in AI answers',
    description:
      'Google and AI search set up from day one, so people find you on Google and when they ask ChatGPT, Perplexity, or Gemini for help nearby.',
    short: 'Set up from day one for Google, ChatGPT, Perplexity and Gemini.',
  },
  {
    icon: MapPin,
    title: 'Google Business Profile',
    description:
      'Set up or cleaned up with your hours, photos, services, and a review link, so you show up on Google Maps.',
    short: 'Hours, photos, services and a review link, on Google Maps.',
  },
  {
    icon: HeartHandshake,
    title: 'Donate and volunteer pages',
    description:
      'Clear paths to give and to help, connected to a free donation tool that your organization owns.',
    short: 'Connected to a free donation tool your organization owns.',
  },
  {
    icon: ClipboardList,
    title: 'Intake and sign-up forms',
    description: 'Volunteer sign-ups, client intake, and event RSVPs that land where your team will see them.',
    short: 'Volunteer sign-ups, client intake and event RSVPs.',
  },
  {
    icon: Languages,
    title: 'Translated pages',
    description:
      'Key pages in the languages your community speaks. First priority for immigrant- and refugee-serving organizations.',
    short: 'Key pages in your community’s languages.',
  },
];

const CAUSES = [
  {
    icon: Users,
    title: 'Immigrant and refugee',
    description: 'Resettlement agencies, ESL programs, legal aid, and cultural centers.',
  },
  {
    icon: Trees,
    title: 'Environment',
    description: 'Land trusts, trail and river cleanup groups, and conservation and parks groups.',
  },
  {
    icon: Stethoscope,
    title: 'Health',
    description: 'Free clinics, mental health groups, patient support, and health education.',
  },
];

const STEPS = [
  { title: 'Reach out', description: 'Email us or book a free call. No application, no forms.' },
  { title: 'Fit call', description: 'A short call to learn what you need and answer your questions.' },
  { title: 'Kickoff', description: 'You send your content and photos. We handle the rest.' },
  { title: 'Build and review', description: 'We build it, you review it, and we make your edits.' },
  { title: 'Launch', description: 'Your site and Google profile go live, and you get the keys.' },
];

const REQUIREMENTS = [
  'Based in Iowa, or serving Iowans as your main work',
  'A registered 501(c)(3), or a group with a fiscal sponsor',
  'One contact person who can answer questions and approve drafts',
  'You keep a small "Powered by Axeon" credit in your site footer',
];

const NONPROFIT_FAQ = [
  {
    question: 'Is it really free?',
    answer:
      'Yes. There is no charge for the design, the build, search setup, or your Google Business Profile. The only cost is basic hosting to keep your site online, passed through at cost with no markup.',
  },
  {
    question: 'Which nonprofits qualify?',
    answer:
      'Any nonprofit based in Iowa or mainly serving Iowans, as long as you are a registered 501(c)(3) or have a fiscal sponsor. Immigrant and refugee, environment, and health organizations go to the front of each group, but everyone is welcome.',
  },
  {
    question: 'Do we need to apply?',
    answer:
      'No. Send us an email or book a free call and tell us about your organization. That is it.',
  },
  {
    question: 'When would our site be built?',
    answer: `We build in seasonal groups so every site gets the same care as paid work. The ${GROUP_NAME} group closes ${GROUP_DEADLINE}. If you reach out after that, you join the next group.`,
  },
  {
    question: 'Who owns the website?',
    answer:
      'You do. Your domain is registered in your organization’s name, and you own your content and accounts. You are never locked in to us.',
  },
  {
    question: 'What is not included?',
    answer:
      'Custom apps, paid ad management, ongoing content writing, and photography are not part of the program. We are happy to point you to good options for any of those.',
  },
  {
    question: 'Why are you doing this?',
    answer:
      'Most small nonprofits cannot pay agency rates, so the people they serve cannot find them online. We are an Iowa studio, and this is how we give back to the state that supports us.',
  },
];

export default function NonprofitsPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <BreadcrumbJsonLd items={[{ name: 'Nonprofits', path: '/nonprofits' }]} />

      {/* Hero */}
      {/* Purpose: the offer (a free digital presence, you cover hosting), the deadline, and the two ways to reach us. */}
      <section className="relative w-full min-h-[85svh] sm:min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-14 sm:pt-32 sm:pb-24 bg-neutral-950 text-white overflow-hidden">
        {/* Background video: Food Bank of Iowa's public b-roll, embedded from YouTube (not rehosted). */}
        <HeroYouTube
          videoId={HERO_VIDEO_ID}
          title="Food Bank of Iowa volunteers packing BackPack Program food"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/80 to-neutral-950/40" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-neutral-950 to-transparent" />
        <a
          href={`https://www.youtube.com/watch?v=${HERO_VIDEO_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-2 absolute bottom-4 right-6 z-10 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          Video: Food Bank of Iowa
        </a>
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <p className="eyebrow eyebrow-dark mb-4">
            {PROGRAM_NAME}
          </p>
          <h1 className="text-[34px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] font-display mb-4 sm:mb-6">
            A Free Digital Presence for Iowa Nonprofits
          </h1>
          <p className="text-base sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-4 sm:mb-5">
            We build your website, get you found on Google and in AI search, and set up your Google Business
            Profile, for free. Seriously. The only thing you cover is basic hosting.
          </p>
          <p className="text-sm font-semibold text-blue-300 mb-6 sm:mb-8">
            The {GROUP_NAME} group closes {GROUP_DEADLINE}. No application needed.
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              href={CONTACT_HREF}
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Email Us About Your Nonprofit <ArrowRight size={18} />
            </a>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-bold text-base transition-colors"
            >
              Book a Fit Call
            </Link>
          </div>
        </div>
      </section>

      {/* At a glance */}
      {/* Purpose: the four terms at a glance: $0 build, hosting only, you own it, the deadline. */}
      <section className="w-full border-b border-neutral-200 bg-white px-6 sm:px-10 lg:px-16 xl:px-24">
        <dl className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-neutral-200 lg:divide-x">
          {GLANCE.map(({ label, value }) => (
            <div key={label} className="py-4 sm:py-7 lg:px-8 first:lg:pl-0">
              <dt className="eyebrow eyebrow-muted mb-1">{label}</dt>
              <dd className="text-lg sm:text-xl font-bold text-neutral-950">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Why: mission statement */}
      {/* Purpose: why we do this, in our own words. */}
      <section className="w-full lg:min-h-[100dvh] flex items-center py-10 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <figure className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-10 lg:col-start-2">
            <p className="eyebrow mb-3 sm:mb-6">WHY WE DO THIS</p>
            <span aria-hidden="true" className="hidden sm:block font-display text-8xl leading-none text-blue-600/25 -mb-6">
              &ldquo;
            </span>
            <blockquote className="space-y-3 sm:space-y-6">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug text-neutral-950">
                Iowa runs on people who show up for each other.
              </p>
              <p className="text-[15px] sm:text-lg text-neutral-700 leading-relaxed">
                You see it everywhere once you start looking. The food pantry that stays open late on a Tuesday.
                The free clinic that knows its patients by name. The volunteers pulling trash out of a river on a
                Saturday morning. The neighbors who help a new family figure out where to even begin. Most of that
                work happens quietly, carried by small teams who give far more than they ever get back.
              </p>
              <p className="text-[15px] sm:text-lg text-neutral-700 leading-relaxed">
                Those missions deserve to be found. But most small nonprofits cannot pay agency rates, so they get
                by with an outdated website or none at all, and the people who need them most never find them. That
                is a problem we know how to fix, so we are fixing it for free, for as many Iowa nonprofits as we
                can.
              </p>
              <p className="text-[15px] sm:text-lg text-neutral-950 font-semibold leading-relaxed">
                This state has given us a lot. This is one way we get to give some of it back.
              </p>
            </blockquote>
            <figcaption className="mt-4 sm:mt-8 flex items-center gap-4">
              <span aria-hidden="true" className="h-px w-10 bg-blue-600" />
              <span>
                <span className="block font-bold text-neutral-950">Axeon Studio</span>
                <span className="block text-sm text-neutral-500">West Des Moines, Iowa</span>
              </span>
            </figcaption>
          </div>
        </figure>
      </section>

      {/* What's included: one message -- the full paid build, free. */}
      {/* Purpose: the six things the free build includes (phones: one line each). */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-2 sm:mb-3">WHAT YOU GET</p>
            <h2 className="text-[28px] sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.08] sm:leading-[1.05]">
              The same build paying clients get, free.
            </h2>
            <p className="mt-2 sm:mt-5 text-[15px] sm:text-lg text-neutral-600 leading-relaxed">
              So donors, volunteers and the people you serve find you first. You own your domain, your content, and
              your accounts. You only cover basic hosting.
            </p>
          </div>
          <ul className="lg:col-span-7 divide-y divide-neutral-200 border-y border-neutral-200">
            {INCLUDED.map(({ icon: Icon, title, description, short }) => (
              <li key={title} className="flex gap-3 sm:gap-4 py-2.5 sm:py-5">
                <LineIcon className="text-base sm:text-lg leading-snug sm:leading-normal">
                  <Icon size={20} className="text-blue-600" />
                </LineIcon>
                <div>
                  <h3 className="text-base sm:text-lg font-bold leading-snug sm:leading-normal">{title}</h3>
                  <p className="sm:mt-1 text-sm sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{description}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Causes */}
      {/* Purpose: every Iowa nonprofit is welcome; three causes go to the front of each group. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 sm:mb-4">
            Open to Every Iowa Nonprofit
          </h2>
          <p className="text-[15px] sm:text-lg text-neutral-600 max-w-3xl mb-5 sm:mb-12 leading-relaxed">
            Any Iowa nonprofit is welcome. These three causes are personal to us, so they go to the front of
            each group.
          </p>
          <div className="grid md:grid-cols-3 gap-2.5 sm:gap-6">
            {CAUSES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3.5 md:block rounded-2xl sm:rounded-3xl border-2 border-blue-600/20 bg-blue-50/40 p-4 sm:p-8">
                <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center md:mb-5">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold sm:mb-2">{title}</h3>
                  <p className="text-[15px] sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deadline band */}
      {/* Purpose: the deadline for the current group, with the email CTA. */}
      <section className="w-full py-12 sm:py-16 px-4 sm:px-10 lg:px-16 xl:px-24 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="eyebrow eyebrow-onblue">
              {GROUP_NAME.toUpperCase()} GROUP
            </p>
            <p className="mt-2 text-3xl sm:text-5xl font-black font-display tracking-tight leading-tight">
              Applications close {GROUP_DEADLINE}.
            </p>
          </div>
          <a
            href={CONTACT_HREF}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-blue-50 text-blue-700 font-bold text-base transition-colors"
          >
            Email Us About Your Nonprofit <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* How it works + requirements */}
      {/* Purpose: the five steps from reaching out to launch, and who qualifies. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-5 sm:gap-12">
          <div className="lg:col-span-7">
            <h2 className="text-[28px] sm:text-4xl font-extrabold tracking-tight mb-3 sm:mb-10">How It Works</h2>
            <ol className="space-y-2.5 sm:space-y-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3.5 sm:gap-5">
                  <span className="flex-none w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white text-sm sm:text-base font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold leading-snug sm:leading-normal">{step.title}</h3>
                    <p className="text-sm sm:text-base text-neutral-300 leading-snug sm:leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl sm:rounded-3xl border border-neutral-700 p-4 sm:p-8">
              <h3 className="eyebrow eyebrow-dark mb-2.5 sm:mb-5">WHO QUALIFIES</h3>
              <ul className="space-y-1.5 sm:space-y-4">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm sm:text-base text-neutral-200 leading-snug sm:leading-relaxed">
                    <span className="mt-2 flex-none w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {/* Purpose: answer the common questions (cost, who qualifies, ownership). Collapsed so every question shows at once. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] sm:text-4xl font-extrabold tracking-tight mb-3 sm:mb-10">Questions Nonprofits Ask</h2>
          <FAQAccordion items={NONPROFIT_FAQ} />
        </div>
      </section>

      {/* CTA */}
      {/* Purpose: the closing ask: reach out by the deadline (email or fit call). */}
      <section className="w-full py-12 sm:py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="eyebrow eyebrow-dark mb-4">BUILT FOR IOWA</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Help the People You Serve Find You
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Reach out by {GROUP_DEADLINE} to join the {GROUP_NAME} group. We reply to everyone.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={CONTACT_HREF}
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
            >
              Email Us About Your Nonprofit
            </a>
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              Book a Fit Call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
