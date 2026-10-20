'use client';

// The three partner tracks. Desktop shows all three at once (Practice Advisor
// leads, Referral and Collaboration beside it). Phones get a three-way switch
// so one track fits on screen at a time, with one brief CTA under it.
import { useState } from 'react';
import { ArrowRight, FileText, Puzzle, Send } from 'lucide-react';

type Track = 'advisor' | 'referral' | 'collab';

const TABS: { key: Track; label: string }[] = [
  { key: 'advisor', label: 'Advisor' },
  { key: 'referral', label: 'Referral' },
  { key: 'collab', label: 'Collaboration' },
];

export function PartnerTracks({
  advisorPoints,
  referralPoints,
  collabPoints,
  briefHref,
  button,
}: {
  advisorPoints: string[];
  referralPoints: string[];
  collabPoints: string[];
  briefHref: string;
  button: string;
}) {
  const [track, setTrack] = useState<Track>('advisor');
  // Hidden on phones unless picked; always shown from lg up.
  const show = (k: Track, display: 'grid' | 'flex') =>
    display === 'grid' ? (track === k ? 'grid' : 'hidden lg:grid') : track === k ? 'flex' : 'hidden lg:flex';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl mb-4 sm:mb-12">
        <h2 className="text-[28px] sm:text-5xl font-black tracking-[-0.03em] font-display mb-2 sm:mb-4">Three ways to partner</h2>
        <p className="text-[15px] sm:text-lg text-neutral-600 leading-relaxed">
          Pick the one that fits how you work. Not sure? Request the brief and we will figure it out together.
        </p>
      </div>

      <div role="tablist" aria-label="Partner tracks" className="lg:hidden grid grid-cols-3 gap-1 rounded-full bg-neutral-100 p-1 mb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={track === t.key}
            onClick={() => setTrack(t.key)}
            className={`min-h-11 rounded-full text-sm font-semibold transition-colors ${
              track === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`${show('advisor', 'grid')} rounded-3xl lg:rounded-[32px] bg-blue-600 text-white p-5 sm:p-12 lg:grid-cols-2 gap-3 sm:gap-10`}>
        <div className="flex flex-col">
          <FileText size={28} className="hidden sm:block mb-8 text-blue-200" />
          <p className="text-xs font-mono font-bold tracking-widest text-blue-100 uppercase mb-1 sm:mb-2">[ For CPAs, consultants &amp; billing firms ]</p>
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight font-display sm:mb-3">Practice Advisor</h3>
          <p className="hidden sm:block text-blue-100 text-lg leading-relaxed">
            You advise practice and firm owners on their numbers and operations. When a client is losing new patients or clients
            to voicemail, introduce them. We check their area, they decide, and you earn a recurring share or pass it to them.
          </p>
          <a
            href={briefHref}
            data-track="cta_click"
            data-track-cta="partner_brief_advisor"
            className={`${button.replace('inline-flex ', '')} hidden lg:inline-flex mt-8 self-start bg-white text-blue-700 hover:bg-blue-50 focus-visible:outline-white`}
          >
            Request the partner brief <ArrowRight size={18} />
          </a>
        </div>
        <ul className="divide-y divide-white/15 border-y border-white/15 self-end">
          {advisorPoints.map((point) => (
            <li key={point} className="py-2 sm:py-3.5 text-[15px] sm:text-base leading-snug sm:leading-normal text-white/95">
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:mt-6 grid lg:grid-cols-2 gap-6">
        <div className={`${show('referral', 'flex')} rounded-3xl lg:rounded-[32px] border-2 border-neutral-200 p-5 sm:p-10 flex-col`}>
          <Send size={26} className="hidden sm:block mb-6 text-blue-600" />
          <h3 className="text-2xl font-black tracking-tight font-display mb-1 sm:mb-2">Referral Partner</h3>
          <p className="text-neutral-600 text-[15px] sm:text-lg mb-3 sm:mb-6 leading-relaxed">
            You know a practice or firm owner who keeps missing calls. Make the intro, we handle everything else.
          </p>
          <ul className="mt-auto divide-y divide-neutral-200 border-t border-neutral-200">
            {referralPoints.map((point) => (
              <li key={point} className="py-2.5 sm:py-3.5 text-[15px] sm:text-base text-neutral-800">
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${show('collab', 'flex')} rounded-3xl lg:rounded-[32px] border-2 border-neutral-200 p-5 sm:p-10 flex-col`}>
          <Puzzle size={26} className="hidden sm:block mb-6 text-blue-600" />
          <h3 className="text-2xl font-black tracking-tight font-display mb-1 sm:mb-2">Collaboration Partner</h3>
          <p className="text-neutral-600 text-[15px] sm:text-lg mb-3 sm:mb-6 leading-relaxed">
            You serve the same practices and firms with software or a service that fits next to ours. We recommend each other when
            it makes sense.
          </p>
          <ul className="mt-auto divide-y divide-neutral-200 border-t border-neutral-200">
            {collabPoints.map((point) => (
              <li key={point} className="py-2.5 sm:py-3.5 text-[15px] sm:text-base text-neutral-800">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* One CTA on phones, whichever track is showing. */}
      <a
        href={briefHref}
        data-track="cta_click"
        data-track-cta="partner_brief_tracks_mobile"
        className={`${button} lg:hidden mt-4 w-full justify-center bg-blue-600 hover:bg-blue-500 text-white focus-visible:outline-blue-400`}
      >
        Request the partner brief <ArrowRight size={18} />
      </a>
    </div>
  );
}
