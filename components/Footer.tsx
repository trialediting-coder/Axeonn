'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { niches } from '@/data/nichesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';

export interface FooterProps {
  year: number;
}

export function Footer({ year }: FooterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const handleHomeClick = () => {
    if (!isHomePage) {
      router.push('/');
    } else {
      const lenis = (window as any).__lenis;
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="w-full bg-white text-neutral-950 py-12 lg:py-16 px-4 sm:px-8 lg:px-14 xl:px-20 border-t border-neutral-200 overflow-hidden flex flex-col justify-center">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto h-full flex flex-col justify-between py-6 lg:py-10">
        {/* Top Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-24 pb-8 lg:pb-12 border-b border-neutral-200">
          {/* Left Column: Mission, Founder Avatar & Contact */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-900 leading-snug tracking-tight max-w-xl">
                Got a slow site, a leaky lead pipeline, or an agency ghosting you? Tell us what's broken — we'll tell you exactly how we'd fix it.
              </p>

              {/* Founder Avatar & Title */}
              <div className="flex items-center gap-4 mt-8 group">
                <picture>
                  <source srcSet="/hayder_hatem.webp" type="image/webp" />
                  <img
                    src="/hayder_hatem.png"
                    alt="Hayder Hatem"
                    loading="lazy"
                    decoding="async"
                    width={56}
                    height={56}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/founder-avatar-fallback.webp';
                    }}
                    className="w-14 h-14 rounded-full object-cover border border-neutral-300 shadow-sm group-hover:scale-105 transition-transform"
                  />
                </picture>
                <div>
                  <div className="text-base font-extrabold text-neutral-950 font-display group-hover:text-blue-600 transition-colors">
                    Hayder Hatem
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500 font-medium">
                    Founder • West Des Moines, Iowa
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Phone & Email */}
            <div className="mt-8 sm:mt-10 space-y-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Phone:
                </div>
                <a
                  href="tel:+15154938017"
                  className="text-lg sm:text-xl font-bold text-neutral-900 hover:text-blue-600 transition-colors font-mono"
                >
                  (515) 493-8017
                </a>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Email:
                </div>
                <a
                  href="mailto:hayder.hatem@axeonstudio.co"
                  className="text-lg sm:text-3xl font-black text-neutral-950 hover:text-blue-600 transition-colors font-display tracking-tight break-all sm:break-normal"
                >
                  hayder.hatem@axeonstudio.co
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Navigation, Social & Headquarters moved up */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* Navigation, Solutions, Policies, Social & HQ Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 text-sm">
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3.5">
                  Navigation
                </div>
                <ul className="space-y-2.5 text-neutral-600">
                  <li><Link href="/" className="hover:text-neutral-950 transition-colors">Home</Link></li>
                  <li><Link href="/about" className="hover:text-neutral-950 transition-colors">Our Story</Link></li>
                  <li><Link href="/des-moines-web-design" className="hover:text-neutral-950 transition-colors">Des Moines Web Design</Link></li>
                  <li><Link href="/work" className="hover:text-neutral-950 transition-colors">Work</Link></li>
                  <li><Link href="/process" className="hover:text-neutral-950 transition-colors">Process</Link></li>
                  <li><Link href="/pricing" className="hover:text-neutral-950 transition-colors">Pricing</Link></li>
                  <li><Link href="/pay" className="hover:text-neutral-950 transition-colors">Make a Payment</Link></li>
                  <li><Link href="/insights" className="hover:text-neutral-950 transition-colors">Insights</Link></li>
                  <li><Link href="/faq" className="hover:text-neutral-950 transition-colors">FAQ</Link></li>
                  <li><Link href="/book" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">Book a Strategy Call</Link></li>
                </ul>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3.5">
                  Who We Help
                </div>
                <ul className="space-y-2.5 text-neutral-600">
                  <li>
                    <Link href="/solutions" className="hover:text-neutral-950 transition-colors font-semibold">
                      All Industries
                    </Link>
                  </li>
                  {niches.map((niche) => (
                    <li key={niche.slug}>
                      <Link href={`/solutions/${niche.slug}`} className="hover:text-neutral-950 transition-colors">
                        {niche.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3.5">
                  Marketing Solutions
                </div>
                <ul className="space-y-2.5 text-neutral-600">
                  <li>
                    <Link href="/marketing-solutions" className="hover:text-neutral-950 transition-colors font-semibold">
                      All Solutions
                    </Link>
                  </li>
                  {marketingSolutions.map((solution) => (
                    <li key={solution.id}>
                      <Link href={`/marketing-solutions/${solution.id}`} className="hover:text-neutral-950 transition-colors">
                        {solution.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3.5">
                  Policies &amp; Legal
                </div>
                <ul className="space-y-2.5 text-neutral-600">
                  <li>
                    <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-blue-600 transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy#section-5" className="hover:text-blue-600 transition-colors">
                      Data Governance
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms#terms-section-4" className="hover:text-blue-600 transition-colors">
                      Client Ownership
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3.5">
                  Social
                </div>
                <ul className="space-y-2.5 text-neutral-600">
                  <li>
                    <a
                      href="https://x.com/HayderHatemm"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-neutral-950 transition-colors"
                    >
                      Twitter / X
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/hayderhatemm/"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-neutral-950 transition-colors"
                    >
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/in/hayder-hatem-4a6720318/"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-neutral-950 transition-colors"
                    >
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-neutral-950 transition-colors"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3.5">
                  Headquarters
                </div>
                <p className="text-[13px] sm:text-sm text-neutral-600 leading-relaxed">
                  West Des Moines, IA 50266<br />
                  Central Time Zone (CST)<br />
                  Serving clients nationwide
                </p>
                <div className="mt-4 text-xs text-neutral-400 font-mono">
                  © {year} Axeon Studio.<br />All rights reserved.
                </div>
              </div>
            </div>

            {/* Bottom Statement in Right Column with Policy Links */}
            <div className="pt-8 lg:pt-14 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-400">
              <div className="flex flex-wrap items-center gap-4">
                <span>[ IOWA&apos;S ONE-STOP SHOP FOR GROWING BUSINESSES ]</span>
                <span className="hidden sm:inline">•</span>
                <Link href="/privacy" className="hover:text-neutral-900 underline transition-colors">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-neutral-900 underline transition-colors">
                  Terms
                </Link>
              </div>
              <span>WEST DES MOINES, IA</span>
            </div>
          </div>
        </div>

        {/* Last thing every visitor sees: a way to act, not just the logo */}
        <div className="mt-10 sm:mt-12 rounded-[28px] bg-neutral-950 text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready when you are.</h3>
            <p className="mt-2 text-neutral-300 text-base sm:text-lg max-w-2xl">
              A free 20-minute call. You leave with a clear scope and a flat price, whether or not you hire us.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
            >
              Book a Free Strategy Call
            </Link>
            <a
              href="tel:+15154938017"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/25 hover:bg-white/10 text-white font-semibold text-base transition-colors"
            >
              Call (515) 493-8017
            </a>
          </div>
        </div>

        {/* Giant Bottom Brand Wordmark & Axeon Logo (Significantly Enlarged) */}
        <div className="mt-8 sm:mt-12 relative flex items-center overflow-hidden">
          <div
            id="footer-axeon-brand"
            onClick={handleHomeClick}
            className="flex items-center gap-4 sm:gap-7 lg:gap-11 select-none group cursor-pointer"
            title="Return to Axeon Home"
          >
            {/* Axeon original logo mark - Scaled up to match giant typography */}
            <div className="shrink-0 text-blue-600 group-hover:scale-105 transition-transform duration-300">
              <svg
                viewBox="0 0 24 20"
                className="w-14 h-11 xs:w-20 xs:h-16 sm:w-28 sm:h-23 md:w-36 md:h-30 lg:w-[8vw] lg:h-[6.6vw] drop-shadow-md"
              >
                <defs>
                  <linearGradient id="axeonFooterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="50%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#1E40AF" />
                  </linearGradient>
                </defs>
                <polygon points="6,0 2,20 6,20 10,0" fill="url(#axeonFooterGradient)" />
                <polygon points="14,0 10,20 14,20 18,0" fill="url(#axeonFooterGradient)" />
                <circle cx="21" cy="18" r="2" fill="#1D4ED8" />
              </svg>
            </div>
            <span className="text-[12vw] sm:text-[11vw] lg:text-[9vw] font-black tracking-[-0.07em] leading-none text-neutral-950 font-display">
              AXEON
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
