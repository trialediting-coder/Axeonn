'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface BorderBeamProps {
  children: ReactNode;
  color?: string;
  duration?: number;
  rounded?: string;
  className?: string;
}

export function BorderBeam({
  children,
  color = '#3B82F6',
  duration = 3.5,
  rounded = 'rounded-3xl',
  className = '',
}: BorderBeamProps) {
  return (
    <div className={`relative ${rounded} ${className}`}>
      {children}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${rounded} overflow-hidden`}
        style={{
          padding: 2,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      >
        <motion.div
          className="absolute inset-[-50%]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${color} 10%, transparent 22%)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
