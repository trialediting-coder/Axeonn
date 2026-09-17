import { nichePlatformsData, type PlatformLogo } from '@/data/nichePlatformsData';

function LogoCard({ platform }: { platform: PlatformLogo }) {
  return (
    <div className="shrink-0 h-16 sm:h-20 flex items-center justify-center">
      <img
        src={platform.logo}
        alt={platform.name}
        title={platform.name}
        loading="eager"
        decoding="async"
        className={`h-8 sm:h-10 w-auto max-w-[130px] sm:max-w-[160px] object-contain select-none pointer-events-none ${
          platform.invert ? 'invert' : ''
        }`}
      />
    </div>
  );
}

export function NichePlatformsMarquee({ slug }: { slug: string }) {
  const data = nichePlatformsData[slug];
  if (!data) return null;

  // Repeat the platform list enough times per track to comfortably fill wide
  // desktop viewports (each track needs to be wider than half the container,
  // or the two-track loop leaves a visible gap of bare background). Short
  // lists (most niches only have 3 platforms) get repeated more; longer
  // lists need little or no repetition.
  const MIN_ITEMS_PER_TRACK = 9;
  const repeatCount = Math.max(1, Math.ceil(MIN_ITEMS_PER_TRACK / data.platforms.length));
  const trackItems = Array.from({ length: repeatCount }, () => data.platforms).flat();

  return (
    <section className="w-full py-14 sm:py-16 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50 border-y border-neutral-200">
      <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-10">
        <p className="text-xs font-mono font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          Built With Your Industry In Mind
        </p>
        <p className="text-base sm:text-lg text-neutral-700 leading-relaxed max-w-2xl mx-auto">
          {data.tagline}
        </p>
      </div>

      <div className="relative w-full overflow-hidden py-2 group">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-neutral-50 via-neutral-50/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-neutral-50 via-neutral-50/80 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max select-none">
          <div className="flex shrink-0 items-center gap-10 sm:gap-14 pr-10 sm:pr-14 animate-infinite-marquee">
            {trackItems.map((platform, i) => (
              <LogoCard key={`track1-${platform.name}-${i}`} platform={platform} />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center gap-10 sm:gap-14 pr-10 sm:pr-14 animate-infinite-marquee"
          >
            {trackItems.map((platform, i) => (
              <LogoCard key={`track2-${platform.name}-${i}`} platform={platform} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
