// components/admin/ui.ts
// One button and field system for every admin page (/admin, billing, onboarding,
// posts). Change a look here and it changes everywhere. Plain class strings so
// both server and client components can use them.

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap select-none transition-colors cursor-pointer ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-600/50 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-white text-neutral-800 border border-neutral-300 shadow-sm hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100',
  danger: 'bg-white text-red-700 border border-red-200 shadow-sm hover:bg-red-50 hover:border-red-300 active:bg-red-100',
  success: 'bg-white text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-100',
  warning: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:bg-amber-700',
  ghost: 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200',
};

/** Class string for a button or a link styled as one. */
export function btn(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`;
}

export const adminInput =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:bg-neutral-100';

export const adminLabel = 'block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1';

/** Page wrapper below the admin top bar. */
export const adminMain = 'w-full min-h-screen pt-8 pb-24 px-4 sm:px-8 bg-neutral-50';
