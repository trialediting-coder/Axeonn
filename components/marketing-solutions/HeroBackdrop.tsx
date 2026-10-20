import Image from 'next/image';
import type { HeroPhoto } from '@/data/serviceHeroImages';

/** Photo behind a dark service hero, with an overlay that keeps the white text
 *  readable and the brand glow on top. Without a photo it is the glow alone. */
export function HeroBackdrop({ photo }: { photo?: HeroPhoto }) {
  return (
    <>
      {photo && (
        <>
          <Image
            src={photo.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover pointer-events-none"
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
