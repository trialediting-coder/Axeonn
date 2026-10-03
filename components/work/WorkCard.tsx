import { ArrowUpRight } from 'lucide-react';
import type { WorkProject } from '@/data/workProjects';

export function WorkCard({ project, showConcept = false }: { project: WorkProject; showConcept?: boolean }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener"
      className="group flex flex-col"
    >
      <div className="relative aspect-[1440/1000] w-full rounded-[24px] sm:rounded-[32px] overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-sm group-hover:shadow-xl transition-all duration-500">
        <img
          src={project.image}
          alt={`${project.name} website homepage`}
          loading="lazy"
          decoding="async"
          width={1200}
          height={833}
          className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />
      </div>
      <div className="flex items-start justify-between gap-4 pt-4 sm:pt-5 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-neutral-950 font-display tracking-tight group-hover:text-blue-600 transition-colors inline-flex items-center gap-1.5">
            {project.name}
            <ArrowUpRight className="w-5 h-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            {project.industry} &middot; {project.location} &middot; {project.date}
          </p>
          <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed mt-3 max-w-xl">
            {project.summary}
          </p>
        </div>
        {project.concept ? (
          showConcept && (
          <span className="shrink-0 text-[11px] font-mono font-medium text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200/60">
            Concept
          </span>
          )
        ) : (
          <span className="shrink-0 text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Client
          </span>
        )}
      </div>
    </a>
  );
}

export function ConceptDisclaimer({ className = '', tagged = false }: { className?: string; tagged?: boolean }) {
  return (
    <p className={`text-[11px] text-neutral-400 leading-relaxed ${className}`}>
      {tagged
        ? <>Projects marked &ldquo;Concept&rdquo; are self-initiated designs by Axeon Studio and are not affiliated with or endorsed by the businesses shown.</>
        : <>Some projects shown are self-initiated designs by Axeon Studio and are not affiliated with or endorsed by the businesses shown.</>}
    </p>
  );
}
