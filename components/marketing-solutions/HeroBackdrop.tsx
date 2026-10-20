import type { HeroPhoto } from '@/data/serviceHeroImages';

/** The pre-blurred copies in public/hero-bg/ (640px and 1280px wide, 5-30 KB each),
 *  named after the source photo: /who-we-help/dental.webp -> /hero-bg/dental-640.webp. */
function heroBg(src: string, width: 640 | 1280) {
  const name = src.split('/').pop()!.replace(/\.\w+$/, '');
  return `/hero-bg/${name}-${width}.webp`;
}

/** Photo behind a dark service hero, with an overlay that keeps the white text
 *  readable and the brand glow on top. Without a photo it is the glow alone.
 *
 *  It is the page's largest paint on phones, so it is a plain <img> of a small file
 *  that is already blurred (the blur keeps any text inside the photo from competing
 *  with the headline). The browser finds it in the first HTML and downloads 5-30 KB
 *  instead of waiting on the image optimizer for a 100-260 KB photo (Lighthouse
 *  mobile, 2026-10-20: 6.5-6.8s to the hero before this). */
export function HeroBackdrop({ photo }: { photo?: HeroPhoto }) {
  return (
    <>
      {photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBg(photo.src, 1280)}
            srcSet={`${heroBg(photo.src, 640)} 640w, ${heroBg(photo.src, 1280)} 1280w`}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-105"
            style={{ objectPosition: photo.position }}
          />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-neutral-950/50" />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-gradient-to-b from-neutral-950/50 via-neutral-950/10 to-neutral-950/90" />
        </>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(37,99,235,0.28), transparent 70%)' }}
      />
    </>
  );
}
