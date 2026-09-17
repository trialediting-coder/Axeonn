export interface NicheVideoAsset {
  video: string;
  poster: string;
}

// Maps each niche slug (data/nichesData.ts) to the real industry video/poster
// pair it should show (public/videos/industries + public/who-we-help). Several
// niches share one Home & Trade Services clip since there's one video per
// broad category, not per individual niche.
export const nicheVideoMap: Record<string, NicheVideoAsset> = {
  dental: { video: '/videos/industries/dental.mp4', poster: '/who-we-help/dental.jpg' },
  'med-spa': { video: '/videos/industries/dental.mp4', poster: '/who-we-help/dental.jpg' },
  hvac: { video: '/videos/industries/home-services.mp4', poster: '/who-we-help/home-services.jpg' },
  roofing: { video: '/videos/industries/home-services.mp4', poster: '/who-we-help/home-services.jpg' },
  'law-firms': { video: '/videos/industries/legal.mp4', poster: '/who-we-help/legal.jpg' },
  accounting: { video: '/videos/industries/financial.mp4', poster: '/who-we-help/financial.jpg' },
  'home-remodeling': { video: '/videos/industries/home-services.mp4', poster: '/who-we-help/home-services.jpg' },
  'real-estate': { video: '/videos/industries/real-estate.mp4', poster: '/who-we-help/real-estate.jpg' },
  landscaping: { video: '/videos/industries/home-services.mp4', poster: '/who-we-help/home-services.jpg' },
  'auto-detailing': { video: '/videos/industries/home-services.mp4', poster: '/who-we-help/home-services.jpg' },
};

// Fallback if a niche slug is ever missing from the map above.
export const defaultNicheVideoAsset: NicheVideoAsset = {
  video: '/videos/industries/default.mp4',
  poster: '/who-we-help/hero.jpg',
};
