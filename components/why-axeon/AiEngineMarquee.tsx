import type { ComponentType } from 'react';
import { SiClaude, SiGooglegemini, SiPerplexity } from 'react-icons/si';

interface Engine {
  name: string;
  size: number;
  Icon?: ComponentType<{ size?: number; color?: string }>;
  color?: string;
  imgSrc?: string;
}

const ENGINES: Engine[] = [
  { name: 'ChatGPT', imgSrc: '/why-axeon/chatgpt-logo-white.png', size: 18 },
  { name: 'Claude', Icon: SiClaude, color: '#D97757', size: 18 },
  { name: 'Gemini', Icon: SiGooglegemini, color: '#4285F4', size: 14 },
  { name: 'Perplexity', Icon: SiPerplexity, color: '#20808D', size: 18 },
];

export function AiEngineMarquee() {
  return (
    <div className="w-full flex items-center justify-center gap-5 sm:gap-10 overflow-x-auto px-2">
      {ENGINES.map(({ name, Icon, color, size, imgSrc }, i) => (
        <span key={i} className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-neutral-400">
          {imgSrc ? (
            <img src={imgSrc} alt="" width={size} height={size} style={{ width: size, height: size }} />
          ) : Icon ? (
            <Icon size={size} color={color} />
          ) : null}
          <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{name}</span>
        </span>
      ))}
    </div>
  );
}
