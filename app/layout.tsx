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
import { JsonLd } from '@/components/common/JsonLd';
import { siteGraphJsonLd } from '@/lib/seo';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

// Site-wide structured data (ProfessionalService + founder Person + WebSite)
// lives in lib/seo.ts so every page's Service schema can reference the same
// @id instead of re-inlining NAP.
const siteGraph = siteGraphJsonLd();

export const metadata: Metadata = {
  metadataBase: new URL('https://axeonstudio.co'),
  ...buildMetadata({
    path: '/',
    title: 'Web Design & Digital Marketing in Des Moines, IA | Axeon Studio',
    description:
      'Axeon Studio builds websites, SEO/AEO/GEO, AI scheduling, and lead pipelines for Des Moines-area businesses — flat pricing, live in 7–14 days, one Iowa team you can call.',
  }),
  other: {
    'geo.region': 'US-IA',
    'geo.placename': 'West Des Moines',
    'geo.position': '41.5772;-93.7538',
    ICBM: '41.5772, -93.7538',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={plusJakartaSans.variable}>
      <body>
        <JsonLd data={siteGraph} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2EDMD31CEP"
          strategy="afterInteractive"
        />
        {/*
          Privacy signals. We honor the Global Privacy Control header/JS signal
          (required to be treated as an opt-out under CCPA/CPRA and several
          other US state laws): when set, analytics cookies are denied, and the
          session-replay and visitor-identification scripts below are skipped.
          The privacy policy (Section 4) describes exactly this behavior, so keep
          the two in sync.
        */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.__axeonOptOut = navigator.globalPrivacyControl === true;
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: window.__axeonOptOut ? 'denied' : 'granted'
            });
            gtag('js', new Date());
            gtag('config', 'G-2EDMD31CEP', { send_page_view: false, allow_google_signals: false });
          `}
        </Script>
        {/* Microsoft Clarity — heatmaps & session recordings (skipped under GPC) */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            if (navigator.globalPrivacyControl !== true) {
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "ymcb58hvrp");
            }
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
document.head.appendChild(o)}if(navigator.globalPrivacyControl!==true){initApollo();}`,
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
