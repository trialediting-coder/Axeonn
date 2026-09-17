'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { AudioOrbPlayer } from '@/components/why-axeon/AudioOrbPlayer';

// Hero Visual: 3D perspective smartphone framed by a glowing neon triangle
// with 3D metallic labels: MARKETING, AI, TECHNOLOGY, and a "Get Started" CTA
function RevenueEngineVisual() {
  return (
    <div className="relative w-full rounded-[32px] sm:rounded-[40px] bg-[#080b12] border border-neutral-800/80 overflow-hidden shadow-2xl">
      {/* Ambient background lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 48%, rgba(0, 128, 255, 0.18) 0%, rgba(5, 10, 20, 0.6) 45%, rgba(3, 6, 12, 1) 85%)',
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[580px] sm:min-h-[720px] lg:min-h-[860px] xl:min-h-[960px] flex items-center justify-center overflow-hidden">
        {/* Multi-Device Platform Showcase Image */}
        <Image
          src="/Hero-min.jpg"
          alt="AxeonCORE Multi-Device Platform Showcase"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1400px) 95vw, 1720px"
          className="object-cover object-center"
          referrerPolicy="no-referrer"
        />

        {/* Ambient edge vignette overlays for seamless integration */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#080b12] via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#080b12]/30 via-transparent to-[#080b12]/30" />

        {/* Get Started Button at Bottom Right (Scaled 1.5x) */}
        <Link
          href="/book"
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-[#0080FF] hover:bg-[#0070EE] active:scale-95 text-white text-sm sm:text-base font-bold shadow-xl shadow-blue-500/35 transition-all flex items-center gap-2.5 cursor-pointer z-30 group backdrop-blur-xs"
        >
          <span>Get Started</span>
          <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// Card 1: Technology (Scaled 1.5x)
function TechnologyCard() {
  return (
    <div className="relative rounded-[32px] bg-[#080c14] border border-neutral-800/90 overflow-hidden flex flex-col justify-end shadow-2xl min-h-[420px] sm:min-h-[520px] lg:min-h-[760px] group transition-all duration-300 hover:border-neutral-700">
      {/* Visual Content: dashboard screenshot has real text/data near every edge,
          so it's shown uncropped (object-contain) instead of edge-to-edge cover —
          cover was cutting off dashboard labels and numbers. */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-white">
        <Image
          src="/technology-dashboards-clean.png"
          alt="Technology - Axeon revenue dashboard"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain object-center p-4 group-hover:scale-105 transition-transform duration-700"
          priority
          referrerPolicy="no-referrer"
        />
        {/* Gradient overlay so bottom text is clear and readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/10 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Text Panel */}
      <div className="relative p-8 sm:p-10 lg:p-12 z-10 bg-gradient-to-t from-[#080c14] via-[#080c14]/90 to-transparent">
        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight drop-shadow-md">
          Technology
        </h3>
        <p className="text-base sm:text-lg lg:text-xl text-neutral-200 leading-relaxed drop-shadow-sm font-medium">
          Industry-leading software paired with custom-built tools for your business.
        </p>
      </div>
    </div>
  );
}

// Card 2: Marketing (Scaled 1.5x)
function MarketingCard() {
  return (
    <div className="relative rounded-[32px] bg-[#080c14] border border-neutral-800/90 overflow-hidden flex flex-col justify-end shadow-2xl min-h-[420px] sm:min-h-[520px] lg:min-h-[760px] group transition-all duration-300 hover:border-neutral-700">
      {/* TEMPORARY placeholder image — replace before launch, see public/temp-scorpion-refs.
          Pre-cropped to a portrait composition (see marketing-card.webp) so object-cover
          fills the card edge-to-edge without cutting off the SERP results content. */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <Image
          src="/temp-scorpion-refs/marketing-card.webp"
          alt="Marketing - local search ranking visibility"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
          priority
        />
        {/* Gradient overlay so bottom text is clear and readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/40 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Text Panel */}
      <div className="relative p-8 sm:p-10 lg:p-12 z-10 bg-gradient-to-t from-[#080c14] via-[#080c14]/90 to-transparent">
        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight drop-shadow-md">Marketing</h3>
        <p className="text-base sm:text-lg lg:text-xl text-neutral-200 leading-relaxed drop-shadow-sm font-medium">
          Marketing that brings you the right clients at the right time.
        </p>
      </div>
    </div>
  );
}

// Card 3: AI (Scaled 1.5x)
function AICard() {
  return (
    <div className="relative rounded-[32px] bg-[#080c14] border border-neutral-800/90 overflow-hidden flex flex-col justify-between shadow-2xl min-h-[420px] sm:min-h-[520px] lg:min-h-[760px] group transition-all duration-300 hover:border-neutral-700">
      {/* Visual Content: the signature Axeon orb — press play to hear the real AI receptionist */}
      <div className="relative flex-1 p-6 sm:p-10 overflow-hidden bg-gradient-to-b from-[#0e1628]/60 to-transparent flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <AudioOrbPlayer
            variant="orb"
            src="/audio/axeon-ai-call.mp3"
            label="Axeon's AI Receptionist"
            size="large"
            minimal
          />
        </div>
      </div>

      {/* Bottom Text Panel */}
      <div className="p-8 sm:p-10 lg:p-12 bg-gradient-to-t from-[#080c14] via-[#080c14]/95 to-transparent z-10">
        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">AI</h3>
        <p className="text-base sm:text-lg lg:text-xl text-neutral-400 leading-relaxed">
          Integrate AI workflows and automation directly into your business.
        </p>
      </div>
    </div>
  );
}

export function PlatformShowcase() {
  return (
    <section id="axeoncore" className="w-full py-24 sm:py-36 lg:py-44 px-4 sm:px-8 lg:px-12 xl:px-16 bg-black text-white relative overflow-hidden">
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto relative">
        {/* Header Section: Centered with AxeonCORE branding (Scaled 1.5x) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mx-auto mb-12 sm:mb-16"
        >
          {/* AxeonCORE Logo Title */}
          <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-white mb-6 sm:mb-8">
            <span className="font-normal text-white">Axeon</span>
            <span className="font-extrabold inline-block bg-gradient-to-r from-[#38bdf8] via-[#2563eb] to-[#1e3a8a] bg-clip-text text-transparent ml-1">
              CORE
            </span>
          </h2>

          {/* Subtitle with white "succeed" pill badge spanning across */}
          <p className="text-3xl sm:text-4xl lg:text-5xl xl:text-[44px] font-extrabold text-white w-full max-w-6xl lg:max-w-7xl mx-auto leading-snug tracking-tight">
            The digital marketing solution that gives you everything you need to{' '}
            <span className="inline-block bg-[#eef2f7] text-[#05070a] font-black px-5 sm:px-6 py-1 rounded-xl shadow-sm align-baseline mx-1 sm:mx-2">
              succeed
            </span>{' '}
            online. For new &amp; established local businesses.
          </p>
        </motion.div>

        {/* Big Top Card: 3D Phone & Neon Triangle */}
        <RevenueEngineVisual />

        {/* 3 Pillar Cards: Technology, Marketing, AI (Scaled 1.5x) */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          <TechnologyCard />
          <MarketingCard />
          <AICard />
        </div>

        {/* Bottom CTA Button on the bottom-left */}
        <div className="mt-10 sm:mt-12 flex justify-start">
          <Link
            href="/solutions"
            className="px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#0080FF] hover:bg-[#0070EE] text-white text-sm sm:text-base font-bold shadow-xl shadow-blue-500/25 transition-all cursor-pointer inline-flex items-center justify-center"
          >
            Pick Your Industry
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PlatformShowcase;
