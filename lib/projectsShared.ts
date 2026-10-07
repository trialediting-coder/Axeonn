// lib/projectsShared.ts
// The parts of lib/projects.ts that browser components need too (no database).

export interface Line {
  title: string;
  body: string;
}

export const UPDATE_TYPES = ['New page', 'Site change', 'Feature', 'Campaign'] as const;
export const UPDATE_STATUSES = ['Live', 'In review', 'Scheduled'] as const;

export const linesToText = (lines: Line[]) => lines.map((l) => (l.title ? `${l.title}: ${l.body}` : l.body)).join('\n');

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
