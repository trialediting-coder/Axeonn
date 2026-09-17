export interface MarketingSolution {
  id: string;
  title: string;
  description: string;
  badge?: string;
  href: string;
}

export const marketingSolutions: MarketingSolution[] = [
  {
    id: 'website',
    title: 'Website',
    description:
      'Websites that build trust, drive revenue, and make you the clear choice—designed to convert, built to grow',
    href: '/marketing-solutions/website',
  },
  {
    id: 'seo',
    title: 'SEO',
    description:
      'Rank higher on search engines, reach the customers you want most, and turn online searches into new revenue',
    href: '/marketing-solutions/seo',
  },
  {
    id: 'ai-chat-scheduling',
    title: 'AI Chat & Online Scheduling',
    description:
      'Never miss a lead—24/7 AI chat that books, answers, and converts clicks to customers.',
    href: '/marketing-solutions/ai-chat-scheduling',
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation',
    description:
      'Every lead captured and followed up on automatically—one unified pipeline instead of a dozen disconnected tools.',
    href: '/marketing-solutions/lead-generation',
  },
  {
    id: 'video-photography',
    title: 'Video & Photography',
    description:
      'Professional video and photography that helps your business stand out and tell its story.',
    href: '/marketing-solutions/video-photography',
  },
];
