import type { LucideIcon } from 'lucide-react';
import { Globe, Bot, Search, Star, Share2, PhoneIncoming, Camera } from 'lucide-react';

export interface ServicePillar {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const servicePillars: ServicePillar[] = [
  {
    key: 'website',
    icon: Globe,
    title: 'Website',
    description: 'A fast, custom-built site that makes you the obvious choice the moment someone lands on it.',
  },
  {
    key: 'ai-automation',
    icon: Bot,
    title: 'AI Automation & CRM Pipeline',
    description: 'Every inquiry gets triaged, routed, and followed up on automatically — nothing sits in an inbox.',
  },
  {
    key: 'seo',
    icon: Search,
    title: 'SEO / AEO / GEO',
    description: 'Show up in Google, Maps, and AI answer engines when someone searches for what you do.',
  },
  {
    key: 'reviews',
    icon: Star,
    title: 'Reviews & Reputation',
    description: 'Automated review requests after every job, so your rating grows without you chasing it.',
  },
  {
    key: 'social',
    icon: Share2,
    title: 'Social Media',
    description: 'Consistent posting that keeps your business visible between jobs, without eating your week.',
  },
  {
    key: 'lead-capture',
    icon: PhoneIncoming,
    title: 'Lead Capture',
    description: 'Forms, calls, and texts all funnel into one system so no inquiry falls through the cracks.',
  },
  {
    key: 'video-photography',
    icon: Camera,
    title: 'Video & Photography',
    description: 'Real photo and video content that shows your business the way it actually looks.',
  },
];
