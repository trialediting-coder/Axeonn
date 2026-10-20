'use client';

import LineIcon from '@/components/common/LineIcon';
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 sm:py-0 sm:h-16 flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={handleBackToHome}
              className="py-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 transition-colors cursor-pointer group"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1 text-[#2563EB]"
              />
              <span>Back to Axeon</span>
            </button>

            <span className="hidden sm:inline text-gray-300">/</span>

            <span className="hidden sm:flex text-sm font-semibold text-gray-950 items-center gap-1.5">
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
            <span>Website &amp; Services Terms</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight font-display">
            Terms of Service
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
            These Terms of Service (&ldquo;Terms&rdquo;) establish a binding legal agreement between you (&ldquo;Client,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and <strong>Axeon Studio</strong> (&ldquo;Axeon,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), governing your access to{' '}
            <a
              href="https://axeonstudio.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>https://axeonstudio.co</span>
              <ExternalLink size={12} />
            </a>{' '}
            and the practice website, patient and client intake, and marketing services we provide. Paid services are governed by the Client Services Agreement you sign with us, summarized below.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-gray-500 font-medium">
            <div>
              <span className="text-gray-400">Last Updated:</span>{' '}
              <strong className="text-gray-900 font-semibold">October 2026</strong>
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
                href="mailto:hello@axeonstudio.co"
                className="text-[#2563EB] hover:underline font-semibold"
              >
                hello@axeonstudio.co
              </a>
            </div>
          </div>
        </div>

        {/* Ownership Guarantee Callout Card */}
        <div className="my-8 sm:my-10 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-blue-50/80 via-slate-50 to-white border border-blue-100 shadow-xs">
          <div className="flex items-start gap-3.5">
            <LineIcon className="text-sm">
              <ShieldCheck size={22} className="text-[#2563EB]" />
            </LineIcon>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-950">
                What You Own, in Plain Terms
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                Your domain, Google Business Profile, and patient and client contact data are <strong>always yours</strong>. The custom website design and code become yours once the 12-month term is paid. The intake system, phone and text numbers, and AxeonPROOF are a service and stop if you leave. Section 04 has the details.
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
                By visiting our website, submitting an inquiry through our forms, requesting an area check, or signing a Client Services Agreement with Axeon Studio, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
              <p>
                <strong>Signed agreements control.</strong> Paid services are provided under a written Client Services Agreement (the &ldquo;Agreement&rdquo;) signed by you and Axeon, including its Schedule A. These Terms summarize that Agreement for the public; if anything here conflicts with a signed Agreement, the signed Agreement controls.
              </p>
              <p>
                If you are entering into these Terms on behalf of a practice, company, or other legal entity, you represent and warrant that you have the authority to bind that entity. If you do not agree to these Terms, you must stop using our site and services.
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
                Axeon Studio provides website, patient and client intake, and marketing services to established private practices and other businesses, including:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-gray-700">
                <li>Custom, mobile-first practice websites, hosting, security, and monitoring</li>
                <li>Intake and messaging systems: missed-call text-back, first replies to web inquiries, online booking, a two-way text inbox, call tracking, and automated review requests</li>
                <li>AxeonPROOF, our client portal for recovered inquiries, change requests, and monthly reports</li>
                <li>On the AxeonGROWTH plan: Google Local Services Ads and search ads management, an AI phone receptionist, database reactivation campaigns, and photo and video</li>
                <li>The area check and the call where we go over what we found, which carry no charge and no obligation</li>
              </ul>
              <p>
                The exact services, deliverables, content-update allowance, and fees for each client are set out in the signed Agreement and its Schedule A. Anything not listed there is outside the scope of the services.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="terms-section-3" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">03.</span>
              <span>Plans, Term &amp; Payment</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                <strong>Initial term:</strong> AxeonCORE and AxeonGROWTH are provided on a twelve (12) month initial term that begins when the services go live or forty-five (45) days after the Agreement&apos;s effective date, whichever comes first. You are responsible for the fees for the full initial term, except as described under the 90-Day Performance Commitment below. A month-to-month option is available where stated in your Agreement.
              </p>
              <p>
                <strong>Renewal:</strong> After the initial term, the Agreement renews month-to-month until either party gives written notice of non-renewal at least thirty (30) days before the end of the then-current term.
              </p>
              <p>
                <strong>Implementation fee:</strong> When you commit to the full 12-month initial term, the plan&apos;s standard implementation fee (for example, $3,000 on AxeonCORE) is waived, so there is nothing to pay at signing. On the month-to-month option, the implementation fee is paid upfront. If you prepay a year, the initial term is billed at the annual price stated in your Agreement.
              </p>
              <p>
                <strong>Billing:</strong> Fees are charged automatically to the payment method on file. The first monthly fee is charged when your services go live (your site is up and every call and inquiry gets a reply within 60 seconds), or forty-five (45) days after signing if go-live is held up waiting on materials or access from you. A prepaid year is charged at signing. Late payments, suspension of services for past-due accounts, and taxes are handled as stated in your Agreement.
              </p>
              <p>
                <strong>Ad spend:</strong> Advertising costs are separate from our fees, are paid by you directly to the advertising platform (for example, Google), and are not refundable by Axeon. Ads management requires a minimum ad spend of $500 per month.
              </p>
              <p>
                <strong>90-Day Performance Commitment:</strong> On AxeonCORE and AxeonGROWTH, we commit that the website and intake systems will go live within thirty (30) days after you deliver the materials and access we need; that, once live, every missed call and web inquiry gets a first reply within sixty (60) seconds (in at least 95% of events, as recorded in AxeonPROOF); and that every completed appointment gets a review request. If we miss any of those before you go live or in your first ninety (90) days live, and do not fix it within fifteen (15) days of your written notice, you can end the Agreement and owe nothing for the rest of the term. Conditions, timing, and exclusions are stated in Section 5 of the Agreement. This is a commitment about how the system performs, not a promise of any number of calls, patients, clients, revenue, or rankings.
              </p>
              <p>
                <strong>Territory exclusivity:</strong> While your account is in good standing on AxeonCORE or AxeonGROWTH, we will not provide the intake systems to another practice with the same primary specialty within five (5) miles of your business address, as described in your Agreement.
              </p>
              <p>
                <strong>Scope changes:</strong> Requests outside your Agreement&apos;s Schedule A, or content updates beyond your monthly allowance, are quoted or billed as described in your Agreement and performed only after your approval.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="terms-section-4" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">04.</span>
              <span>Intellectual Property &amp; Ownership</span>
            </h2>
            <div className="mt-3.5 space-y-3.5 text-gray-700 text-[15px] sm:text-base">
              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="font-bold text-gray-950 text-sm mb-1.5 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2563EB]" />
                  <span>A. Always Yours</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Your domain name, Google Business Profile, your own business phone numbers, the materials you provide to us, and the lead, patient, and client contact data collected through the services remain your property at all times. On request at termination, and once the account is paid in full, we export your contact data to you in a standard format.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="font-bold text-gray-950 text-sm mb-1.5 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2563EB]" />
                  <span>B. Your Website, Once the Term Is Paid</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Once all fees through the end of the initial term are paid in full, Axeon assigns to you the custom website design, page copy, and site code written specifically for you, together with the design files. Until then, Axeon owns them and you have a license to use them for your business.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="font-bold text-gray-950 text-sm mb-1.5 flex items-center gap-2">
                  <Scale size={16} className="text-[#2563EB]" />
                  <span>C. Services, Not Deliverables</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  The intake and messaging system, call tracking and texting numbers, booking, review automation, AI receptionist, reactivation campaigns, and AxeonPROOF are provided as a service for the term of your Agreement and stop when it ends. Axeon also keeps all rights in its pre-existing tools, templates, automations, and reusable code; where those are embedded in your website, you receive a license to use them as part of it.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="font-bold text-gray-950 text-sm mb-1.5 flex items-center gap-2">
                  <Eye size={16} className="text-[#2563EB]" />
                  <span>D. Portfolio &amp; Credit</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Unless your Agreement says otherwise, Axeon may show the website we built, your practice name and logo, and non-confidential results (such as response times and inquiry counts, never patient or client information) in our portfolio and marketing, and may include a small &ldquo;Powered by Axeon&rdquo; credit in your website footer. You may withdraw consent to future use in writing.
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
                <li>Impersonate any individual or misrepresent affiliation with Axeon Studio</li>
                <li>Use our website or services to transmit viruses, trojans, ransomware, or malicious code</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section id="terms-section-6" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">06.</span>
              <span>Client Materials, Messaging &amp; Health Information</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                You represent and warrant that all text, photography, logos, provider information, audio, video, and other materials you provide to Axeon are owned by you or properly licensed, and that your advertising and website claims comply with the laws and professional rules that apply to your practice.
              </p>
              <p>
                <strong>Messaging consent:</strong> Our intake systems send texts, emails, and calls to your leads, patients, and clients on your behalf and in your name. You are responsible for the consents the law requires for those messages, and for approving the scripts and messages we set up.
              </p>
              <p>
                <strong>No health information:</strong> The services are not designed to receive protected health information. Intake collects name, contact, service and preferred time only &mdash; never symptoms, insurance or health details. You agree not to configure or request forms, scripts, or messages that ask for health information, and not to send such information to Axeon. Axeon is not your business associate unless we sign a separate business associate agreement.
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
                EXCEPT AS EXPRESSLY SET FORTH IN A CLIENT SERVICES AGREEMENT SIGNED BY BOTH PARTIES, THE WEBSITE AND ALL SERVICES PROVIDED BY AXEONSTUDIO ARE FURNISHED ON AN &ldquo;AS-IS&rdquo; AND &ldquo;AS-AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              </p>
              <p>
                AXEONSTUDIO SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SITE OR THIRD-PARTY HOSTING INTEGRATIONS WILL BE UNINTERRUPTED, BUG-FREE, OR FREE OF TEMPORARY DOWNTIME CAUSED BY THIRD-PARTY CLOUD PROVIDERS.
              </p>
              <p>
                OTHER THAN THE 90-DAY PERFORMANCE COMMITMENT IN A SIGNED AGREEMENT, AXEON DOES NOT GUARANTEE ANY SEARCH RANKING, TRAFFIC LEVEL, NUMBER OF CALLS, LEADS, PATIENTS, OR CLIENTS, CONVERSION RATE, REVENUE, OR RETURN ON INVESTMENT. RESULTS DEPEND ON FACTORS OUTSIDE OUR CONTROL, INCLUDING YOUR PRICING, REPUTATION, RESPONSIVENESS, COMPETITION, AND SEASONALITY.
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
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AXEONSTUDIO, ITS OWNERS, EMPLOYEES, CONTRACTORS, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES (INCLUDING LOST REVENUE, LOST PROFITS, BUSINESS INTERRUPTION, LOSS OF DATA, OR GOODWILL) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OUR WEBSITE OR CONTRACTED DIGITAL SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                IN ALL CIRCUMSTANCES, AXEONSTUDIO&apos;S AGGREGATE CUMULATIVE MONETARY LIABILITY UNDER THESE TERMS OR ANY ASSOCIATED AGREEMENT SHALL BE STRICTLY LIMITED TO THE ACTUAL FEES PAID BY YOU TO AXEONSTUDIO FOR THE SPECIFIC SERVICE AT ISSUE DURING THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE CLAIM.
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
                You agree to defend, indemnify, and hold harmless Axeon Studio, its owners, and affiliates against any third-party claims, liabilities, losses, damages, and expenses (including reasonable legal fees) arising from or relating to: (a) materials or content provided by you that infringe upon third-party copyrights or trademarks; (b) your violation of these Terms; or (c) your unauthorized commercial use or modification of delivered source code.
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
                You may end your Agreement at the end of the initial term or any renewal month by giving thirty (30) days&apos; written notice. During the initial term, you may end it early only under the 90-Day Performance Commitment or for Axeon&apos;s uncured material breach; otherwise the remaining fees for the initial term become due, as stated in your Agreement.
              </p>
              <p>
                Either party may terminate for the other&apos;s material breach that remains uncured fifteen (15) days after written notice (five (5) days for non-payment). Axeon may also end the Agreement on thirty (30) days&apos; notice, in which case prepaid fees for later periods are refunded and no remaining initial-term fees are due.
              </p>
              <p>
                On termination, the intake systems, hosting, and AxeonPROOF end. If your account is paid in full, we provide your website files, design files, and contact data export, and can keep the site live for a transition period of up to thirty (30) days at your request.
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
                <div className="font-bold text-gray-950 text-base">Axeon Studio</div>
                <div className="text-gray-600">Attention: Legal</div>
                <div className="text-gray-600">West Des Moines, Iowa, United States</div>
                <div className="pt-2 text-gray-900 font-medium">
                  Direct Inquiries:{' '}
                  <a
                    href="mailto:hello@axeonstudio.co"
                    className="text-[#2563EB] hover:underline font-bold"
                  >
                    hello@axeonstudio.co
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
              className="inline-block py-2 text-[#2563EB] font-bold hover:underline cursor-pointer"
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
