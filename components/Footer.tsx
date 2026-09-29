'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { marketingSolutions } from '@/data/marketingSolutionsData';

export interface FooterProps {
  year: number;
}

interface FooterLink {
  label: string;
  href: string;
}

const COMPANY_LINKS: FooterLink[] = [
  { label: 'Our Story', href: '/about' },
  { label: 'Process', href: '/process' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Insights', href: '/insights' },
  { label: 'Partners', href: '/partners' },
  { label: 'FAQ', href: '/faq' },
];

const WHO_WE_HELP_LINKS: FooterLink[] = [
  { label: 'All Industries', href: '/solutions' },
  { label: 'Small Business', href: '/solutions#small-business' },
  { label: 'Des Moines Businesses', href: '/des-moines-web-design' },
  { label: 'Iowa Nonprofits', href: '/nonprofits' },
];

const SOLUTION_LINKS: FooterLink[] = [
  { label: 'All Solutions', href: '/marketing-solutions' },
  ...marketingSolutions.map((solution) => ({
    label: solution.title,
    href: `/marketing-solutions/${solution.id}`,
  })),
];

const SOCIAL_LINKS: FooterLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hayder-hatem-4a6720318/' },
  { label: 'Instagram', href: 'https://www.instagram.com/hayderhatemm/' },
  { label: 'X', href: 'https://x.com/HayderHatemm' },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-4">{title}</div>
      <ul className="space-y-2.5 text-sm text-neutral-600">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-neutral-950 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
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
    <footer className="w-full bg-white text-neutral-950 py-12 lg:py-16 px-4 sm:px-8 lg:px-14 xl:px-20 border-t border-neutral-200 overflow-hidden">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto py-6 lg:py-10">
        {/* CTA */}
        <div className="rounded-[28px] bg-neutral-950 text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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

        {/* Contact + link columns */}
        <div className="mt-14 lg:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-4">
              <picture>
                <source srcSet="/hayder_hatem.webp" type="image/webp" />
                <img
                  src="/hayder_hatem.png"
                  alt="Hayder Hatem"
                  loading="lazy"
                  decoding="async"
                  width={48}
                  height={48}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/founder-avatar-fallback.webp';
                  }}
                  className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                />
              </picture>
              <div>
                <div className="text-base font-extrabold text-neutral-950 font-display">Hayder Hatem</div>
                <div className="text-sm text-neutral-500">Founder · West Des Moines, Iowa</div>
              </div>
            </div>
            <div className="mt-6 space-y-1.5">
              <a
                href="mailto:hayder.hatem@axeonstudio.co"
                className="block text-base sm:text-lg font-bold text-neutral-950 hover:text-blue-600 transition-colors break-all sm:break-normal"
              >
                hayder.hatem@axeonstudio.co
              </a>
              <a
                href="tel:+15154938017"
                className="block text-base text-neutral-600 hover:text-blue-600 transition-colors"
              >
                (515) 493-8017
              </a>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10">
            <FooterColumn title="Company" links={COMPANY_LINKS} />
            <FooterColumn title="Who We Help" links={WHO_WE_HELP_LINKS} />
            <FooterColumn title="Solutions" links={SOLUTION_LINKS} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© {year} Axeon Studio</span>
            <Link href="/privacy" className="hover:text-neutral-950 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neutral-950 transition-colors">
              Terms
            </Link>
            <Link href="/pay" className="hover:text-neutral-950 transition-colors">
              Make a Payment
            </Link>
          </div>
          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-neutral-950 transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        {/* Brand wordmark */}
        <div className="mt-10 sm:mt-14 relative flex items-center overflow-hidden">
          <div
            id="footer-axeon-brand"
            onClick={handleHomeClick}
            className="flex items-center gap-4 sm:gap-7 lg:gap-11 select-none group cursor-pointer"
            title="Return to Axeon Home"
          >
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
