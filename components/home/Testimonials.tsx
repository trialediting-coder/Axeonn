'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';

interface BenchmarkItem {
  source: string;
  target: number;
  prefix?: string;
  suffix?: string;
  title: string;
  description: string;
}

export function Testimonials() {
  const benchmarks: BenchmarkItem[] = [
    {
      source: 'HARVARD BUSINESS REVIEW',
      target: 78,
      suffix: '%',
      title: 'First-Response Advantage',
      description:
        'Nearly 8 out of 10 buyers choose the company that answers first. If you take more than ten minutes to reply, your chances drop off a cliff.',
    },
    {
      source: 'LEAD RESPONSE AUDIT',
      target: 21,
      suffix: 'x',
      title: 'Qualification Decay',
      description:
        'Reaching a lead within five minutes makes you 21 times more likely to get them on a call compared to waiting just half an hour.',
    },
    {
      source: 'AFTER-HOURS INTAKE',
      target: 62,
      suffix: '%',
      title: 'Unmonitored Demand',
      description:
        'Over 60% of customer inquiries arrive after 5 PM or on weekends. If nobody answers, they just tap the next link on Google.',
    },
    {
      source: 'SPEED-TO-LEAD BENCHMARK',
      target: 60,
      prefix: '< ',
      suffix: 's',
      title: 'The Golden Window',
      description:
        'People want help the second they hit submit. A fast text or email sent in under a minute locks in their interest while they are still paying attention.',
    },
  ];

  return (
    <section
      id="testimonials-section"
      className="w-full min-h-screen lg:h-screen lg:min-h-[740px] py-16 lg:py-0 px-4 sm:px-8 lg:px-14 xl:px-20 bg-transparent flex flex-col justify-center overflow-hidden"
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        {/* Section Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-mono font-semibold tracking-widest text-neutral-400 uppercase mb-4"
        >
          [ THE DATA ]
        </motion.div>

        {/* Header Split */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 xl:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.1]">
            Why Speed Matters So Much
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-500 max-w-lg leading-relaxed">
            When someone reaches out for a quote, the clock starts ticking. Here is what happens when you wait to call them back.
          </p>
        </motion.div>

        {/* 4-Card Horizontal Carousel/Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 xl:gap-8">
          {benchmarks.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{
                duration: 0.55,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-3xl p-6 sm:p-8 xl:p-9 border border-neutral-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] xl:min-h-[450px] group"
            >
              <div>
                {/* Header / Source Tag */}
                <div className="inline-block text-[11px] font-mono font-bold tracking-widest text-blue-600 uppercase mb-5 sm:mb-6 bg-blue-50/90 border border-blue-100 px-3 py-1 rounded-full">
                  {item.source}
                </div>

                {/* Metric / Stat with Count-Up */}
                <div className="text-4xl sm:text-5xl xl:text-6xl font-black font-display tracking-tight text-neutral-950 mb-3 group-hover:text-blue-600 transition-colors">
                  <AnimatedCounter
                    target={item.target}
                    prefix={item.prefix}
                    suffix={item.suffix}
                    duration={1.8}
                  />
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold font-display tracking-tight text-neutral-950 mb-3">
                  {item.title}
                </h3>

                {/* Text */}
                <p className="text-xs sm:text-sm xl:text-[15px] text-neutral-600 leading-relaxed font-normal">
                  "{item.description}"
                </p>
              </div>

              {/* Bottom Verification Accent */}
              <div className="pt-4 mt-6 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Documented Metric</span>
                <span className="font-semibold text-neutral-700">Industry Benchmark</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
