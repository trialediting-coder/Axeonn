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
  /** Optional: entries without a clip of their own show their still image. */
  video?: string;
  href?: string;
  niches?: WhoWeHelpNicheItem[];
}

// The four practice types (owner decision 2026-10-19). Each links to its
// /solutions page. Images and clips are real, licensed industry footage.
export const whoWeHelpEntries: WhoWeHelpEntry[] = [
  {
    id: 'dental',
    label: 'Dental',
    tag: 'New-Patient Intake & Consult Booking',
    description: 'New-patient exams and implant or Invisalign consults answered within 60 seconds, day or night.',
    metric: '60-Second Replies',
    image: '/who-we-help/dental.jpg',
    video: '/videos/industries/dental.mp4',
    href: '/solutions/dental',
  },
  {
    id: 'med-spa',
    label: 'Med Spa',
    tag: 'Consults, Treatment Plans & Memberships',
    description: 'Consult requests answered at 10 PM and booked before they shop around.',
    metric: 'Consults Booked',
    image: '/who-we-help/med-spa.webp',
    href: '/solutions/med-spa',
  },
  {
    id: 'legal',
    label: 'Law Firms',
    tag: 'Intake Calls & Consultations',
    description: 'After-hours intake calls answered with a conflict-safe first contact, and attorney advertising rules respected.',
    metric: 'Every Intake Call Answered',
    image: '/who-we-help/legal.jpg',
    video: '/videos/industries/legal.mp4',
    href: '/solutions/law-firms',
  },
  {
    id: 'financial',
    label: 'Accounting',
    tag: 'Tax-Season Overflow & Advisory Consults',
    description: 'Tax-season calls answered when your staff cannot pick up, and advisory consults booked online.',
    metric: 'Advisory Consults Booked',
    image: '/who-we-help/financial.jpg',
    video: '/videos/industries/financial.mp4',
    href: '/solutions/accounting',
  },
];

// Default idle reel shown before any item is hovered
export const whoWeHelpHeroVideo = '/videos/industries/default.mp4';
export const whoWeHelpHeroImage = '/who-we-help/hero.jpg';
