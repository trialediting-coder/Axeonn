export interface WhoWeHelpNicheItem {
  label: string;
  href: string;
}

export interface WhoWeHelpEntry {
  id: string;
  label: string;
  tag?: string;
  description?: string;
  metric?: string;
  image: string;
  video: string;
  href?: string;
  niches?: WhoWeHelpNicheItem[];
}

export const whoWeHelpEntries: WhoWeHelpEntry[] = [
  {
    id: 'home-services',
    label: 'Home Services',
    tag: 'Instant Dispatch & Estimating',
    description: 'HVAC, roofing, remodeling, landscaping, and auto detailing businesses requiring instant lead capture and multi-step intake questionnaires.',
    metric: 'Sub-Minute Response',
    image: '/who-we-help/home-services.jpg',
    video: '/videos/industries/home-services.mp4',
    niches: [
      { label: 'HVAC', href: '/solutions/hvac' },
      { label: 'Roofing', href: '/solutions/roofing' },
      { label: 'Home Remodeling', href: '/solutions/home-remodeling' },
      { label: 'Landscaping', href: '/solutions/landscaping' },
      { label: 'Auto Detailing', href: '/solutions/auto-detailing' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    tag: 'Case Intake & Practice Routing',
    description: 'Litigation, injury, defense, and estate planning law firms needing instant client qualification, conflict triage, and automated consultation scheduling.',
    metric: 'Zero Missed Retainers',
    image: '/who-we-help/legal.jpg',
    video: '/videos/industries/legal.mp4',
    href: '/solutions/law-firms',
  },
  {
    id: 'financial',
    label: 'Financial',
    tag: 'Advisory Triage & Client Onboarding',
    description: 'Accounting firms and CPAs needing lead triage to separate routine tax inquiries from high-ticket advisory retainers.',
    metric: 'High-Value Pipeline',
    image: '/who-we-help/financial.jpg',
    video: '/videos/industries/financial.mp4',
    href: '/solutions/accounting',
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    tag: 'Buyer & Seller Pipeline Separation',
    description: 'Agents, teams, and brokerages needing automated valuation funnels, showing schedulers, and lead nurture workflows.',
    metric: 'Instant Speed-to-Lead',
    image: '/who-we-help/real-estate.jpg',
    video: '/videos/industries/real-estate.mp4',
    href: '/solutions/real-estate',
  },
  {
    id: 'dental',
    label: 'Dental',
    tag: 'Patient Intake & Booking Flows',
    description: 'Dental practices needing treatment-specific consult funnels, hygiene recall automation, and instant emergency triage.',
    metric: 'Full Chairtime Slots',
    image: '/who-we-help/dental.jpg',
    video: '/videos/industries/dental.mp4',
    href: '/solutions/dental',
  },
  {
    id: 'small-business',
    label: 'Small Business',
    tag: 'All-in-One Revenue Engine',
    description: 'Custom websites, automated CRM pipelines, and AI receptionists built for growing local small businesses.',
    metric: 'Built For Growth',
    image: '/who-we-help/small-business.jpg',
    video: '/videos/industries/small-business.mp4',
    // Matches the destination already used for "Small Business" in the
    // Header's Who We Help mega-menu, for consistency.
    href: '/solutions#small-business',
  },
];

// Default idle reel shown before any item is hovered
export const whoWeHelpHeroVideo = '/videos/industries/default.mp4';
export const whoWeHelpHeroImage = '/who-we-help/hero.jpg';
