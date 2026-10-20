'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { marketingSolutions, services } from '@/data/marketingSolutionsData';
import { cityPages } from '@/data/cityPages';
import { niches } from '@/data/nichesData';

export interface FooterProps {
  year: number;
}

interface FooterLink {
  label: string;
  href: string;
}

const COMPANY_LINKS: FooterLink[] = [
  { label: 'Our Story', href: '/about' },
  { label: 'Why Axeon', href: '/why-axeon' },
  { label: 'Recent builds', href: '/work' },
  { label: 'Process', href: '/process' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Insights', href: '/insights' },
  { label: 'For advisors', href: '/partners' },
  { label: 'FAQ', href: '/faq' },
];

const WHO_WE_HELP_LINKS: FooterLink[] = [
  ...niches.map((niche) => ({ label: niche.name, href: `/solutions/${niche.slug}` })),
  { label: 'All Practice Types', href: '/solutions' },
  { label: 'Des Moines Practices & Firms', href: '/des-moines-web-design' },
  { label: 'Des Moines SEO', href: '/des-moines-seo' },
  ...cityPages.map((city) => ({ label: city.linkLabel, href: `/${city.slug}` })),
  { label: 'Iowa Nonprofits', href: '/nonprofits' },
];

const SERVICE_LINKS: FooterLink[] = services.map((service) => ({ label: service.title, href: service.href }));

const SOLUTION_LINKS: FooterLink[] = [
  { label: 'How It Works', href: '/marketing-solutions' },
  ...marketingSolutions.map((layer) => ({ label: layer.title, href: layer.href })),
  { label: 'AxeonPROOF Client Portal', href: '/axeonproof' },
  { label: 'Check Your Area', href: '/check-your-area' },
];

const SOCIAL_LINKS: FooterLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/axeon-studio' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61593868815413' },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <div className="eyebrow eyebrow-muted mb-4">{title}</div>
      <ul className="space-y-0.5 text-sm text-neutral-600">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-block py-2 hover:text-neutral-950 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Phones: the same columns as tap-to-open rows, so the footer stays about one screen tall. */
function FooterAccordion({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <details className="group">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between eyebrow eyebrow-muted [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={16} className="text-neutral-400 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="grid grid-cols-2 gap-x-4 pb-3 text-sm text-neutral-600">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block py-2.5 leading-snug hover:text-neutral-950 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  { title: 'Company', links: COMPANY_LINKS },
  { title: 'Who We Help', links: WHO_WE_HELP_LINKS },
  { title: 'Services', links: SERVICE_LINKS },
  { title: 'How It Works', links: SOLUTION_LINKS },
];

export function Footer({ year }: FooterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  // Pages that already end with their own closing CTA skip the footer card, so
  // the page never ends with two calls to action back to back.
  const pageHasCloser =
    ['/', '/pricing', '/process', '/why-axeon', '/des-moines-web-design', '/des-moines-seo', '/about', '/marketing-solutions', '/axeonproof', '/partners', '/nonprofits', '/book', '/faq', '/insights', '/check-your-area'].includes(pathname) ||
    cityPages.some((city) => pathname === `/${city.slug}`) ||
    pathname.startsWith('/solutions/') ||
    pathname.startsWith('/marketing-solutions/');

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
    <footer className="w-full bg-white text-neutral-950 py-8 sm:py-12 lg:py-16 px-4 sm:px-8 lg:px-14 xl:px-20 border-t border-neutral-200 overflow-hidden">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto py-2 sm:py-6 lg:py-10">
        {/* CTA (hidden where the page has its own closer) */}
        <div className={`rounded-[28px] bg-neutral-950 text-white p-7 sm:p-10 ${pageHasCloser ? 'hidden' : 'flex'} flex-col lg:flex-row lg:items-center justify-between gap-6`}>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Is your specialty still open in your area?</h3>
            <p className="mt-2 text-neutral-300 text-base sm:text-lg max-w-2xl">
              One practice or firm per specialty within 5 miles. $0 to start. Nothing due until it&apos;s working.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_footer"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
            >
              Check if your area is open
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/25 hover:bg-white/10 text-white font-semibold text-base transition-colors"
            >
              Book a call
            </Link>
          </div>
        </div>

        {/* Contact + link columns */}
        <div className={`${pageHasCloser ? 'mt-0' : 'mt-8'} sm:mt-14 lg:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-12 lg:gap-16`}>
          <div className="lg:col-span-4">
            <div>
              <div className="text-base font-extrabold text-neutral-950 font-display">Axeon Studio</div>
              <div className="text-sm text-neutral-500">Your growth partner · West Des Moines, Iowa</div>
            </div>
            <div className="mt-2 sm:mt-4 flex flex-wrap items-center gap-x-5 sm:block">
              <a
                href="mailto:hello@axeonstudio.co"
                className="block py-2 text-base sm:text-lg font-bold text-neutral-950 hover:text-blue-600 transition-colors break-all sm:break-normal"
              >
                hello@axeonstudio.co
              </a>
              <a
                href="tel:+15154938017"
                className="block py-2 text-base text-neutral-600 hover:text-blue-600 transition-colors"
              >
                (515) 493-8017
              </a>
            </div>
          </div>

          <div className="md:hidden divide-y divide-neutral-200 border-y border-neutral-200">
            {COLUMNS.map((col) => (
              <FooterAccordion key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
          <div className="hidden md:grid lg:col-span-8 grid-cols-4 gap-10">
            {COLUMNS.map((col) => (
              <FooterColumn key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 sm:mt-14 sm:pt-6 sm:border-t border-neutral-200 flex flex-wrap items-center justify-between gap-x-4 gap-y-0 sm:gap-4 text-sm text-neutral-500">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-0">
            <span>© {year} Axeon Studio</span>
            <Link href="/privacy" className="inline-block py-2.5 hover:text-neutral-950 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="inline-block py-2.5 hover:text-neutral-950 transition-colors">
              Terms
            </Link>
          </div>
          <div className="flex items-center gap-2 -ml-3 sm:ml-0">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center min-h-11 min-w-11 px-3 hover:text-neutral-950 transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        {/* Brand wordmark */}
        <div className="mt-4 sm:mt-14 relative flex items-center overflow-hidden">
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
