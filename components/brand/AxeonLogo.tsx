// components/brand/AxeonLogo.tsx
// The real Axeon mark (two slanted bars and a dot, same geometry as the site
// header) and the wordmark lockups used by the app: "Axeon" and "AxeonPROOF".

export function AxeonMark({ className = 'h-6 w-auto text-blue-600' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 20" fill="currentColor" aria-hidden className={className}>
      <polygon points="6,0 2,20 6,20 10,0" />
      <polygon points="14,0 10,20 14,20 18,0" />
      <circle cx="21" cy="18" r="2" />
    </svg>
  );
}

export function AxeonLogo({
  product,
  tone = 'dark',
  size = 'md',
}: {
  /** Adds a product name after the wordmark, e.g. "PROOF" -> AxeonPROOF. */
  product?: string;
  /** "dark" text for light backgrounds, "light" text for dark backgrounds. */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}) {
  const text = { sm: 'text-base', md: 'text-lg', lg: 'text-3xl' }[size];
  const mark = { sm: 'h-[18px]', md: 'h-[22px]', lg: 'h-8' }[size];
  const ink = tone === 'light' ? 'text-white' : 'text-neutral-950';
  return (
    <span className="inline-flex items-center gap-2.5">
      <AxeonMark className={`${mark} w-auto shrink-0 text-blue-600`} />
      <span className={`${text} font-extrabold leading-none tracking-tight ${ink}`}>
        Axeon
        {product ? <span className="font-black tracking-[0.02em] text-blue-500">{product}</span> : null}
      </span>
    </span>
  );
}
