import { nichePlatformsData } from '@/data/nichePlatformsData';

export function NichePlatformsMarquee({ slug }: { slug: string }) {
  const data = nichePlatformsData[slug];
  if (!data) return null;

  const loop = [...data.platforms, ...data.platforms];

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
          <div className="flex shrink-0 items-center gap-4 sm:gap-5 pr-4 sm:pr-5 animate-infinite-marquee">
            {loop.map((platform, i) => (
              <span
                key={`track1-${platform}-${i}`}
                className="shrink-0 px-5 py-2.5 rounded-full border border-neutral-300 bg-white text-sm sm:text-base font-semibold text-neutral-700 whitespace-nowrap"
              >
                {platform}
              </span>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center gap-4 sm:gap-5 pr-4 sm:pr-5 animate-infinite-marquee"
          >
            {loop.map((platform, i) => (
              <span
                key={`track2-${platform}-${i}`}
                className="shrink-0 px-5 py-2.5 rounded-full border border-neutral-300 bg-white text-sm sm:text-base font-semibold text-neutral-700 whitespace-nowrap"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
