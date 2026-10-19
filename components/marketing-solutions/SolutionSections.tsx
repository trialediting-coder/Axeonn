// Shared bits for /marketing-solutions ("How it works"). The six service pages
// these sections used to lay out were consolidated into the hub on 2026-10-19;
// layer copy lives in data/solutionDetails.ts.

/** Site-wide eyebrow: mono, bracketed, blue. `onDark` lifts the blue for dark backgrounds. */
export function Eyebrow({ label, onDark = false, className = '' }: { label: string; onDark?: boolean; className?: string }) {
  return (
    <p
      className={`text-xs font-mono font-bold tracking-widest uppercase ${onDark ? 'text-blue-400' : 'text-blue-600'} ${className}`}
    >
      [ {label} ]
    </p>
  );
}
