// components/common/VersionTag.tsx
// The small version label in a dashboard's corner (data/dashboardVersions.ts).
// Sits in the page flow (not fixed), right-aligned at the bottom, so it never
// covers a control or the chat bubble on a phone. Tapping it opens a tiny
// "What's new" list; <details> needs no JavaScript.
import type { DashboardVersion } from '@/data/dashboardVersions';

export function VersionTag({ version, className = '', tone = 'light' }: { version: DashboardVersion; className?: string; tone?: 'light' | 'dark' }) {
  const text = tone === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-400 hover:text-neutral-600';
  return (
    <div className={`flex justify-end ${className}`}>
      <details className="group relative text-right">
        <summary
          data-version-tag
          className={`inline-flex min-h-6 cursor-pointer list-none items-center text-[11px] font-medium tracking-wide [&::-webkit-details-marker]:hidden ${text}`}
          aria-label={`${version.label}. What's new`}
        >
          {version.label}
        </summary>
        <div className="absolute bottom-7 right-0 z-30 w-60 rounded-lg bg-white p-3 text-left shadow-lg ring-1 ring-neutral-200">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">What&apos;s new in {version.label}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-neutral-700">
            {version.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
