export interface WorkProject {
  name: string;
  industry: string;
  location: string;
  summary: string;
  image: string;
  url: string;
  // Matches a slug in data/nichesData.ts so the project also shows on that industry page.
  niche: string;
  // Self-initiated redesigns, not paid engagements.
  concept?: boolean;
  // Month the site was built, shown on every card.
  date: string;
  // Pinned projects always lead the list (owner rule: MSH is always first).
  pinned?: boolean;
}

const PROJECTS: WorkProject[] = [
  {
    name: 'MSH Realty Group',
    date: 'Oct 2026',
    pinned: true,
    niche: 'real-estate',
    industry: 'Real Estate Investment',
    location: 'Iowa',
    summary:
      'The site for our own Iowa real estate investment group: a cinematic aerial hero, an editorial serif design, and an animated walkthrough of its AI underwriting engine.',
    image: '/images/work/msh.webp',
    url: 'https://msh-realty-group.vercel.app/',
  },
  {
    name: 'A-1 Auto Detailing',
    date: 'Sep 2026',
    niche: 'auto-detailing',
    industry: 'Auto Detailing',
    location: 'Pleasant Hill, IA',
    summary:
      'A full rebuild with service pages, before-and-after galleries, live Google reviews and tap-to-call quoting, plus 301s for every old URL so nothing was lost in search.',
    image: '/images/work/a1.webp',
    url: 'https://a1-auto-detailing-six.vercel.app/',
  },
  {
    name: 'Kaufman Construction',
    date: 'Sep 2026',
    niche: 'home-remodeling',
    industry: 'Design-Build Remodeling',
    location: 'West Des Moines, IA',
    summary:
      'An editorial homepage for a design-build remodeler, with a "Which path fits your project?" selector that sorts visitors into the right service tier before they ever fill out a form.',
    image: '/images/work/kaufman.webp',
    url: 'https://kaufman-construction.vercel.app/',
    concept: true,
  },
  {
    name: 'Hintz Family Dentistry',
    date: 'Sep 2026',
    niche: 'dental',
    industry: 'Family Dentistry',
    location: 'Ankeny, IA',
    summary:
      'A warm, family-first site with a full Spanish version and an insurance checker that answers the Medicaid and Hawk-I question in one tap.',
    image: '/images/work/hintz.webp',
    url: 'https://hintz-family-dentistry.vercel.app/',
    concept: true,
  },
  {
    name: 'Select Construction & Remodeling',
    date: 'Sep 2026',
    niche: 'home-remodeling',
    industry: 'Home Remodeling',
    location: 'Des Moines, IA & Boise, ID',
    summary:
      'A clean, gallery-style site for a two-state remodeler, with an office switcher that swaps the phone number and quote form between Des Moines and Boise.',
    image: '/images/work/select.webp',
    url: 'https://select-construction.vercel.app/',
    concept: true,
  },
  {
    name: 'Stumptown Detailing',
    date: 'Oct 2026',
    niche: 'auto-detailing',
    industry: 'Luxury Auto Detailing',
    location: 'Whitefish, MT',
    summary:
      'A cinematic, video-led site for a high-end detailer, with an animated logo intro and a mobile hero cut from the shop’s own footage.',
    image: '/images/work/stumptown.webp',
    url: 'https://stumptown-detailing.vercel.app/',
    concept: true,
  },
];

// Stable sort: pinned first, everything else keeps its order.
export const WORK_PROJECTS: WorkProject[] = [
  ...PROJECTS.filter((p) => p.pinned),
  ...PROJECTS.filter((p) => !p.pinned),
];

export const projectsForNiche = (slug: string) => WORK_PROJECTS.filter((p) => p.niche === slug);
