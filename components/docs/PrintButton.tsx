'use client';

import { Printer } from 'lucide-react';

/** Opens the print dialog, where "Save as PDF" gives the client a PDF copy. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-sm transition-colors"
    >
      <Printer size={16} /> Print or save PDF
    </button>
  );
}
