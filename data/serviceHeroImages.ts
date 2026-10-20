// Hero photo per service page (/marketing-solutions/{service}). Real, licensed
// photos in public/services/ (Unsplash free license, checked for visible
// branding), shown behind the dark hero under an overlay. `position` keeps the
// subject in frame on phones, where the hero crops to a tall shape.
export type HeroPhoto = { src: string; position: string };

export const serviceHeroImages: Record<string, HeroPhoto> = {
  website: { src: '/services/website-devices.webp', position: '45% 60%' },
  seo: { src: '/services/seo-maps.webp', position: '50% 50%' },
  'lead-generation': { src: '/services/lead-generation-call.webp', position: '58% 35%' },
  'ai-chat-scheduling': { src: '/services/ai-chat-window.webp', position: '25% 40%' },
  advertising: { src: '/services/advertising-dashboard.webp', position: '50% 40%' },
  'video-photography': { src: '/services/video-photography.webp', position: '65% 50%' },
};
