import { ShieldCheck, MapPin, Tag } from 'lucide-react';

// Only facts anyone can check on this site. No ratings, certifications or
// "first in Iowa" claims until there is a source to point to (e.g. a Google
// rating, shown with its source, once Axeon has its own reviews).
const BADGES = [
  { icon: ShieldCheck, label: '90-Day Customer Guarantee' },
  { icon: Tag, label: 'Published, Flat Monthly Pricing' },
  { icon: MapPin, label: 'Based in West Des Moines' },
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

  return (
    // lg: stacked on phones, one row from sm up (sized to fit the hero's max-w-3xl column)
    <div className={isLg ? 'flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-y-2.5 sm:gap-x-6 sm:gap-y-3' : 'flex flex-wrap items-center gap-x-5 gap-y-2'}>
      {BADGES.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className={`inline-flex items-center font-medium whitespace-nowrap ${isLg ? 'gap-2 text-sm sm:text-[15px] lg:text-base' : 'gap-1.5 text-xs sm:text-sm'} ${textClass}`}
        >
          <Icon size={isLg ? 18 : 15} className={`shrink-0 ${iconClass}`} strokeWidth={2.2} />
          {label}
        </span>
      ))}
    </div>
  );
}
