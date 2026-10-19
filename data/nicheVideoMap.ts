export interface NicheVideoAsset {
  video: string;
  poster: string;
}

// Maps each practice slug (data/nichesData.ts) to the industry video/poster
// pair it should show (public/videos/industries + public/who-we-help).
// med-spa has no clip of its own yet, so it shares the dental one.
export const nicheVideoMap: Record<string, NicheVideoAsset> = {
  dental: { video: '/videos/industries/dental.mp4', poster: '/who-we-help/dental.jpg' },
  'med-spa': { video: '/videos/industries/dental.mp4', poster: '/who-we-help/dental.jpg' },
  'law-firms': { video: '/videos/industries/legal.mp4', poster: '/who-we-help/legal.jpg' },
  accounting: { video: '/videos/industries/financial.mp4', poster: '/who-we-help/financial.jpg' },
};

// Fallback if a practice slug is ever missing from the map above.
export const defaultNicheVideoAsset: NicheVideoAsset = {
  video: '/videos/industries/default.mp4',
  poster: '/who-we-help/hero.jpg',
};
