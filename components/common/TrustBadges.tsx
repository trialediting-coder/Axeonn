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
}

export function TrustBadges({ variant = 'dark' }: TrustBadgesProps) {
  const textClass = variant === 'dark' ? 'text-neutral-300' : 'text-neutral-600';
  const iconClass = variant === 'dark' ? 'text-blue-400' : 'text-blue-600';

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {BADGES.map(({ icon: Icon, label }) => (
        <span key={label} className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium ${textClass}`}>
          <Icon size={15} className={iconClass} strokeWidth={2.2} />
          {label}
        </span>
      ))}
    </div>
  );
}
