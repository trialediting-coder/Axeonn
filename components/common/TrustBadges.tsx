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
    <div className={`flex flex-wrap items-center ${isLg ? 'gap-x-7 gap-y-3' : 'gap-x-5 gap-y-2'}`}>
      {BADGES.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className={`inline-flex items-center font-medium ${isLg ? 'gap-2 text-sm sm:text-base lg:text-lg' : 'gap-1.5 text-xs sm:text-sm'} ${textClass}`}
        >
          <Icon size={isLg ? 20 : 15} className={iconClass} strokeWidth={2.2} />
          {label}
        </span>
      ))}
    </div>
  );
}
