import type { Metadata } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { AnalyticsTracker } from '@/components/providers/AnalyticsTracker';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LeadModalProvider } from '@/components/common/LeadModalProvider';
import { SideTabCTA } from '@/components/common/SideTabCTA';
import { FreeWebsiteOfferPopup } from '@/components/common/FreeWebsiteOfferPopup';
import { buildMetadata } from '@/lib/metadata';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Axeon Studio',
  url: 'https://axeonstudio.co',
  logo: 'https://axeonstudio.co/icon.png',
  telephone: '+1-515-493-8017',
  email: 'hayder.hatem@axeonstudio.co',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'West Des Moines',
    addressRegion: 'IA',
    postalCode: '50266',
    addressCountry: 'US',
  },
  // Real published pricing floor/ceiling (Core Web Build $2,800 one-time to
  // Acquisition Engine $5,800 one-time) — never widen this to an unsourced range.
  priceRange: '$2800-$5800',
  founder: {
    '@type': 'Person',
    name: 'Hayder Hatem',
  },
  sameAs: ['https://www.linkedin.com/company/axeonstudio'],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://axeonstudio.co'),
  ...buildMetadata({
    path: '/',
    title: 'Axeon Studio | Digital Marketing Solutions for Small Businesses',
    description:
      'The one-stop shop for growing Iowa businesses — website, SEO/AEO/GEO, reviews, social media, and lead capture, built and run by one team. Deployed in 7–14 days.',
  }),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2EDMD31CEP"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2EDMD31CEP', { send_page_view: false });
          `}
        </Script>
        <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
        {/*
          Rendered as a raw script tag (dangerouslySetInnerHTML), not via
          next/script — even next/script's beforeInteractive strategy routes
          through Next's internal __next_s script queue rather than emitting
          a literal <script>...</script> tag, which Apollo's install checker
          didn't recognize as installed. This is the same technique already
          used for the JSON-LD tag above, and produces byte-for-byte the exact
          markup Apollo's own instructions ask for: the script pasted directly
          into the HTML.
        */}
        <script
          id="apollo-tracker"
          dangerouslySetInnerHTML={{
            __html: `function initApollo(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");
o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n,o.async=!0,o.defer=!0,
o.onload=function(){window.trackingFunctions.onLoad({appId:"6aa40b35866f41001c1c9ae4"})},
document.head.appendChild(o)}initApollo();`,
          }}
        />
        <LeadModalProvider>
          <SmoothScrollProvider>
            <AnalyticsTracker />
            <Header />
            <div>
              {children}
              <Footer year={new Date().getFullYear()} />
            </div>
          </SmoothScrollProvider>
          <SideTabCTA />
          <FreeWebsiteOfferPopup />
        </LeadModalProvider>
      </body>
    </html>
  );
}
