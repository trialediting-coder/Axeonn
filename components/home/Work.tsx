'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
}

export function Work() {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const projects: Project[] = [
    {
      id: 'hvac-concept',
      title: 'HVAC Dispatch & Booking Concept',
      category: 'Home Services',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=650&q=75&fm=webp',
      description:
        'A concept build showing how we would separate true emergency dispatch from routine seasonal tune-up bookings, so urgent calls never sit in a generic contact form.',
    },
    {
      id: 'medspa-concept',
      title: 'Med Spa Intake & Booking Concept',
      category: 'Med Spa & Wellness',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=650&q=75&fm=webp',
      description:
        'A concept layout for segmenting treatment interest at the point of inquiry and routing each lead into the right booking or membership flow.',
    },
    {
      id: 'realestate-concept',
      title: 'Real Estate Lead Routing Concept',
      category: 'Real Estate',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=650&q=75&fm=webp',
      description:
        'A concept build for splitting buyer and seller inquiries into distinct pipelines, with instant valuation requests and showing requests routed separately.',
    },
    {
      id: 'legal-concept',
      title: 'Law Firm Case Intake Concept',
      category: 'Legal',
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=650&q=75&fm=webp',
      description:
        'A concept intake flow that routes prospective clients by practice area and tracks each case from initial evaluation through signed retainer.',
    },
  ];

  const categories = ['All', 'Home Services', 'Med Spa & Wellness', 'Real Estate', 'Legal'];

  const filteredProjects =
    activeCategory === 'All'
      ? projects
      : projects.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <section
      id="recent-projects"
      className="w-full min-h-screen py-20 lg:py-28 px-4 sm:px-8 lg:px-14 xl:px-20 bg-transparent flex flex-col justify-center overflow-hidden"
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
          [ EXAMPLE WORK ]
        </motion.div>

        {/* Header Split: Headline on Left, Narrative Subtitle on Right */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-950 font-display tracking-tight leading-[1.08]">
            Concept Builds
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-600 max-w-xl leading-relaxed lg:text-right">
            We're a new studio — these are concept builds, not client case studies. A look at how we'd approach the site and intake flow for a few of the industries we serve.
          </p>
        </motion.div>

        {/* Interactive Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center gap-2 sm:gap-3 mb-10 sm:mb-14"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium tracking-tight transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-neutral-600 hover:text-neutral-950 bg-neutral-100/80 hover:bg-neutral-200/70 border border-neutral-200/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-project-pill"
                    className="absolute inset-0 bg-neutral-950 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </motion.div>

        {/* 2x2 Concept Grid Matching the Uploaded Design */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, idx) => (
              <Link
                key={project.id}
                href="/work"
                className="group flex flex-col cursor-pointer"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 35, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col"
                >
                  {/* Image Container with Curvature & Visual Contrast */}
                  <div className="relative aspect-[4/3.8] sm:aspect-[4/3.7] lg:aspect-[1/1] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      width={600}
                      height={600}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {/* Info Bar Underneath with Title, Category, and Year Badge */}
                  <div className="flex items-center justify-between pt-4 sm:pt-5 px-1">
                    <div>
                      <h3 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-neutral-950 font-display tracking-tight group-hover:text-blue-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
                        {project.category}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-medium text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60">
                      Concept
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Dedicated Full-Page Case Studies CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 sm:mt-18 lg:mt-20 pt-8 sm:pt-10 border-t border-neutral-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-neutral-500 uppercase mb-1.5">
              <span>[ WANT TO SEE THIS FOR YOUR BUSINESS? ]</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-neutral-950 font-display tracking-tight">
              Book a session and we'll walk through your build live.
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 mt-1.5 leading-relaxed">
              As a new studio, we're building our client portfolio right now. Book a strategy session and we'll show you exactly how the site and intake system would work for your industry, timeline, and price.
            </p>
          </div>

          <div className="flex items-center w-full md:w-auto shrink-0">
            <Link
              id="view-all-projects-btn"
              href="/work"
              className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full bg-neutral-950 hover:bg-blue-600 text-white font-bold text-sm sm:text-base tracking-tight shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer w-full sm:w-auto"
            >
              <span>See all concept builds</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
