import { AxeonLogo } from '@/components/brand/AxeonLogo';
import { PrintButton } from '@/components/docs/PrintButton';

// The printable "paper" for client documents (agreement, welcome packet), styled
// after the Axeon document templates. "Save as PDF" is the browser's print dialog;
// print CSS drops the page background and everything marked .no-print.
export function DocPaper({
  kind,
  meta,
  children,
  aside,
}: {
  kind: string;
  meta?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F7F6F3] text-neutral-950 px-4 sm:px-10 pt-8 sm:pt-12 pb-24 print:bg-white print:p-0">
      <style>{`@media print { .no-print { display: none !important } @page { margin: 16mm } }`}</style>
      <div className="no-print max-w-3xl mx-auto mb-4 flex items-center justify-end gap-3">
        <PrintButton />
      </div>
      <article className="max-w-3xl mx-auto rounded-[20px] border border-neutral-200 bg-white px-6 sm:px-12 py-10 sm:py-14 shadow-xs print:border-0 print:shadow-none print:p-0 print:max-w-none">
        <header className="flex items-start justify-between gap-6 border-b border-neutral-200 pb-6 mb-8">
          <AxeonLogo size="sm" />
          <div className="text-right">
            <p className="text-xs font-mono uppercase tracking-wider text-blue-600">{kind}</p>
            {meta && <p className="mt-1 text-xs text-neutral-500">{meta}</p>}
          </div>
        </header>
        <div className="text-[15px] leading-relaxed text-neutral-800">{children}</div>
        <footer className="mt-12 border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          Axeon Studio · hello@axeonstudio.co · (515) 493-8017 · axeonstudio.co
        </footer>
      </article>
      {aside && <div className="no-print max-w-3xl mx-auto mt-6">{aside}</div>}
    </main>
  );
}

export function DocH2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-3 text-lg font-extrabold tracking-tight text-neutral-950 font-display break-after-avoid">{children}</h2>;
}

export function DocFacts({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="my-6 grid grid-cols-1 sm:grid-cols-[180px_1fr] rounded-xl border border-neutral-200 overflow-hidden text-sm break-inside-avoid">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="bg-neutral-50 px-4 py-2.5 font-semibold text-neutral-600 border-b border-neutral-200">{k}</dt>
          <dd className="px-4 py-2.5 text-neutral-900 border-b border-neutral-200">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
