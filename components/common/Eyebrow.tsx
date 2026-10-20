// The site's section label, in the "Partnering with Iowa Businesses" style:
// sans, bold, wide tracking, blue, no brackets (owner, 2026-10-20). The look
// lives in the `.eyebrow` classes in app/globals.css so plain elements can use
// it too. Words can be Title Case; CSS uppercases them.
import type { ReactNode } from 'react';

const TONE = {
  light: 'eyebrow',
  dark: 'eyebrow eyebrow-dark',
  onBlue: 'eyebrow eyebrow-onblue',
} as const;

export function Eyebrow({
  children,
  tone = 'light',
  className = '',
  as: Tag = 'p',
}: {
  children: ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
  as?: 'p' | 'span' | 'div';
}) {
  return <Tag className={`${TONE[tone]} ${className}`.trim()}>{children}</Tag>;
}
