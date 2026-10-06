import { ShieldCheck, Award, Star } from 'lucide-react';

// Generic, honest trust marks — NOT specific third-party certification claims
// Axeon doesn't yet hold (e.g. specific partnership programs).
// Swap the `label`/`icon` pairs below for real partner-program badges once those certifications exist.
const BADGES = [
  { icon: ShieldCheck, label: 'Certified Partner' },
  { icon: Award, label: 'First AI-Powered Agency in Iowa' },
  { icon: Star, label: '5.0 Client Rating' },
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
