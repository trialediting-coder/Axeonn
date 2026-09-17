'use client';

import { useRef, useState } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AudioOrbPlayerProps {
  src: string;
  variant: 'orb' | 'flat';
  label: string;
  size?: 'default' | 'large';
  minimal?: boolean;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

const BAR_COUNT = 5;

export function AudioOrbPlayer({ src, variant, label, size = 'default', minimal = false }: AudioOrbPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      return;
    }
    const playResult = audio.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => setHasError(true));
    }
  };

  const isOrb = variant === 'orb';

  return (
    <div className="flex flex-col items-center text-center">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setHasError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
        }}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      {isOrb ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
          className={`relative rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
            size === 'large' ? 'w-56 h-56 sm:w-64 sm:h-64' : 'w-36 h-36 sm:w-44 sm:h-44'
          }`}
        >
          {/* Ambient outer glow */}
          <motion.span
            aria-hidden="true"
            className="absolute -inset-4 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }}
            animate={{
              opacity: isPlaying ? [0.5, 0.85, 0.5] : [0.3, 0.45, 0.3],
              scale: isPlaying ? [1, 1.15, 1] : [1, 1.05, 1],
            }}
            transition={{ duration: isPlaying ? 1.4 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/*
            Sphere shell: the circular clip mask lives on this static wrapper,
            separate from the animated scale below. iOS Safari has a known bug
            where overflow-hidden + border-radius fails to clip mix-blend-mode
            children correctly when the SAME element is also being transformed
            (scaled) every frame — it shows up as square-ish color/gradient
            bleed past the circle edge on mobile. Keeping the clip mask on a
            non-animated element and putting the scale transform on a plain
            inner div (no border-radius/overflow of its own) avoids it.
          */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ background: '#0B1B3A', WebkitMaskImage: '-webkit-radial-gradient(#fff, #fff)' }}
          >
          <motion.div
            className="absolute inset-0"
            animate={{ scale: isPlaying ? [1, 1.06, 1] : [1, 1.015, 1] }}
            transition={{ duration: isPlaying ? 1.4 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Liquid blobs, blended additively for a glowing plasma feel */}
            <motion.span
              aria-hidden="true"
              className="absolute w-[70%] h-[70%] rounded-full"
              style={{
                left: '10%',
                top: '5%',
                background: 'radial-gradient(circle, #93C5FD, #2563EB 60%, transparent 75%)',
                mixBlendMode: 'screen',
                filter: 'blur(6px)',
              }}
              animate={{
                x: isPlaying ? [0, 14, -8, 0] : [0, 6, 0],
                y: isPlaying ? [0, -10, 8, 0] : [0, 4, 0],
                scale: isPlaying ? [1, 1.2, 0.9, 1] : [1, 1.05, 1],
              }}
              transition={{ duration: isPlaying ? 2.6 : 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              aria-hidden="true"
              className="absolute w-[55%] h-[55%] rounded-full"
              style={{
                right: '5%',
                bottom: '8%',
                background: 'radial-gradient(circle, #60A5FA, #1D4ED8 65%, transparent 80%)',
                mixBlendMode: 'screen',
                filter: 'blur(8px)',
              }}
              animate={{
                x: isPlaying ? [0, -12, 10, 0] : [0, -5, 0],
                y: isPlaying ? [0, 10, -6, 0] : [0, -4, 0],
                scale: isPlaying ? [1, 0.85, 1.15, 1] : [1, 1.03, 1],
              }}
              transition={{ duration: isPlaying ? 3.1 : 7, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <motion.span
              aria-hidden="true"
              className="absolute w-[40%] h-[40%] rounded-full"
              style={{
                left: '30%',
                bottom: '10%',
                background: 'radial-gradient(circle, #DBEAFE, #3B82F6 70%, transparent 85%)',
                mixBlendMode: 'screen',
                filter: 'blur(5px)',
              }}
              animate={{
                x: isPlaying ? [0, 10, -14, 0] : [0, -4, 0],
                y: isPlaying ? [0, -8, 6, 0] : [0, 3, 0],
              }}
              transition={{ duration: isPlaying ? 2.2 : 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />

            {/* Glossy specular highlight for dimensionality */}
            <span
              aria-hidden="true"
              className="absolute w-[35%] h-[25%] rounded-full bg-white/40 blur-md"
              style={{ left: '18%', top: '14%' }}
            />
            {/* Inner shadow for sphere volume */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: 'inset -10px -14px 30px rgba(0,0,0,0.55), inset 8px 10px 24px rgba(255,255,255,0.08)' }}
            />
          </motion.div>
          </div>

          <span className="relative z-10 w-full h-full flex items-center justify-center text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
            {hasError ? (
              <AlertCircle size={size === 'large' ? 44 : 30} />
            ) : isPlaying ? (
              <Pause size={size === 'large' ? 52 : 32} fill="white" />
            ) : (
              <Play size={size === 'large' ? 52 : 32} fill="white" className="ml-1" />
            )}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
          className="w-20 h-20 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        >
          {hasError ? <AlertCircle size={20} /> : isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
      )}

      {!minimal && <div className="mt-4 text-sm font-semibold text-white">{label}</div>}

      {hasError ? (
        !minimal && <div className="mt-1 text-xs text-red-500">Couldn&apos;t load audio</div>
      ) : minimal ? null : (
        <>
          <div className="flex items-end gap-0.5 h-4 mt-2" aria-hidden="true">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <motion.span
                key={i}
                className={`w-1 rounded-full ${isOrb ? 'bg-blue-500' : 'bg-neutral-400'}`}
                animate={
                  isPlaying
                    ? { height: ['30%', '100%', '45%', '85%', '30%'] }
                    : { height: '20%' }
                }
                transition={
                  isPlaying
                    ? { duration: 0.9 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.3 }
                }
              />
            ))}
          </div>
          <div className="mt-1 text-xs font-mono text-neutral-400">
            {formatTime(elapsed)} / {formatTime(duration)}
          </div>
        </>
      )}
    </div>
  );
}
