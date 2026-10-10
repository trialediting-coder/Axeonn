import { ShieldCheck, MapPin, Tag } from 'lucide-react';

// Only facts anyone can check on this site. No ratings, certifications or
// "first in Iowa" claims until there is a source to point to (e.g. a Google
// rating, shown with its source, once Axeon has its own reviews).
// `short` is the phone label for the 'lg' hero layout: two fixed lines per
// column so all three wrap the same way (3 columns, ~100px each at 360px).
const BADGES = [
  { icon: ShieldCheck, label: '90-Day Customer Guarantee', short: ['90-Day', 'Guarantee'] },
  { icon: Tag, label: 'Published, Flat Monthly Pricing', short: ['Flat Monthly', 'Pricing'] },
  { icon: MapPin, label: 'Based in West Des Moines', short: ['Based in', 'West Des Moines'] },
];

interface TrustBadgesProps {
  variant?: 'dark' | 'light';
  /** 'lg' for hero placements, where the badges sit under big CTAs. */
  size?: 'md' | 'lg';
}

export function TrustBadges({ variant = 'dark', size = 'md' }: TrustBadgesProps) {
  const isLg = size === 'lg';
  const textClass = variant === 'dark' ? 'text-neutral-300' : 'text-neutral-600';
  const iconClass = variant === 'dark' ? 'text-blue-400' : 'text-blue-600';

  if (isLg) {
    return (
      // Phones: centered 3-column strip (icon over a short label) to match the
      // centered CTAs. From sm up: one inline row, sized to fit the hero's max-w-3xl column.
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
        {BADGES.map(({ icon: Icon, label, short }) => (
          <span
            key={label}
            className={`flex flex-col items-center gap-1.5 text-center text-xs leading-snug font-medium sm:inline-flex sm:flex-row sm:gap-2 sm:text-left sm:text-[15px] sm:whitespace-nowrap lg:text-base ${textClass}`}
          >
            <Icon size={18} className={`shrink-0 ${iconClass}`} strokeWidth={2.2} />
            <span className="flex flex-col whitespace-nowrap sm:hidden">
              {short.map((line) => <span key={line}>{line}</span>)}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {BADGES.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium whitespace-nowrap ${textClass}`}
        >
          <Icon size={15} className={`shrink-0 ${iconClass}`} strokeWidth={2.2} />
          {label}
        </span>
      ))}
    </div>
  );
}
