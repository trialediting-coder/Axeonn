'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/data/faqData';

interface FAQAccordionProps {
  items: FaqItem[];
  defaultOpenCount?: number;
  size?: 'default' | 'large';
}

export function FAQAccordion({ items, defaultOpenCount = 0, size = 'default' }: FAQAccordionProps) {
  const isLarge = size === 'large';
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(
    () => new Set(Array.from({ length: defaultOpenCount }, (_, i) => i))
  );

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200">
      {items.map((item, index) => {
        const isOpen = openIndexes.has(index);
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              className={`w-full flex items-center justify-between gap-4 text-left cursor-pointer transition-colors hover:text-blue-600 ${
                isLarge ? 'min-h-[52px] py-3.5 sm:py-8' : 'min-h-[48px] py-3 sm:py-5'
              }`}
            >
              <span
                className={`font-bold text-neutral-950 transition-colors ${
                  isLarge ? 'text-[17px] leading-snug sm:text-2xl sm:leading-normal' : 'text-[15px] leading-snug sm:text-lg sm:leading-normal'
                }`}
              >
                {item.question}
              </span>
              <ChevronDown
                size={isLarge ? 24 : 20}
                className={`shrink-0 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </button>
            {/* Always in the HTML (collapsed with `hidden`), so search engines and AI
                crawlers read every answer, not just the questions. */}
            <p
              id={`faq-answer-${index}`}
              hidden={!isOpen}
              className={`text-neutral-600 leading-relaxed font-normal ${
                isLarge
                  ? 'pb-5 sm:pb-8 text-[15px] sm:text-lg lg:text-xl'
                  : 'pb-4 sm:pb-5 text-sm sm:text-base'
              }`}
            >
              {item.answer}
            </p>
          </div>
        );
      })}
    </div>
  );
}
