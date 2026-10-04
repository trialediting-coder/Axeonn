// Every niche below now has a real, licensed, industry-specific photo
// (sourced from Unsplash's free tier, personally vetted for no visible
// branding/logos — see public/who-we-help/ for the actual files), EXCEPT
// hvac: an extensive search (Unsplash, Pexels, Pixabay) found no free,
// unbranded, landscape photo of a technician actually at work — every real
// candidate showed a company name on a uniform or an equipment brand (e.g.
// "Carrier", "DAIKIN", "EuropAce") in large legible text. hvac still falls
// back to the shared generic placeholder until a properly licensed photo is
// available.
export const nicheHeroTempImages: Record<string, string> = {
  dental: '/who-we-help/dental.webp',
  'med-spa': '/who-we-help/med-spa.webp',
  hvac: '/temp-scorpion-refs/niche-home-services.webp',
  roofing: '/who-we-help/roofing.webp',
  'law-firms': '/who-we-help/law-firms.webp',
  accounting: '/who-we-help/accounting.webp',
  'home-remodeling': '/who-we-help/home-remodeling.webp',
  'real-estate': '/who-we-help/real-estate-niche.webp',
  landscaping: '/who-we-help/landscaping.webp',
  'auto-detailing': '/who-we-help/auto-detailing.webp',
};

export const defaultNicheHeroTempImage = '/temp-scorpion-refs/niche-home-services.webp';
