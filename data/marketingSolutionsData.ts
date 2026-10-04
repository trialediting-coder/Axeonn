export interface MarketingSolution {
  id: string;
  title: string;
  description: string;
  badge?: string;
  /** What gets you this service, shown on the hub card. */
  included: string;
  href: string;
}

export const marketingSolutions: MarketingSolution[] = [
  {
    id: 'website',
    title: 'Website',
    description:
      'Websites that build trust, drive revenue, and make you the clear choice—designed to convert, built to grow',
    href: '/marketing-solutions/website',
    included: 'In every build',
  },
  {
    id: 'seo',
    title: 'SEO',
    description:
      'Rank higher on search engines, reach the customers you want most, and turn online searches into new revenue',
    href: '/marketing-solutions/seo',
    included: 'In every build',
  },
  {
    id: 'ai-chat-scheduling',
    title: 'AI Chat & Online Scheduling',
    description:
      'Never miss a lead—24/7 AI chat that books, answers, and converts clicks to customers.',
    href: '/marketing-solutions/ai-chat-scheduling',
    included: 'In AxeonCORE',
  },
  {
    id: 'lead-generation',
    title: 'Lead Capture & Follow-Up',
    description:
      'Every lead captured and followed up on automatically—one unified pipeline instead of a dozen disconnected tools.',
    href: '/marketing-solutions/lead-generation',
    included: 'In AxeonCORE',
  },
  {
    id: 'advertising',
    title: 'Advertising',
    description:
      'Google Ads and Meta Ads that send ready-to-buy customers to pages built to convert, with every call and booking tracked.',
    href: '/marketing-solutions/advertising',
    included: 'Growth engine add-on',
  },
  {
    id: 'video-photography',
    title: 'Video & Photography',
    description:
      'Professional video and photography that helps your business stand out and tell its story.',
    href: '/marketing-solutions/video-photography',
    included: 'In AxeonCORE',
  },
];
