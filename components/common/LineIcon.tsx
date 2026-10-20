import type { ReactNode } from 'react';

/**
 * Holds an icon at exactly one line-height of the surrounding text (1lh) and centers it,
 * so the icon sits on the first line of the text next to it at any font size, line-height
 * or wrap. Use as the icon slot of an `items-start` flex row instead of nudging the icon
 * with `mt-0.5` / `mt-1`. If the text beside it sets its own size/leading, pass the same
 * classes here (e.g. `text-lg leading-snug`) so 1lh matches that text's line.
 */
export default function LineIcon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`flex h-[1lh] shrink-0 items-center ${className}`}>{children}</span>;
}
