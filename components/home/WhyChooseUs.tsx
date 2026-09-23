'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Bell, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';

export function WhyChooseUs() {
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);

  const routingSteps = [
    { icon: CheckCircle2, text: 'Form, call, or chat comes in' },
    { icon: Bell, text: 'Instant alert routed to your phone' },
    { icon: Smartphone, text: 'You respond before they call a competitor' },
  ];

  return (
    <section
      id="why-choose-us"
      className="w-full py-20 lg:py-28 px-4 sm:px-8 lg:px-14 xl:px-20 bg-transparent flex flex-col justify-center overflow-hidden"
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        {/* Section Tag */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-mono font-semibold tracking-widest text-neutral-800 uppercase mb-3 sm:mb-4"
        >
          [ WHY CHOOSE US ]
        </motion.div>

        {/* Header Split: Left Headline, Right Descriptive Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-950 font-display tracking-tight leading-[1.08]">
            We Skip The Fluff. <br />
            You Get Customers.
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-600 max-w-xl leading-relaxed lg:text-right">
            Direct, transparent, and built on real AI systems — not templated bots. We say what we mean and build what actually gets customers through your door. No jargon, no endless meetings, no handoffs.
          </p>
        </motion.div>

        {/* Bento Grid Layout Matching the Concept Image */}
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Row 1: 3 Equal Width Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Left Dark Rating & Client Satisfaction Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="relative rounded-[28px] sm:rounded-[34px] bg-[#111111] text-white p-7 sm:p-9 xl:p-10 flex flex-col justify-between overflow-hidden border border-neutral-800 shadow-lg min-h-[380px] sm:min-h-[420px] group"
            >
              {/* Subtle Ambient Electric Glow */}
              <div className="absolute -top-12 -right-12 w-80 h-80 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />

              {/* Iowa State Capitol Visual on the Right */}
              <div className="absolute top-0 right-0 bottom-0 w-3/4 sm:w-3/5 pointer-events-none overflow-hidden select-none">
                <img
                  src="/iowa_state_capitol_wide.jpg"
                  alt="Iowa State Capitol in Des Moines with iconic golden dome"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  width={600}
                  height={420}
                  className="w-full h-full object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Gentle gradient fade so left-hand text remains legible without blacking out the artwork */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent" />
              </div>

              {/* Top: 5 Golden Stars & Rating */}
              <div className="relative z-10">
                <div className="flex items-center gap-1 text-amber-400 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: false }}
                      transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 400 }}
                    >
                      <Star size={15} fill="currentColor" />
                    </motion.span>
                  ))}
                </div>
                <div className="text-xs sm:text-sm text-neutral-300 font-medium tracking-tight">
                  5.0 Rating
                </div>
              </div>

              {/* Middle / Bottom: Metric, Label & Description */}
              <div className="relative z-10 mt-auto pt-10">
                <div className="text-3xl sm:text-4xl xl:text-5xl font-bold font-display tracking-tight text-white mb-2 leading-tight">
                  AI-Powered
                </div>
                <div className="text-xs sm:text-sm text-neutral-300 font-semibold mb-2">
                  First AI-Powered Agency in Iowa
                </div>
                <p className="text-[13px] sm:text-sm text-neutral-400 leading-relaxed font-normal">
                  We pair custom web design with practical automation so your business responds to new leads instantly and looks miles ahead of competitors.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Middle White Card with 0 Lost Inquiries & Ascending Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="relative rounded-[28px] sm:rounded-[34px] bg-white p-7 sm:p-9 xl:p-10 flex flex-col justify-between overflow-hidden border border-neutral-200/90 shadow-xs hover:shadow-xl transition-all duration-300 min-h-[380px] sm:min-h-[420px] group"
            >
              {/* Top: 100% Inbound Lead Capture Metric & Description */}
              <div>
                <div className="text-5xl sm:text-6xl xl:text-7xl font-bold font-display text-neutral-950 tracking-tight mb-1">
                  <AnimatedCounter target={100} suffix="%" duration={1.8} />
                </div>
                <div className="text-xs sm:text-sm text-neutral-900 font-semibold mb-2">
                  Never Miss a Lead
                </div>
                <p className="text-[13px] sm:text-sm text-neutral-600 leading-relaxed font-normal">
                  Every contact form, question, and inquiry gets routed straight to your phone so hot leads never slip through the cracks.
                </p>
              </div>

              {/* Bottom: How Instant Routing Works — 3-step visual */}
              <div className="mt-8 pt-4 flex flex-col gap-3">
                {routingSteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false }}
                      transition={{ duration: 0.5, delay: 0.15 + idx * 0.1 }}
                      className="flex items-center gap-3 rounded-xl bg-indigo-50/70 border border-indigo-100 px-3.5 py-2.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-white" />
                      </div>
                      <span className="text-[13px] sm:text-sm text-neutral-700 font-medium leading-snug">
                        {step.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Card 3: Right White Card with Fast Turnaround & Rapid Implementation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="relative rounded-[28px] sm:rounded-[34px] bg-white p-7 sm:p-9 xl:p-10 flex flex-col justify-between overflow-hidden border border-neutral-200/90 shadow-xs hover:shadow-xl transition-all duration-300 min-h-[380px] sm:min-h-[420px]"
            >
              {/* Top: Speed Metric & Label */}
              <div>
                <div className="text-5xl sm:text-6xl xl:text-7xl font-bold font-display text-neutral-950 tracking-tight mb-1 whitespace-nowrap">
                  Fast.
                </div>
                <div className="text-xs sm:text-sm text-neutral-900 font-semibold">
                  From Kickoff to Live Launch
                </div>
              </div>

              {/* Bottom: Rapid Implementation Title & Description */}
              <div className="mt-8 pt-4">
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-neutral-950 tracking-tight mb-3">
                  Rapid Delivery
                </h3>
                <p className="text-[13px] sm:text-sm lg:text-base text-neutral-600 leading-relaxed font-normal">
                  From first conversation to live launch in a fraction of the time a typical agency takes. We stay focused on your project instead of juggling dozens at once, so your new site can start paying for itself immediately.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Row 2: 2 Columns Matching the Concept Image Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Card 4: Fast Delivery with 3 Blue Dots and Fanned Sketch Photos */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              whileHover={{ y: -4 }}
              onMouseEnter={() => setIsPhotoHovered(true)}
              onMouseLeave={() => setIsPhotoHovered(false)}
              className="lg:col-span-5 rounded-[28px] sm:rounded-[34px] bg-white p-7 sm:p-9 xl:p-10 border border-neutral-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[280px]"
            >
              {/* Three Blue Dots */}
              <div className="flex items-center gap-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Left: Text Information */}
                <div className="sm:col-span-7">
                  <h3 className="text-2xl sm:text-3xl font-bold font-display text-neutral-950 tracking-tight mb-2">
                    Dependable Timelines
                  </h3>
                  <p className="text-[13px] sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    No runaway deadlines or surprise invoices. We give you a clear plan and move fast to get you live.
                  </p>
                </div>

                {/* Right: Overlapping Fanned Photos of Sketches & Wireframes */}
                <div className="sm:col-span-5 relative h-28 sm:h-32 flex items-center justify-center">
                  {/* Photo 1: Left Wireframe Sketch (tilted counter-clockwise) */}
                  <motion.div
                    animate={
                      isPhotoHovered
                        ? { rotate: -12, scale: 1.05, x: -8 }
                        : { rotate: -6, scale: 1, x: 0 }
                    }
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute w-28 sm:w-32 aspect-[4/3] rounded-xl overflow-hidden shadow-lg border-2 border-white bg-white z-10 select-none -left-2 sm:left-0"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=260&q=75&fm=webp"
                      alt="Wireframing sketches"
                      loading="lazy"
                      decoding="async"
                      width={130}
                      height={98}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Photo 2: Right Digital Mockup (tilted clockwise) */}
                  <motion.div
                    animate={
                      isPhotoHovered
                        ? { rotate: 8, scale: 1.08, x: 8 }
                        : { rotate: 4, scale: 1, x: 0 }
                    }
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute w-28 sm:w-32 aspect-[4/3] rounded-xl overflow-hidden shadow-xl border-2 border-white bg-white z-20 select-none right-2 sm:right-4"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=260&q=75&fm=webp"
                      alt="Digital product design"
                      loading="lazy"
                      decoding="async"
                      width={130}
                      height={98}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Card 5: New & Growing in Iowa with Team Photo Background */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="lg:col-span-7 relative rounded-[28px] sm:rounded-[34px] overflow-hidden border border-neutral-800 shadow-xs hover:shadow-xl transition-all duration-300 min-h-[280px] group flex items-end p-7 sm:p-9 xl:p-10"
            >
              {/* Full Background Team Photo */}
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=750&q=75&fm=webp"
                alt="New and Growing Agency in Iowa"
                loading="lazy"
                decoding="async"
                width={750}
                height={350}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out select-none"
              />

              {/* Gradient Scrim for Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/65 to-neutral-950/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-transparent to-transparent" />

              {/* Inner Two-Column Split: Headline on Left, Paragraph on Right */}
              <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight leading-[1.1]">
                    New &amp; Growing <br />
                    Here in Iowa
                  </h3>
                </div>
                <p className="text-[13px] sm:text-sm lg:text-base text-neutral-200 max-w-sm leading-relaxed font-normal">
                  We are based right here in West Des Moines. We treat our clients like partners, communicate clearly, and take pride in work that stands out.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Closing path: this was the last content block before FAQ with no CTA at all */}
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 mt-16 sm:mt-20">
        <div className="rounded-[28px] bg-neutral-950 text-white p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">See what we&apos;d build for your business.</h3>
            <p className="mt-2 text-neutral-300 text-base sm:text-lg max-w-2xl">
              A free 20-minute call. You leave with a clear scope and a flat price, whether or not you hire us.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
            >
              Book a Free Strategy Call <ArrowRight size={18} />
            </Link>
            <a
              href="tel:+15154938017"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/25 hover:bg-white/10 text-white font-semibold text-base transition-colors"
            >
              Call (515) 493-8017
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
