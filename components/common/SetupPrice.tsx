// The setup price as a crossed-out list price (owner, 2026-10-19: "instead of
// 5000 build waiver, do like a 5000 crossed out. The messaging should be as
// clear as possible"). Used wherever a price is shown; prose says
// "$0 setup (normally $3,000)" instead.
export function SetupPrice({ was = '$3,000', className = '' }: { was?: string; className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      Setup{' '}
      <s data-strike className="opacity-60 decoration-2" aria-label={`normally ${was}`}>
        {was}
      </s>{' '}
      <strong className="font-extrabold">$0</strong>
    </span>
  );
}
