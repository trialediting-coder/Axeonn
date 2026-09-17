'use client';

import { useEffect, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileCheck2,
  ExternalLink,
  Scale,
  ShieldCheck,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function TermsClient() {
  const router = useRouter();

  const handleBackToHome = (e?: MouseEvent) => {
    if (e) e.preventDefault();
    router.push('/');
  };

  const handleNavigateToPrivacy = (e?: MouseEvent) => {
    if (e) e.preventDefault();
    router.push('/privacy');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFC] text-gray-900 font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Sub-Header Legal Breadcrumbs Bar */}
      <div className="w-full bg-white/95 border-b border-gray-200/80 pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackToHome}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 transition-colors cursor-pointer group"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1 text-[#2563EB]"
              />
              <span>Back to Axeon</span>
            </button>

            <span className="text-gray-300">/</span>

            <span className="text-sm font-semibold text-gray-950 flex items-center gap-1.5">
              <Scale size={16} className="text-[#2563EB]" />
              <span>Legal Center</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNavigateToPrivacy}
              className="text-xs sm:text-sm font-medium text-gray-600 hover:text-[#2563EB] transition-colors cursor-pointer px-3 py-1.5 rounded-md hover:bg-gray-100"
            >
              Privacy Policy &rarr;
            </button>
            <button
              type="button"
              onClick={() => router.push('/book')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1d4ed8] transition-all shadow-xs cursor-pointer"
            >
              <span>Let&apos;s Talk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Document Header */}
        <div className="border-b border-gray-200 pb-8 sm:pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            <FileCheck2 size={13} />
            <span>Master Client Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight font-display">
            Terms of Service
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
            These Terms of Service (&ldquo;Terms&rdquo;) establish a binding legal agreement between you (&ldquo;Client,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and <strong>AxeonStudio</strong> (&ldquo;Axeon,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), governing your access to{' '}
            <a
              href="https://axeonstudio.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>https://axeonstudio.co</span>
              <ExternalLink size={12} />
            </a>{' '}
            and the professional digital web design, visual branding, and custom software development services we provide.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-gray-500 font-medium">
            <div>
              <span className="text-gray-400">Last Updated:</span>{' '}
              <strong className="text-gray-900 font-semibold">September 2026</strong>
            </div>
            <span className="hidden sm:inline text-gray-300">&bull;</span>
            <div>
              <span className="text-gray-400">Governing Law:</span>{' '}
              <strong className="text-gray-900 font-semibold">State of Iowa, United States</strong>
            </div>
            <span className="hidden sm:inline text-gray-300">&bull;</span>
            <div>
              <span className="text-gray-400">Legal Contact:</span>{' '}
              <a
                href="mailto:hayder.hatem@axeonstudio.co"
                className="text-[#2563EB] hover:underline font-semibold"
              >
                hayder.hatem@axeonstudio.co
              </a>
            </div>
          </div>
        </div>

        {/* Ownership Guarantee Callout Card */}
        <div className="my-8 sm:my-10 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-blue-50/80 via-slate-50 to-white border border-blue-100 shadow-xs">
          <div className="flex items-start gap-3.5">
            <ShieldCheck size={22} className="text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-950">
                The Axeon Standard: 100% Total Client Ownership
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                When project delivery is completed and invoiced balances are settled in full, the keys, code, bespoke design assets, and production infrastructure are <strong>entirely yours</strong>. We build with zero hostage software, zero mandatory monthly agency retainers, and zero proprietary lock-in dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Body Sections */}
        <div className="space-y-10 sm:space-y-12 text-gray-800 text-base leading-relaxed">
          {/* Section 1 */}
          <section id="terms-section-1" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">01.</span>
              <span>Acceptance of Terms</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                By visiting our website, submitting an inquiry via our contact forms, requesting a website audit, or executing a proposal or Statement of Work (&ldquo;SOW&rdquo;) with AxeonStudio, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
              <p>
                If you are entering into these Terms on behalf of an enterprise, company, or legal entity, you represent and warrant that you possess the full legal authority to bind that entity to this agreement. If you do not agree to these Terms, you must immediately cease use of our site and services.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="terms-section-2" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">02.</span>
              <span>Description of Services</span>
            </h2>
            <div className="mt-3.5 space-y-3.5 text-gray-700 text-[15px] sm:text-base">
              <p>
                AxeonStudio provides bespoke digital agency, design, and engineering services to businesses, including but not limited to:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-gray-700">
                <li>Visual brand identity, typography, design systems, and art direction</li>
                <li>Custom responsive UI/UX web design and conversion funnel architecture</li>
                <li>High-performance web development (React, Next.js, Vite, TypeScript, Tailwind CSS)</li>
                <li>Digital conversion optimization, technical audits, and performance consulting</li>
              </ul>
              <p>
                Specific deliverables, project milestones, production timelines, and pricing for bespoke client engagements are formalized in individualized Statements of Work, written project quotes, or contractual addenda executed between the Client and AxeonStudio.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="terms-section-3" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">03.</span>
              <span>Client Engagements &amp; Payment Terms</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                <strong>Invoicing &amp; Retainers:</strong> Unless expressly specified otherwise in an executed Statement of Work, custom development engagements require an upfront commitment deposit prior to kickoff, with remaining milestone balances invoiced upon sprint deliverables or final sign-off.
              </p>
              <p>
                <strong>Late Invoices:</strong> Invoices are payable upon receipt or within net-15 days as detailed on the invoice. Unpaid balances past thirty (30) days may result in temporary suspension of active engineering sprints or deployment handoffs until resolved.
              </p>
              <p>
                <strong>Scope Adjustments:</strong> Requests for features, revisions, or technical architectures outside the mutually agreed project brief will be billed according to our agreed hourly rate or an amended change-order SOW.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="terms-section-4" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">04.</span>
              <span>Intellectual Property &amp; Deliverable Ownership</span>
            </h2>
            <div className="mt-3.5 space-y-3.5 text-gray-700 text-[15px] sm:text-base">
              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="font-bold text-gray-950 text-sm mb-1.5 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2563EB]" />
                  <span>A. Final Client Deliverables</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Upon full and final payment of all agreed project fees, AxeonStudio assigns to the Client all right, title, and interest (including worldwide copyright) in the bespoke final deliverables created specifically for the Client (including custom illustrations, bespoke Figma layouts, client-specific frontend source code, and logo vector files).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="font-bold text-gray-950 text-sm mb-1.5 flex items-center gap-2">
                  <Scale size={16} className="text-[#2563EB]" />
                  <span>B. AxeonStudio Pre-Existing IP &amp; Tooling</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  AxeonStudio retains exclusive ownership of all pre-existing software, generic utility functions, scaffolding scripts, starter boilerplates, and developer tooling developed independently prior to or outside of the specific Client engagement. We grant the Client a perpetual, irrevocable, royalty-free, worldwide license to utilize such components as embedded within their delivered application.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="font-bold text-gray-950 text-sm mb-1.5 flex items-center gap-2">
                  <Eye size={16} className="text-[#2563EB]" />
                  <span>C. Portfolio &amp; Case Study Showcase Rights</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Unless the Client and AxeonStudio have executed an explicit non-disclosure agreement (NDA) specifying otherwise, AxeonStudio reserves the right to display visual previews, screenshots, design mockups, and descriptions of the completed deliverables in our design portfolio, case studies, social channels, and promotional materials as authentic proof of work.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="terms-section-5" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">05.</span>
              <span>Acceptable Use &amp; Prohibited Conduct</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                When accessing our website or utilizing our communication channels, you agree not to:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-gray-700">
                <li>Engage in automated scraping, spidering, or harvesting of our proprietary articles, case studies, or brand graphics without prior written consent</li>
                <li>Probe, scan, or conduct unauthorized vulnerability testing against our infrastructure or hosting platforms</li>
                <li>Submit misleading, malicious, automated spam, or fraudulent project audit inquiries</li>
                <li>Impersonate any individual or misrepresent affiliation with AxeonStudio</li>
                <li>Use our website or services to transmit viruses, trojans, ransomware, or malicious code</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section id="terms-section-6" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">06.</span>
              <span>Client Materials &amp; Third-Party Rights</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                The Client represents and warrants that all text, photography, graphic trademarks, logos, audio, video, and copy provided to AxeonStudio for incorporation into websites or branding materials are either owned by the Client or properly licensed. The Client assumes full responsibility for securing necessary permissions and licensing for commercial publication.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="terms-section-7" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">07.</span>
              <span>Disclaimer of Warranties (&ldquo;As-Is&rdquo;)</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p className="uppercase text-xs tracking-wider font-bold text-gray-500">
                Important Legal Disclaimer
              </p>
              <p>
                EXCEPT AS EXPRESSLY SET FORTH IN A WRITTEN STATEMENT OF WORK SIGNED BY BOTH PARTIES, THE WEBSITE AND ALL SERVICES PROVIDED BY AXEONSTUDIO ARE FURNISHED ON AN &ldquo;AS-IS&rdquo; AND &ldquo;AS-AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              </p>
              <p>
                AXEONSTUDIO SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SITE OR THIRD-PARTY HOSTING INTEGRATIONS WILL BE UNINTERRUPTED, BUG-FREE, OR FREE OF TEMPORARY DOWNTIME CAUSED BY THIRD-PARTY CLOUD PROVIDERS.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="terms-section-8" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">08.</span>
              <span>Limitation of Liability</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AXEONSTUDIO, ITS FOUNDER, EMPLOYEES, CONTRACTORS, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES (INCLUDING LOST REVENUE, LOST PROFITS, BUSINESS INTERRUPTION, LOSS OF DATA, OR GOODWILL) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OUR WEBSITE OR CONTRACTED DIGITAL SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                IN ALL CIRCUMSTANCES, AXEONSTUDIO&apos;S AGGREGATE CUMULATIVE MONETARY LIABILITY UNDER THESE TERMS OR ANY ASSOCIATED SOW SHALL BE STRICTLY LIMITED TO THE ACTUAL FEES PAID BY YOU TO AXEONSTUDIO FOR THE SPECIFIC SERVICE AT ISSUE DURING THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE CLAIM.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="terms-section-9" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">09.</span>
              <span>Indemnification</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                You agree to defend, indemnify, and hold harmless AxeonStudio, its founder, and affiliates against any third-party claims, liabilities, losses, damages, and expenses (including reasonable legal fees) arising from or relating to: (a) materials or content provided by you that infringe upon third-party copyrights or trademarks; (b) your violation of these Terms; or (c) your unauthorized commercial use or modification of delivered source code.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="terms-section-10" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">10.</span>
              <span>Termination &amp; Wind-Down</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                Either party may terminate an active project engagement in the event of a material breach by the other party that remains uncured after fourteen (14) days written notice.
              </p>
              <p>
                Upon early termination by the Client without cause, the Client remains responsible for pro-rata payment of all hours worked and milestones achieved through the effective date of termination. AxeonStudio will promptly release all work-in-progress files corresponding to paid milestones.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section id="terms-section-11" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">11.</span>
              <span>Governing Law &amp; Dispute Resolution</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                These Terms and any project engagements shall be governed by, construed, and enforced in accordance with the laws of the <strong>State of Iowa</strong>, United States, without giving effect to any principles of conflicts of law.
              </p>
              <p>
                The parties agree that any action or proceeding arising out of or related to these Terms shall be instituted exclusively in the state or federal courts located within Polk County, Iowa. Both parties irrevocably submit to the personal jurisdiction of such courts.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="terms-section-12" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">12.</span>
              <span>Modifications &amp; Contact Information</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                We reserve the right to update or modify these Terms of Service at any time. Changes become effective immediately upon posting to this URL with an updated &ldquo;Last Updated&rdquo; date. Continued interaction with our website or engagement of our services after any modification constitutes affirmative acceptance of the revised Terms.
              </p>
              <div className="mt-4 p-5 rounded-xl bg-white border border-gray-200 space-y-1.5 text-sm">
                <div className="font-bold text-gray-950 text-base">AxeonStudio</div>
                <div className="text-gray-600">Attention: Hayder Hatem, Founder</div>
                <div className="text-gray-600">West Des Moines, Iowa, United States</div>
                <div className="pt-2 text-gray-900 font-medium">
                  Direct Inquiries:{' '}
                  <a
                    href="mailto:hayder.hatem@axeonstudio.co"
                    className="text-[#2563EB] hover:underline font-bold"
                  >
                    hayder.hatem@axeonstudio.co
                  </a>
                </div>
                <div className="text-gray-600">
                  Website:{' '}
                  <a
                    href="https://axeonstudio.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:underline"
                  >
                    https://axeonstudio.co
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Switcher Banner */}
        <div className="mt-14 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Looking for how we collect, handle, and protect data?{' '}
            <button
              type="button"
              onClick={handleNavigateToPrivacy}
              className="text-[#2563EB] font-bold hover:underline cursor-pointer"
            >
              Read our Privacy Policy &rarr;
            </button>
          </div>

          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Axeon Homepage</span>
          </button>
        </div>
      </main>
    </div>
  );
}
