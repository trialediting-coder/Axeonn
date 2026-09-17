'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { smoothScrollTo } from '@/components/providers/SmoothScrollProvider';

const SECTIONS = [
  { id: 'web-design', label: 'Web Design' },
  { id: 'ai-agent', label: 'AI Receptionist' },
  { id: 'data-infra', label: 'Data & Infrastructure' },
  { id: 'seo-aeo-geo', label: 'SEO / AEO / GEO' },
  { id: 'automation', label: 'Automation' },
];

export function WhyAxeonSectionNav() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Comparison sections"
      className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-4"
    >
      {SECTIONS.map((section) => {
        const isActive = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => smoothScrollTo(`#${section.id}`, -40)}
            className="group flex items-center gap-3 cursor-pointer"
            aria-label={`Jump to ${section.label}`}
            aria-current={isActive}
          >
            <motion.span
              animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 8 }}
              transition={{ duration: 0.2 }}
              className="text-xs font-mono uppercase tracking-wide text-neutral-500 whitespace-nowrap"
            >
              {section.label}
            </motion.span>
            <motion.span
              animate={{
                width: isActive ? 28 : 8,
                backgroundColor: isActive ? '#2563EB' : '#d4d4d4',
              }}
              className="h-2 rounded-full group-hover:bg-blue-400 transition-colors"
            />
          </button>
        );
      })}
    </nav>
  );
}
