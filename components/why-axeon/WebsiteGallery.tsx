'use client';

import { useState, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { BorderBeam } from './BorderBeam';
import { BrowserFrame } from './BrowserFrame';

interface GalleryImage {
  src: string;
  label: string;
  industry: string;
  url: string;
}

export function WebsiteGallery({
  images,
  variant,
}: {
  images: GalleryImage[];
  variant: 'typical' | 'axeon';
}) {
  const [active, setActive] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const isAxeon = variant === 'axeon';

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 8);
    rotateX.set(-py * 8);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const frame = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
      className="relative"
    >
      <motion.div style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}>
        <BrowserFrame url={images[active].url} dark={isAxeon}>
          <div className="relative aspect-[16/10] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={images[active].src}
                src={images[active].src}
                alt={`${images[active].industry} website example — ${images[active].label}`}
                loading="lazy"
                decoding="async"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            </AnimatePresence>
            <div
              className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wide backdrop-blur-sm ${
                isAxeon ? 'bg-blue-600/90 text-white' : 'bg-black/60 text-white'
              }`}
            >
              {images[active].industry}
            </div>
          </div>
        </BrowserFrame>
      </motion.div>
    </div>
  );

  return (
    <div>
      {isAxeon ? (
        <BorderBeam rounded="rounded-2xl" duration={4}>
          {frame}
        </BorderBeam>
      ) : (
        <div className="rounded-2xl border border-neutral-200 shadow-sm">{frame}</div>
      )}

      <div className="flex items-center gap-2 mt-4">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${img.industry} example`}
            className={`relative flex-1 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              active === i
                ? isAxeon
                  ? 'border-blue-600 opacity-100'
                  : 'border-neutral-800 opacity-100'
                : 'border-transparent opacity-45 hover:opacity-75'
            }`}
          >
            <img src={img.src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
          </button>
        ))}
      </div>
    </div>
  );
}
