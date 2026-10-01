'use client';

import { useState, useEffect, useRef, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { niches } from '@/data/nichesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';

const homeServicesNiches = niches.filter((niche) => niche.category === 'Home & Trade Services');
const healthNiches = niches.filter((niche) => niche.category === 'Healthcare');
const proServicesNiches = niches.filter((niche) => niche.category === 'Professional Services');

type MobileSection = 'about' | 'help' | 'marketing';

const MOBILE_EASE = [0.22, 1, 0.36, 1] as const;

/** One collapsible group inside the phone menu. */
function MobileGroup({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const id = `mobile-group-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="border-b border-neutral-100">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
        className="w-full min-h-[52px] flex items-center justify-between py-3 text-left text-[15px] font-semibold text-neutral-900 cursor-pointer"
      >
        <span>{label}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.3, ease: MOBILE_EASE }, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isNichePage = pathname.startsWith('/solutions/');
  // The 5 individual marketing-solutions service pages (not the /marketing-solutions
  // hub itself, which has a light background) each have a full-bleed dark hero.
  const isDarkServicePage = pathname.startsWith('/marketing-solutions/');
  // Standalone pages that also open on a full-bleed dark hero.
  const isOtherDarkHeroPage = ['/nonprofits', '/partners', '/des-moines-web-design'].includes(pathname);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const marketingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mobileSection, setMobileSection] = useState<MobileSection | null>(null);
  const toggleMobileSection = (section: MobileSection) =>
    setMobileSection((current) => (current === section ? null : section));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape closes whichever desktop panel is open.
  useEffect(() => {
    if (!aboutOpen && !solutionsOpen && !marketingOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAboutOpen(false);
      setSolutionsOpen(false);
      setMarketingOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aboutOpen, solutionsOpen, marketingOpen]);

  // Any navigation closes the phone menu (covers back/forward and hash links).
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock page scroll behind the open phone menu so the panel scrolls, not the page.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  const onDarkHero =
    (isNichePage || isHomePage || isDarkServicePage || isOtherDarkHeroPage) && !isScrolled && !mobileMenuOpen;
  const navHoverClass = onDarkHero ? 'hover:text-blue-400 text-white' : 'hover:text-blue-600 text-neutral-800';

  const openAbout = () => {
    if (aboutTimeoutRef.current) clearTimeout(aboutTimeoutRef.current);
    setAboutOpen(true);
  };
  const closeAboutDelayed = () => {
    aboutTimeoutRef.current = setTimeout(() => setAboutOpen(false), 200);
  };

  const openSolutions = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSolutionsOpen(true);
  };
  const closeSolutionsDelayed = () => {
    timeoutRef.current = setTimeout(() => setSolutionsOpen(false), 200);
  };

  const openMarketing = () => {
    if (marketingTimeoutRef.current) clearTimeout(marketingTimeoutRef.current);
    setMarketingOpen(true);
  };
  const closeMarketingDelayed = () => {
    marketingTimeoutRef.current = setTimeout(() => setMarketingOpen(false), 200);
  };

  // Hover opens the desktop panels, so a mouse click on an already-open trigger
  // must not toggle it shut (that made the menus look dead to anyone who points,
  // then clicks). Touch "hover" is ignored, so taps and keyboard simply toggle.
  const lastPointerType = useRef<string | null>(null);
  const mouseOnly = (fn: () => void) => (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse') fn();
  };
  const triggerProps = (open: () => void, setOpen: (update: (v: boolean) => boolean) => void) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      lastPointerType.current = e.pointerType;
    },
    onClick: () => {
      const byMouse = lastPointerType.current === 'mouse';
      lastPointerType.current = null;
      if (byMouse) open();
      else setOpen((v) => !v);
    },
  });

  const scrollToPlatform = (e: MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (!isHomePage) return;
    e.preventDefault();
    const el = document.getElementById('axeoncore');
    const lenis = (window as any).__lenis;
    if (lenis && el) lenis.scrollTo(el, { offset: -70, duration: 1.2 });
    else el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="relative w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Axeon Home">
          <svg width="30" height="25" viewBox="0 0 24 20" fill="currentColor" className="text-blue-600 group-hover:scale-105 transition-transform">
            <polygon points="6,0 2,20 6,20 10,0" />
            <polygon points="14,0 10,20 14,20 18,0" />
            <circle cx="21" cy="18" r="2" />
          </svg>
          <span
            className={`font-extrabold text-2xl tracking-tight ${
              onDarkHero ? 'text-white' : 'text-neutral-950'
            }`}
          >
            Axeon
          </span>
        </Link>

        <nav
          onBlur={(e) => {
            // Keyboard users: tabbing out of the nav closes any open panel.
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setAboutOpen(false);
              setSolutionsOpen(false);
              setMarketingOpen(false);
            }
          }}
          className={`hidden xl:flex items-center gap-7 2xl:gap-8 text-base whitespace-nowrap font-semibold transition-colors ${
            onDarkHero ? 'text-white' : 'text-neutral-800'
          }`}
        >
          {/* About Us Dropdown */}
          <div
            className="relative"
            onPointerEnter={mouseOnly(openAbout)}
            onPointerLeave={mouseOnly(closeAboutDelayed)}
          >
            <button
              type="button"
              {...triggerProps(openAbout, setAboutOpen)}
              className={`flex items-center gap-1.5 ${navHoverClass} transition-colors cursor-pointer py-1`}
              aria-haspopup="true"
              aria-expanded={aboutOpen}
            >
              <span>About Us</span>
              <ChevronDown size={16} className={`transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>
            {aboutOpen && (
              <div
                className="absolute top-full whitespace-normal left-0 pt-2 z-50"
                onPointerEnter={mouseOnly(openAbout)}
                onPointerLeave={mouseOnly(closeAboutDelayed)}
              >
                <div className="w-60 bg-white rounded-2xl border border-neutral-200 shadow-2xl p-2.5">
                  <Link
                    href="/about"
                    onClick={() => setAboutOpen(false)}
                    className="block px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-neutral-900 hover:text-blue-600 hover:bg-neutral-50 transition-colors"
                  >
                    Our Story
                  </Link>
                  <Link
                    href="/why-axeon"
                    onClick={() => setAboutOpen(false)}
                    className="block px-3.5 py-2.5 rounded-xl text-[13.5px] text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
                  >
                    Why Axeon
                  </Link>
                  <Link
                    href="/#axeoncore"
                    onClick={(e) => {
                      setAboutOpen(false);
                      scrollToPlatform(e);
                    }}
                    className="block px-3.5 py-2.5 rounded-xl text-[13.5px] text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
                  >
                    What We Build
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div
            className="static"
            onPointerEnter={mouseOnly(openSolutions)}
            onPointerLeave={mouseOnly(closeSolutionsDelayed)}
          >
            <button
              type="button"
              {...triggerProps(openSolutions, setSolutionsOpen)}
              className={`flex items-center gap-1.5 ${navHoverClass} transition-colors cursor-pointer py-1`}
              aria-haspopup="true"
              aria-expanded={solutionsOpen}
            >
              <span>Who We Help</span>
              <ChevronDown size={16} className={`transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {solutionsOpen && (
              <div
                className="absolute top-full whitespace-normal left-1/2 -translate-x-1/2 pt-4 z-50 w-[min(1040px,calc(100vw-2rem))]"
                onPointerEnter={mouseOnly(openSolutions)}
                onPointerLeave={mouseOnly(closeSolutionsDelayed)}
              >
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xl shadow-neutral-900/10 p-6 sm:p-7 backdrop-blur-md">
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 items-stretch">
                    {/* Left Area: Ordered Industry Rows */}
                    <div className="flex-1 flex flex-col justify-between gap-5 min-w-0">
                      {/* Row 1: Home Services */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                            Home Services
                          </span>
                          <div className="h-px flex-1 bg-neutral-100" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                          {homeServicesNiches.map((niche) => (
                            <Link
                              key={niche.slug}
                              href={`/solutions/${niche.slug}`}
                              onClick={() => setSolutionsOpen(false)}
                              className="group flex flex-col justify-start p-2.5 sm:p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60 text-left"
                            >
                              <span className="font-bold text-[13.5px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                                {niche.name}
                              </span>
                              <p className="text-[11.5px] text-neutral-500 group-hover:text-neutral-700 mt-1 leading-snug line-clamp-2">
                                {niche.tagline}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Row 2: Health */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                            Healthcare & Medical
                          </span>
                          <div className="h-px flex-1 bg-neutral-100" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                          {healthNiches.map((niche) => (
                            <Link
                              key={niche.slug}
                              href={`/solutions/${niche.slug}`}
                              onClick={() => setSolutionsOpen(false)}
                              className="group flex flex-col justify-start p-2.5 sm:p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60 text-left"
                            >
                              <span className="font-bold text-[13.5px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                                {niche.name}
                              </span>
                              <p className="text-[11.5px] text-neutral-500 group-hover:text-neutral-700 mt-1 leading-snug line-clamp-2">
                                {niche.tagline}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Row 3: Professional Services */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                            Professional Services
                          </span>
                          <div className="h-px flex-1 bg-neutral-100" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                          {proServicesNiches.map((niche) => (
                            <Link
                              key={niche.slug}
                              href={`/solutions/${niche.slug}`}
                              onClick={() => setSolutionsOpen(false)}
                              className="group flex flex-col justify-start p-2.5 sm:p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60 text-left"
                            >
                              <span className="font-bold text-[13.5px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                                {niche.name}
                              </span>
                              <p className="text-[11.5px] text-neutral-500 group-hover:text-neutral-700 mt-1 leading-snug line-clamp-2">
                                {niche.tagline}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Clean Minimalist Small Business to the side */}
                    <div className="w-full lg:w-[240px] xl:w-[260px] shrink-0 flex flex-col gap-3 pt-5 lg:pt-0 border-t lg:border-t-0 lg:border-l border-neutral-100 lg:pl-6">
                      <Link
                        href="/solutions#small-business"
                        onClick={() => setSolutionsOpen(false)}
                        className="group flex-1 flex flex-col justify-between rounded-2xl bg-neutral-50 hover:bg-blue-50/50 p-5 border border-neutral-200/80 hover:border-blue-200 transition-all text-left"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[15px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                              Small Business
                            </span>
                            <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                              →
                            </span>
                          </div>
                          <p className="text-[12px] text-neutral-500 group-hover:text-neutral-700 mt-2 leading-relaxed">
                            Don&apos;t see your specific field? We build custom storefronts, intake triage, and Custom CRM Pipelines for any business.
                          </p>
                        </div>

                        <div className="mt-6 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[11.5px] font-semibold text-blue-600 group-hover:text-blue-700">
                          <span>Custom Scope</span>
                          <span>Explore →</span>
                        </div>
                      </Link>

                      <Link
                        href="/nonprofits"
                        onClick={() => setSolutionsOpen(false)}
                        className="group flex flex-col rounded-2xl bg-blue-50/60 hover:bg-blue-50 p-5 border border-blue-100 hover:border-blue-200 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[15px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                            Iowa Nonprofits
                          </span>
                          <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </div>
                        <p className="text-[12px] text-neutral-500 group-hover:text-neutral-700 mt-2 leading-relaxed">
                          A free website and search setup for Iowa nonprofits. You only cover basic hosting.
                        </p>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Marketing Solutions Dropdown */}
          <div
            className="static"
            onPointerEnter={mouseOnly(openMarketing)}
            onPointerLeave={mouseOnly(closeMarketingDelayed)}
          >
            <button
              type="button"
              {...triggerProps(openMarketing, setMarketingOpen)}
              className={`flex items-center gap-1.5 ${navHoverClass} transition-colors cursor-pointer py-1`}
              aria-haspopup="true"
              aria-expanded={marketingOpen}
            >
              <span>Marketing Solutions</span>
              <ChevronDown size={16} className={`transition-transform ${marketingOpen ? 'rotate-180' : ''}`} />
            </button>
            {marketingOpen && (
              <div
                className="absolute top-full whitespace-normal left-1/2 -translate-x-1/2 pt-4 z-50 w-[min(920px,calc(100vw-2rem))]"
                onPointerEnter={mouseOnly(openMarketing)}
                onPointerLeave={mouseOnly(closeMarketingDelayed)}
              >
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xl shadow-neutral-900/10 p-6 sm:p-8 backdrop-blur-md">
                  <div className="grid grid-cols-3 gap-x-6 gap-y-5 lg:gap-x-8 lg:gap-y-6">
                    {marketingSolutions.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={(e) => {
                          setMarketingOpen(false);
                          if (item.href === '/#axeoncore') scrollToPlatform(e);
                        }}
                        className="group flex flex-col justify-start p-3.5 sm:p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60 text-left"
                      >
                        <span className="font-bold text-[14.5px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </span>
                        <p className="text-[12.5px] text-neutral-500 group-hover:text-neutral-700 mt-2 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link href="/insights" className={`${navHoverClass} transition-colors py-1 inline-flex items-center`}>
            Insights
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider leading-none align-middle">New</span>
          </Link>
          <Link href="/pricing" className={`${navHoverClass} transition-colors py-1`}>
            Pricing
          </Link>
        </nav>

        <div className="hidden xl:flex items-center gap-5">
          <a
            href="tel:+15154938017"
            className={`hidden 2xl:inline-block text-[15px] font-semibold whitespace-nowrap transition-colors ${
              onDarkHero ? 'text-white hover:text-blue-400' : 'text-neutral-700 hover:text-neutral-950'
            }`}
          >
            (515) 493-8017
          </a>
          <Link
            href="/book"
            className={`hidden lg:inline-flex px-6 py-3 rounded-full border text-base font-semibold whitespace-nowrap transition-all ${
              onDarkHero
                ? 'border-white/30 text-white hover:bg-white/10'
                : 'border-neutral-300 text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50'
            }`}
          >
            Book a Strategy Call
          </Link>
          <Link
            href="/get-started"
            data-track="cta_click"
            data-track-cta="get_started_nav"
            className="px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold whitespace-nowrap shadow-sm hover:shadow-md transition-all"
          >
            Get Started
          </Link>
        </div>

        <div className="flex xl:hidden items-center gap-2.5">
          <Link
            href="/get-started"
            data-track="cta_click"
            data-track-cta="get_started_nav"
            className="inline-flex items-center justify-center px-4 py-3 md:px-6 rounded-full bg-blue-600 text-white text-xs md:text-sm font-semibold"
          >
            Get Started
          </Link>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`p-2.5 transition-colors ${onDarkHero ? 'text-white' : 'text-neutral-800'}`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.32, ease: MOBILE_EASE }, opacity: { duration: 0.2 } }}
            className="xl:hidden overflow-hidden bg-white border-t border-neutral-200"
          >
            <nav
              aria-label="Mobile"
              className="max-h-[calc(100dvh-80px)] overflow-y-auto overscroll-contain px-5 pt-1 pb-6 text-base font-medium"
            >
              <MobileGroup
                label="About Us"
                isOpen={mobileSection === 'about'}
                onToggle={() => toggleMobileSection('about')}
              >
                <div className="flex flex-col">
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl active:bg-neutral-100 text-sm font-semibold text-neutral-900"
                  >
                    Our Story
                  </Link>
                  <Link
                    href="/why-axeon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl active:bg-neutral-100 text-sm text-neutral-600"
                  >
                    Why Axeon
                  </Link>
                  <Link
                    href="/#axeoncore"
                    onClick={scrollToPlatform}
                    className="px-3 py-2.5 rounded-xl active:bg-neutral-100 text-sm text-neutral-600"
                  >
                    What We Build
                  </Link>
                </div>
              </MobileGroup>

              <MobileGroup
                label="Who We Help"
                isOpen={mobileSection === 'help'}
                onToggle={() => toggleMobileSection('help')}
              >
                {/* Small Business on Mobile */}
                <Link
                  href="/solutions#small-business"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-4 p-3.5 rounded-xl bg-neutral-50 active:bg-blue-50/60 border border-neutral-200/80 block text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-neutral-900">Small Business</div>
                    <span className="text-xs font-semibold text-blue-600">Custom Scope →</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 leading-snug">
                    Tailored storefronts, intake triage, and Custom CRM Pipelines for any business.
                  </div>
                </Link>

                <Link
                  href="/nonprofits"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-4 p-3.5 rounded-xl bg-blue-50/60 active:bg-blue-50 border border-blue-100 block text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-neutral-900">Iowa Nonprofits</div>
                    <span className="text-xs font-semibold text-blue-600">Free →</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 leading-snug">
                    A free website and search setup. You only cover basic hosting.
                  </div>
                </Link>

                <div className="space-y-4">
                  {[
                    { title: 'Home Services', items: homeServicesNiches },
                    { title: 'Healthcare & Medical', items: healthNiches },
                    { title: 'Professional Services', items: proServicesNiches },
                  ].map((group) => (
                    <div key={group.title}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1 px-1">
                        {group.title}
                      </span>
                      <div className="flex flex-col">
                        {group.items.map((niche) => (
                          <Link
                            key={niche.slug}
                            href={`/solutions/${niche.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2.5 rounded-xl active:bg-neutral-100 transition-colors block text-left"
                          >
                            <div className="text-sm font-semibold text-neutral-900">{niche.name}</div>
                            <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5 leading-snug">
                              {niche.tagline}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </MobileGroup>

              <MobileGroup
                label="Marketing Solutions"
                isOpen={mobileSection === 'marketing'}
                onToggle={() => toggleMobileSection('marketing')}
              >
                <div className="flex flex-col">
                  {marketingSolutions.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        if (item.href === '/#axeoncore') scrollToPlatform(e);
                      }}
                      className="px-3 py-2.5 rounded-xl active:bg-neutral-100 transition-colors block text-left"
                    >
                      <div className="text-sm font-semibold text-neutral-900">{item.title}</div>
                      <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5 leading-snug">
                        {item.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </MobileGroup>

              <Link
                href="/insights"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[52px] py-3 border-b border-neutral-100 text-[15px] font-semibold text-neutral-900"
              >
                Insights
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider leading-none align-middle">New</span>
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[52px] py-3 border-b border-neutral-100 text-[15px] font-semibold text-neutral-900"
              >
                Pricing
              </Link>
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[52px] py-3 border-b border-neutral-100 text-[15px] font-semibold text-neutral-900"
              >
                Book a Strategy Call
              </Link>
              <a
                href="tel:+15154938017"
                className="flex items-center min-h-[52px] py-3 text-[15px] font-semibold text-blue-600"
              >
                Call (515) 493-8017
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
