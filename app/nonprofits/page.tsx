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

const PROGRAM_NAME = 'Axeon Groundwork Grant';
// Current seasonal group. Update both when a group closes (next: winter).
const GROUP_NAME = 'fall';
const GROUP_DEADLINE = 'October 31';

export const metadata = buildMetadata({
  path: '/nonprofits',
  title: 'Axeon Groundwork Grant: Free Websites for Iowa Nonprofits | Axeon Studio',
  description:
    'The Axeon Groundwork Grant gives Iowa nonprofits a full digital presence for free: website, Google and AI search visibility, Google Business Profile, and donate and volunteer pages. You only cover basic hosting.',
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
  },
  {
    icon: Search,
    title: 'Found on Google and in AI answers',
    description:
      'SEO, AEO, and GEO set up from day one, so people find you on Google and when they ask ChatGPT, Perplexity, or Gemini for help nearby.',
  },
  {
    icon: MapPin,
    title: 'Google Business Profile',
    description:
      'Set up or cleaned up with your hours, photos, services, and a review link, so you show up on Google Maps.',
  },
  {
    icon: HeartHandshake,
    title: 'Donate and volunteer pages',
    description:
      'Clear paths to give and to help, connected to a free donation tool that your organization owns.',
  },
  {
    icon: ClipboardList,
    title: 'Intake and sign-up forms',
    description: 'Volunteer sign-ups, client intake, and event RSVPs that land where your team will see them.',
  },
  {
    icon: Languages,
    title: 'Translated pages',
    description:
      'Key pages in the languages your community speaks. First priority for immigrant- and refugee-serving organizations.',
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
  { title: 'Reach out', description: 'Email us or book a call. No application, no forms.' },
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
      'No. Send us an email or book a call and tell us about your organization. That is it.',
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
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-36 pb-20 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4 inline-flex items-center gap-2">
            <HeartHandshake size={15} /> {PROGRAM_NAME}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] font-display mb-6">
            A Free Digital Presence for Iowa Nonprofits
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-5">
            We build your website, get you found on Google and in AI search, and set up your Google Business
            Profile, for free. Seriously. The only thing you cover is basic hosting.
          </p>
          <p className="text-sm font-semibold text-blue-300 mb-8">
            The {GROUP_NAME} group closes {GROUP_DEADLINE}. No application needed.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={CONTACT_HREF}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Email Us About Your Nonprofit <ArrowRight size={18} />
            </a>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-bold text-base transition-colors"
            >
              Book a Fit Call
            </Link>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-8">Why We Do This</h2>
          <div className="space-y-5 text-lg text-neutral-700 leading-relaxed">
            <p>
              I volunteered in a hospital and was part of several health clubs in school. I have seen how much a
              clinic or health group depends on people finding it at the right moment.
            </p>
            <p>
              I love hiking, and I care about keeping the places I hike clean. The groups that protect Iowa’s
              land and rivers do that work on tiny budgets.
            </p>
            <p>
              And I am an immigrant myself. I know what it is like to search for help in a new place, often in a
              second language.
            </p>
            <p>
              Most small nonprofits cannot pay agency rates, so they end up with an outdated site or none at all,
              and the people they serve cannot find them. We can fix that.
            </p>
            <p className="font-semibold text-neutral-950">Hayder Hatem, Founder, Axeon Studio</p>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">What You Get</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-12 leading-relaxed">
            The same build our paying clients get. You own your domain, your content, and your accounts.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INCLUDED.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-neutral-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Causes */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Open to Every Iowa Nonprofit
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-12 leading-relaxed">
            Any Iowa nonprofit is welcome. These three causes are personal to us, so they go to the front of
            each group.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {CAUSES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl border-2 border-blue-600/20 bg-blue-50/40 p-8">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-neutral-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works + requirements */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">How It Works</h2>
            <ol className="space-y-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-5">
                  <span className="flex-none w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="text-neutral-300 leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-neutral-700 p-8">
              <h3 className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-5">Who Qualifies</h3>
              <ul className="space-y-4">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="flex gap-3 text-neutral-200 leading-relaxed">
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
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">Questions Nonprofits Ask</h2>
          <FAQAccordion items={NONPROFIT_FAQ} defaultOpenCount={1} />
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">Built for Iowa</p>
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
