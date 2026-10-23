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
import { HideOnAdFunnel } from '@/components/common/HideOnAdFunnel';
import { FreeWebsiteOfferPopup } from '@/components/common/FreeWebsiteOfferPopup';
import { CaseStudyBadge } from '@/components/common/CaseStudyBadge';
import { TextUsButton, TextUsDesktop } from '@/components/common/TextUsButton';
import { InteractionLayer } from '@/components/common/InteractionLayer';
import { buildMetadata } from '@/lib/metadata';
import { JsonLd } from '@/components/common/JsonLd';
import { siteGraphJsonLd } from '@/lib/seo';
import { SELF_SITE_HOST, SELF_SITE_KEY } from '@/lib/selfTracking';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

// Site-wide structured data (ProfessionalService + WebSite)
// lives in lib/seo.ts so every page's Service schema can reference the same
// @id instead of re-inlining NAP.
const siteGraph = siteGraphJsonLd();

export const metadata: Metadata = {
  metadataBase: new URL('https://axeonstudio.co'),
  ...buildMetadata({
    path: '/',
    title: 'Des Moines Digital Marketing Agency | Axeon Studio',
    description:
    'Des Moines digital marketing agency for dental practices, med spas, law firms and CPA firms: every call and inquiry answered in 60 seconds and booked.',
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
        {/*
          Axeon's own AxeonPROOF tracking (lib/selfTracking.ts): the same
          cookie-free, first-party script clients install. Records only on
          axeonstudio.co, so previews, localhost and the app host stay out.
        */}
        <script defer src="/t.js" data-site={SELF_SITE_KEY} data-host={SELF_SITE_HOST} />
        {/* Analytics scripts load once the page has finished loading (lazyOnload), so they don't compete
            with the first paint on phones (Lighthouse mobile, 2026-10-20). gtag() calls
            made before then queue in dataLayer and are sent once it loads. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2EDMD31CEP"
          strategy="lazyOnload"
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
        <Script id="clarity-init" strategy="lazyOnload">
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
        <LeadModalProvider>
          <SmoothScrollProvider>
            <AnalyticsTracker />
            <InteractionLayer />
            {/* Ad landing pages (/go/*) show none of the site chrome: one page, one action. */}
            <HideOnAdFunnel>
              <Header />
            </HideOnAdFunnel>
            <div>
              {children}
              <HideOnAdFunnel>
                <Footer year={new Date().getFullYear()} />
              </HideOnAdFunnel>
            </div>
          </SmoothScrollProvider>
          <HideOnAdFunnel>
            <SideTabCTA />
            <FreeWebsiteOfferPopup />
            <CaseStudyBadge />
            <TextUsButton />
            <TextUsDesktop />
          </HideOnAdFunnel>
        </LeadModalProvider>
      </body>
    </html>
  );
}
