'use client';

import { useEffect, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function PrivacyClient() {
  const router = useRouter();

  const handleBackToHome = (e?: MouseEvent) => {
    if (e) e.preventDefault();
    router.push('/');
  };

  const handleNavigateToTerms = (e?: MouseEvent) => {
    if (e) e.preventDefault();
    router.push('/terms');
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
              <ShieldCheck size={16} className="text-[#2563EB]" />
              <span>Legal Center</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNavigateToTerms}
              className="text-xs sm:text-sm font-medium text-gray-600 hover:text-[#2563EB] transition-colors cursor-pointer px-3 py-1.5 rounded-md hover:bg-gray-100"
            >
              Terms of Service &rarr;
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
            <ShieldCheck size={13} />
            <span>Official Policy Document</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight font-display">
            Privacy Policy
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
            This Privacy Policy describes how <strong>AxeonStudio</strong> (&ldquo;Axeon,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, protects, and discloses your information when you visit{' '}
            <a
              href="https://axeonstudio.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>https://axeonstudio.co</span>
              <ExternalLink size={12} />
            </a>{' '}
            or engage our digital web design, branding, and development services.
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
              <span className="text-gray-400">Contact:</span>{' '}
              <a
                href="mailto:hayder.hatem@axeonstudio.co"
                className="text-[#2563EB] hover:underline font-semibold"
              >
                hayder.hatem@axeonstudio.co
              </a>
            </div>
          </div>
        </div>

        {/* Quick Highlights Summary Card */}
        <div className="my-8 sm:my-10 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-white border border-blue-100 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Key Principles &amp; Plain English Summary
              </h2>
              <ul className="mt-2.5 space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed list-disc list-inside">
                <li>
                  <strong>We do not sell your personal data.</strong> Your information is never brokered, rented, or traded.
                </li>
                <li>
                  <strong>Direct inquiry usage only:</strong> Booking and scheduling details (name, email, phone) submitted through our booking calendar are processed solely to communicate with you regarding design and engineering projects.
                </li>
                <li>
                  <strong>Privacy-respecting analytics &amp; tracking:</strong> We utilize Google Analytics (GA4) to evaluate website traffic patterns, and our embedded booking widget (provided by a third-party CRM and scheduling platform) to manage appointment scheduling and confirmation.
                </li>
                <li>
                  <strong>Full user control:</strong> You may request access to, correction of, or complete deletion of your data at any time by emailing us directly.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Body Sections */}
        <div className="space-y-10 sm:space-y-12 text-gray-800 text-base leading-relaxed">
          {/* Section 1 */}
          <section id="section-1" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">01.</span>
              <span>Information We Collect</span>
            </h2>
            <div className="mt-3.5 space-y-4 text-gray-700 text-[15px] sm:text-base">
              <p>
                We only collect personal information that is reasonably necessary to provide high-quality digital design, branding, and development services to businesses. The categories of information we collect include:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="font-bold text-gray-950 text-sm flex items-center gap-2 mb-2">
                    <Mail size={16} className="text-[#2563EB]" />
                    <span>A. Information You Voluntarily Provide</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    When you schedule a session through our booking calendar, we collect:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm text-gray-700 list-disc list-inside">
                    <li>Full Name</li>
                    <li>Email Address</li>
                    <li>Phone Number</li>
                    <li>Company / Organization Name</li>
                    <li>Project scope, budget, and business requirements</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="font-bold text-gray-950 text-sm flex items-center gap-2 mb-2">
                    <Eye size={16} className="text-[#2563EB]" />
                    <span>B. Information Collected Automatically</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    When you navigate our website, our servers and third-party monitoring tools automatically collect pseudonymous technical metrics:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm text-gray-700 list-disc list-inside">
                    <li>Browser type, version, and language</li>
                    <li>Operating system and device category</li>
                    <li>Referring URL and exit pages</li>
                    <li>Pages viewed, session duration, and click paths</li>
                    <li>General geographic location (city/region level)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">02.</span>
              <span>How We Use Your Information</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                We use the information we collect strictly for commercial, communication, and operational purposes:
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>
                  <strong>Client Discovery &amp; Proposals:</strong> Responding to client inquiries, scheduling 30-minute discovery calls, analyzing website architectures, and delivering tailored digital proposals.
                </li>
                <li>
                  <strong>Project Execution:</strong> Collaborating on branding, UI/UX design deliverables, web development, and digital conversion systems.
                </li>
                <li>
                  <strong>Service Improvement:</strong> Measuring website responsiveness, diagnosing technical errors, optimizing page load speeds, and preventing fraudulent submissions.
                </li>
                <li>
                  <strong>Legal &amp; Compliance:</strong> Enforcing our Terms of Service and complying with applicable state and federal legal obligations.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">03.</span>
              <span>Third-Party Processors &amp; Service Providers</span>
            </h2>
            <div className="mt-3.5 space-y-4 text-gray-700 text-[15px] sm:text-base">
              <p>
                We partner with vetted, industry-leading third-party service providers who assist us in hosting, operating, and communicating through our website. These providers only process information as instructed by us and are obligated to uphold strict confidentiality:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-950 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      <span>Vercel Analytics</span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">
                      We utilize Vercel to host our application and track Core Web Vitals (page speed, layout shift, load latency). Vercel Analytics does not log personal information or cross-site tracking identities.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 shrink-0">Performance</span>
                </div>

                <div className="p-4 rounded-lg bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-950 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      <span>Google Analytics (GA4 — ID: G-2EDMD31CEP)</span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">
                      Google Analytics collects aggregated, pseudonymous statistics regarding visitor traffic, device categories, and page engagements to help us understand which services and case studies are most valuable to business owners.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 shrink-0">Traffic Metrics</span>
                </div>

                <div className="p-4 rounded-lg bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-950 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      <span>Third-Party CRM &amp; Scheduling Platform</span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">
                      Our embedded booking calendar is powered by our third-party CRM and scheduling platform. When you book a call through the calendar, that platform processes your submitted details to confirm the appointment and route it into our client relationship workflow.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 shrink-0">Scheduling</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">04.</span>
              <span>Cookies, Tracking &amp; Google Analytics Disclosure</span>
            </h2>
            <div className="mt-3.5 space-y-3.5 text-gray-700 text-[15px] sm:text-base">
              <p>
                Our website utilizes standard HTTP cookies and similar client-side script technologies to maintain security, preserve user preferences, and collect anonymous aggregate analytics:
              </p>
              <ul className="space-y-2.5 list-disc list-inside text-gray-700">
                <li>
                  <strong>Essential Cookies:</strong> Required for fundamental site features, CSRF protection, and responsive viewport sizing.
                </li>
                <li>
                  <strong>Google Analytics (GA4 - G-2EDMD31CEP):</strong> Google Analytics uses cookies (such as <code className="px-1.5 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-900">_ga</code> and <code className="px-1.5 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-900">_ga_*</code>) to distinguish unique sessions and evaluate general browsing activity. IP addresses are anonymized and masked by default.
                </li>
                <li>
                  <strong>Booking Calendar Session Cookies:</strong> Our embedded booking widget, provided by our third-party CRM and scheduling platform, sets its own session cookies to manage appointment selection and confirm bookings when you use the calendar.
                </li>
              </ul>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-700">
                <div className="font-bold text-gray-950 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-amber-600" />
                  <span>How to Opt Out of Tracking &amp; Analytics</span>
                </div>
                You can prevent Google Analytics from logging visits by disabling third-party cookies in your browser settings, using privacy-focused browser shields (such as Brave or Firefox Enhanced Tracking Protection), or by installing the official{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Google Analytics Opt-Out Browser Add-on</span>
                  <ExternalLink size={11} />
                </a>.
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">05.</span>
              <span>Data Retention &amp; Security Measures</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                We retain voluntarily provided contact details (name, email, phone) only for as long as necessary to fulfill the business relationship, evaluate prospective projects, or satisfy recordkeeping requirements under Iowa commercial laws.
              </p>
              <p>
                We apply modern industry-standard administrative and technical safeguards to secure your personal data, including:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-gray-700">
                <li>End-to-end HTTPS encryption (TLS/SSL) for all website transmission</li>
                <li>Restricted, authenticated administrative access to contact inquiries</li>
                <li>Zero storage of payment card numbers or sensitive financial credentials on our servers</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">06.</span>
              <span>Your Privacy Rights &amp; Choices</span>
            </h2>
            <div className="mt-3.5 space-y-3.5 text-gray-700 text-[15px] sm:text-base">
              <p>
                Regardless of where you reside, AxeonStudio honors fundamental privacy rights regarding your personal information:
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-700">
                <li>
                  <strong>Right to Access:</strong> You may request confirmation of whether we hold personal data about you and obtain a clear copy.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> You may ask us to update or correct inaccurate or incomplete contact records.
                </li>
                <li>
                  <strong>Right to Deletion:</strong> You may request that we permanently delete your contact information and submitted project inquiries from our active databases.
                </li>
                <li>
                  <strong>Right to Non-Discrimination:</strong> We will never deny services, charge varying rates, or alter project delivery because you exercised your privacy rights.
                </li>
              </ul>

              <div className="mt-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-gray-950 text-sm">
                    How to submit an access or deletion request
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    Email us with the subject line &ldquo;Privacy Request&rdquo; and we will confirm completion within 15 business days.
                  </p>
                </div>
                <a
                  href="mailto:hayder.hatem@axeonstudio.co?subject=Privacy%20Request"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs sm:text-sm font-semibold hover:bg-[#1d4ed8] transition-colors shrink-0 shadow-xs"
                >
                  <Mail size={14} />
                  <span>Email Privacy Request</span>
                </a>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">07.</span>
              <span>Children&apos;s Privacy (COPPA)</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                Our services, website, and commercial proposals are exclusively designed and intended for business owners, corporate executives, and working professionals aged 18 and older. We do not knowingly solicit, collect, or process information from children under the age of 13. If you believe a child has provided us with personal information, please contact us immediately for prompt deletion.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">08.</span>
              <span>Governing Law &amp; Jurisdiction</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                This Privacy Policy, our data collection practices, and all related interactions are governed by and construed in accordance with the laws of the <strong>State of Iowa</strong>, United States, without regard to conflict of law principles. Any dispute arising under this policy shall be subject to the exclusive jurisdiction of the state and federal courts located in Polk County, Iowa.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">09.</span>
              <span>Updates to This Policy</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                We may periodically update this Privacy Policy to reflect modifications to our digital services, third-party tooling, or applicable statutory requirements. When revisions occur, we will update the &ldquo;Last Updated&rdquo; date at the top of this page. Your continued use of our website or engagement of our services after any update signifies your acceptance of the revised terms.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="section-10" className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-lg font-extrabold">10.</span>
              <span>Contact Information</span>
            </h2>
            <div className="mt-3.5 space-y-3 text-gray-700 text-[15px] sm:text-base">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our data management practices, please contact us directly:
              </p>
              <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-1.5 text-sm">
                <div className="font-bold text-gray-950 text-base">AxeonStudio</div>
                <div className="text-gray-600">Attention: Hayder Hatem, Founder</div>
                <div className="text-gray-600">West Des Moines, Iowa, United States</div>
                <div className="pt-2 text-gray-900 font-medium">
                  Direct Email:{' '}
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
            Looking for our customer and engagement agreement?{' '}
            <button
              type="button"
              onClick={handleNavigateToTerms}
              className="text-[#2563EB] font-bold hover:underline cursor-pointer"
            >
              Review the Terms of Service &rarr;
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
