'use client';

import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ArrowRight, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { niches } from '@/data/nichesData';
import { services } from '@/data/marketingSolutionsData';

// The four practice types, grouped the way practice owners think of themselves.
const PRACTICE_GROUPS = [
  { title: 'Healthcare', items: niches.filter((niche) => niche.category === 'Healthcare') },
  { title: 'Professional Services', items: niches.filter((niche) => niche.category === 'Professional Services') },
];

const ABOUT_LINKS: { href: string; label: string; isNew?: boolean }[] = [
  { href: '/about', label: 'Our Story' },
  { href: '/why-axeon', label: 'Why Axeon' },
  { href: '/process', label: 'Process' },
  { href: '/work', label: 'Recent builds' },
  { href: '/insights', label: 'Insights' },
];

const NewPill = () => (
  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider leading-none align-middle">
    New
  </span>
);

/** The AxeonPROOF wordmark as one inline word (no flex gap can split it). Rename it here. */
const ProofWordmark = ({ accent }: { accent: string }) => (
  <span className="whitespace-nowrap">
    Axeon<span className={`font-black ${accent}`}>PROOF</span>
  </span>
);

type MobileSection = 'about' | 'help' | 'services';

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
  // Standalone pages that open on a full-bleed dark hero.
  const isOtherDarkHeroPage =
    ['/nonprofits', '/partners', '/des-moines-web-design', '/des-moines-seo', '/iowa-digital-marketing', '/axeonproof', '/check-your-area'].includes(pathname) ||
    pathname === '/marketing-solutions' ||
    pathname.startsWith('/marketing-solutions/');

  // On the area-check page the header button scrolls to the form instead of
  // reloading the page it is already on (friction audit E12).
  const areaHref = pathname === '/check-your-area' ? '#area-form' : '/check-your-area';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mobileSection, setMobileSection] = useState<MobileSection | null>(null);
  const toggleMobileSection = (section: MobileSection) =>
    setMobileSection((current) => (current === section ? null : section));

  // The nav's "Check your area" button stays hidden until the visitor scrolls past
  // the hero, which carries the page's main CTA (owner, 2026-10-20). The hero is the
  // first section in <main>; the button shows once its bottom passes under the header.
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const update = () => {
      const hero = document.querySelector('main section');
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : window.innerHeight * 0.8;
      // A page whose first section is long content, not a hero (/pricing), shows the
      // button after one screen of scrolling instead.
      setPastHero(heroBottom < 80 || window.scrollY > window.innerHeight);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);
  const navCtaHidden = !pastHero && !mobileMenuOpen;
  const navCtaProps = navCtaHidden ? { 'aria-hidden': true, tabIndex: -1 } : {};
  const navCtaFade = `transition-opacity duration-300 ${navCtaHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape closes whichever desktop panel is open.
  useEffect(() => {
    if (!aboutOpen && !solutionsOpen && !servicesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAboutOpen(false);
      setSolutionsOpen(false);
      setServicesOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aboutOpen, solutionsOpen, servicesOpen]);

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

  const onDarkHero = (isNichePage || isHomePage || isOtherDarkHeroPage) && !isScrolled && !mobileMenuOpen;
  const navHoverClass = `ix-navline ${onDarkHero ? 'hover:text-blue-400 text-white' : 'hover:text-blue-600 text-neutral-800'}`;

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

  const openServices = () => {
    if (servicesTimeoutRef.current) clearTimeout(servicesTimeoutRef.current);
    setServicesOpen(true);
  };
  const closeServicesDelayed = () => {
    servicesTimeoutRef.current = setTimeout(() => setServicesOpen(false), 200);
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

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm py-2.5 sm:py-4'
          : 'bg-transparent py-2.5 sm:py-6'
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
              setServicesOpen(false);
            }
          }}
          className={`hidden xl:flex items-center gap-7 2xl:gap-8 text-base whitespace-nowrap font-semibold [word-spacing:0.14em] transition-colors ${
            onDarkHero ? 'text-white' : 'text-neutral-800'
          }`}
        >
          {/* Who We Help: the four practice types */}
          <div
            className="relative"
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
                className="absolute top-full whitespace-normal -left-4 pt-4 z-50 w-[min(920px,calc(100vw-2rem))]"
                onPointerEnter={mouseOnly(openSolutions)}
                onPointerLeave={mouseOnly(closeSolutionsDelayed)}
              >
                <div className="ix-drop bg-white rounded-2xl border border-neutral-200/90 shadow-2xl shadow-neutral-900/10 p-6 sm:p-7 backdrop-blur-md">
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 items-stretch">
                    <div className="flex-1 flex flex-col gap-5 min-w-0">
                      {PRACTICE_GROUPS.map((group) => (
                        <div key={group.title}>
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">{group.title}</span>
                            <div className="h-px flex-1 bg-neutral-100" />
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {group.items.map((niche) => (
                              <Link
                                key={niche.slug}
                                href={`/solutions/${niche.slug}`}
                                onClick={() => setSolutionsOpen(false)}
                                className="group flex flex-col justify-start p-2.5 sm:p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60 text-left"
                              >
                                <span className="font-bold text-[14px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                                  {niche.name}
                                </span>
                                <p className="text-[11.5px] text-neutral-500 group-hover:text-neutral-700 mt-1 leading-snug line-clamp-2">
                                  {niche.tagline}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Link
                        href="/solutions"
                        onClick={() => setSolutionsOpen(false)}
                        className="px-1 py-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                      >
                        All practices & firms →
                      </Link>
                    </div>

                    {/* Right: the primary next step */}
                    <div className="w-full lg:w-[250px] shrink-0 flex flex-col pt-5 lg:pt-0 border-t lg:border-t-0 lg:border-l border-neutral-100 lg:pl-6">
                      <Link
                        href="/check-your-area"
                        onClick={() => setSolutionsOpen(false)}
                        data-track="cta_click"
                        data-track-cta="area_check_nav_menu"
                        className="group flex-1 flex flex-col justify-between rounded-2xl bg-neutral-950 p-5 text-left text-white transition-colors hover:bg-neutral-900"
                      >
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">$0 to start</span>
                          <p className="mt-2 text-[15px] font-bold leading-snug">Is your specialty still open in your area?</p>
                          <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
                            One practice or firm per specialty within 5 miles. Nothing due until it&apos;s working.
                          </p>
                        </div>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-400 group-hover:text-blue-300">
                          Check your area <ArrowRight size={14} />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Services: the six service pages, each led by its result */}
          <div
            className="relative"
            onPointerEnter={mouseOnly(openServices)}
            onPointerLeave={mouseOnly(closeServicesDelayed)}
          >
            <button
              type="button"
              {...triggerProps(openServices, setServicesOpen)}
              className={`flex items-center gap-1.5 ${navHoverClass} transition-colors cursor-pointer py-1`}
              aria-haspopup="true"
              aria-expanded={servicesOpen}
            >
              <span>Services</span>
              <ChevronDown size={16} className={`transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {servicesOpen && (
              <div
                className="absolute top-full whitespace-normal -left-4 pt-4 z-50 w-[min(640px,calc(100vw-2rem))]"
                onPointerEnter={mouseOnly(openServices)}
                onPointerLeave={mouseOnly(closeServicesDelayed)}
              >
                <div className="ix-drop bg-white rounded-2xl border border-neutral-200/90 shadow-2xl shadow-neutral-900/10 p-5 sm:p-6">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        href={service.href}
                        onClick={() => setServicesOpen(false)}
                        className="group flex flex-col p-2.5 sm:p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60 text-left"
                      >
                        <span className="font-bold text-[14px] text-neutral-900 group-hover:text-blue-600 transition-colors">
                          {service.title}
                        </span>
                        <span className="text-[11.5px] text-neutral-500 group-hover:text-neutral-700 mt-1 leading-snug">
                          {service.outcome}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/marketing-solutions"
                    onClick={() => setServicesOpen(false)}
                    className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-neutral-950 px-4 py-3 text-white hover:bg-neutral-900 transition-colors"
                  >
                    <span>
                      <span className="block text-[13.5px] font-bold">How it works</span>
                      <span className="block text-[11.5px] text-neutral-400 mt-0.5">How the pieces fit together for your practice or firm</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-blue-400" />
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link href="/pricing" className={`${navHoverClass} transition-colors py-1`}>
            Pricing
          </Link>
          <Link href="/axeonproof" className={`${navHoverClass} inline-flex items-center gap-1.5 transition-colors py-1`}>
            <ProofWordmark accent="text-blue-500" />
          </Link>
          {/* The referral program for CPAs, consultants and billing firms. Labelled for
              who it's for: "Partners" read as "how the partnership works" to prospects. */}
          <Link href="/partners" className={`${navHoverClass} transition-colors py-1 whitespace-nowrap`}>
            For advisors
          </Link>

          {/* About Dropdown */}
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
              <span>About</span>
              <ChevronDown size={16} className={`transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>
            {aboutOpen && (
              <div
                className="absolute top-full whitespace-normal right-0 pt-2 z-50"
                onPointerEnter={mouseOnly(openAbout)}
                onPointerLeave={mouseOnly(closeAboutDelayed)}
              >
                <div className="ix-drop w-60 bg-white rounded-2xl border border-neutral-200 shadow-2xl p-2.5">
                  {ABOUT_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setAboutOpen(false)}
                      className="flex items-center px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-neutral-800 hover:text-blue-600 hover:bg-neutral-50 transition-colors"
                    >
                      {link.label}
                      {link.isNew && <NewPill />}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden xl:flex items-center gap-5 [word-spacing:0.14em]">
          <a
            href="tel:+15154938017"
            className={`hidden xl:inline-block text-[15px] font-semibold whitespace-nowrap transition-colors ${
              onDarkHero ? 'text-white hover:text-blue-400' : 'text-neutral-700 hover:text-neutral-950'
            }`}
          >
            (515) 493-8017
          </a>
          <Link
            href="/book"
            className={`hidden min-[1400px]:inline-block text-[15px] font-semibold whitespace-nowrap transition-colors ${
              onDarkHero ? 'text-white hover:text-blue-400' : 'text-neutral-700 hover:text-neutral-950'
            }`}
          >
            Book a call
          </Link>
          <Link
            href={areaHref}
            data-track="cta_click"
            data-track-cta="area_check_nav"
            {...navCtaProps}
            className={`px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold whitespace-nowrap shadow-sm hover:shadow-md ${navCtaFade}`}
          >
            Check your area
          </Link>
        </div>

        <div className="flex xl:hidden items-center gap-0.5 sm:gap-2.5">
          <Link
            href={areaHref}
            data-track="cta_click"
            data-track-cta="area_check_nav"
            {...navCtaProps}
            className={`inline-flex items-center justify-center whitespace-nowrap min-h-[44px] ml-3 px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-blue-600 text-white text-[14px] sm:text-[15px] md:text-sm font-semibold ${navCtaFade}`}
          >
            Check your area
          </Link>
          {/* One tap to call, without opening the menu. */}
          <a
            href="tel:+15154938017"
            aria-label="Call (515) 493-8017"
            className={`hidden min-[375px]:inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors ${onDarkHero ? 'text-white' : 'text-neutral-800'}`}
          >
            <Phone size={20} />
          </a>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors ${onDarkHero ? 'text-white' : 'text-neutral-800'}`}
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
              className="max-h-[calc(100dvh-64px)] sm:max-h-[calc(100dvh-80px)] overflow-y-auto overscroll-contain px-5 pt-1 pb-6 text-base font-medium"
            >
              <MobileGroup
                label="Who We Help"
                isOpen={mobileSection === 'help'}
                onToggle={() => toggleMobileSection('help')}
              >
                <div className="space-y-4">
                  {PRACTICE_GROUPS.map((group) => (
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
                            <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5 leading-snug">{niche.tagline}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/check-your-area"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3.5 rounded-xl bg-neutral-950 block text-left"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">$0 to start</div>
                    <div className="text-sm font-semibold text-white mt-0.5">Check if your area is open →</div>
                  </Link>
                </div>
              </MobileGroup>

              <MobileGroup
                label="Services"
                isOpen={mobileSection === 'services'}
                onToggle={() => toggleMobileSection('services')}
              >
                <div className="flex flex-col">
                  {services.map((service) => (
                    <Link
                      key={service.slug}
                      href={service.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2.5 rounded-xl active:bg-neutral-100 transition-colors block text-left"
                    >
                      <div className="text-sm font-semibold text-neutral-900">{service.title}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 leading-snug">{service.outcome}</div>
                    </Link>
                  ))}
                  <Link
                    href="/marketing-solutions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-1 px-3 py-2.5 rounded-xl active:bg-neutral-100 text-sm font-semibold text-blue-600"
                  >
                    How it works →
                  </Link>
                </div>
              </MobileGroup>

              {[{ href: '/pricing', label: 'Pricing' }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[52px] py-3 border-b border-neutral-100 text-[15px] font-semibold text-neutral-900"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/axeonproof"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[52px] py-3 border-b border-neutral-100 text-[15px] font-semibold text-neutral-900"
              >
                <ProofWordmark accent="text-blue-600" />
              </Link>
              <Link
                href="/partners"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[52px] py-3 border-b border-neutral-100 text-[15px] font-semibold text-neutral-900"
              >
                For advisors
              </Link>
              <MobileGroup
                label="About"
                isOpen={mobileSection === 'about'}
                onToggle={() => toggleMobileSection('about')}
              >
                <div className="flex flex-col">
                  {ABOUT_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2.5 rounded-xl active:bg-neutral-100 text-sm font-semibold text-neutral-900"
                    >
                      {link.label}
                      {link.isNew && <NewPill />}
                    </Link>
                  ))}
                </div>
              </MobileGroup>
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[52px] py-3 border-b border-neutral-100 text-[15px] font-semibold text-neutral-900"
              >
                Book a call
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
