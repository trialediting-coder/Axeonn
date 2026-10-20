// Hero photo per service page (/marketing-solutions/{service}). Real, licensed
// photos in public/services/ (Unsplash free license, checked for visible
// branding), shown behind the dark hero under an overlay. `position` keeps the
// subject in frame on phones, where the hero crops to a tall shape.
export type HeroPhoto = { src: string; position: string };

export const serviceHeroImages: Record<string, HeroPhoto> = {
  website: { src: '/services/website.webp', position: '60% 50%' },
  seo: { src: '/services/seo.webp', position: '55% 40%' },
  'lead-generation': { src: '/services/lead-generation.webp', position: '62% 35%' },
  'ai-chat-scheduling': { src: '/services/ai-chat-scheduling.webp', position: '50% 40%' },
  advertising: { src: '/services/advertising-feed.webp', position: '50% 30%' },
  'video-photography': { src: '/services/video-photography.webp', position: '65% 50%' },
};
