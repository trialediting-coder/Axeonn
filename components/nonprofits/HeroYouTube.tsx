'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { videoId: string; title: string };

/**
 * Muted, looping YouTube background. The video's still frame paints first and
 * the player only fades in once YouTube reports it is actually playing, so a
 * blocked autoplay or a player error never shows a black box.
 */
export function HeroYouTube({ videoId, title }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        // playerState 1 = playing (sent as infoDelivery or onStateChange)
        if (data?.info?.playerState === 1 || (data?.event === 'onStateChange' && data?.info === 1)) {
          setPlaying(true);
        }
      } catch {
        /* not a player message */
      }
    };
    // Ask the player to post state updates back to this window.
    const listen = () =>
      frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoId }), '*');
    window.addEventListener('message', onMessage);
    frame.addEventListener('load', listen);
    return () => {
      window.removeEventListener('message', onMessage);
      frame.removeEventListener('load', listen);
    };
  }, [videoId]);

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    disablekb: '1',
    iv_load_policy: '3',
    enablejsapi: '1',
  });

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />
      <iframe
        ref={frameRef}
        src={`https://www.youtube.com/embed/${videoId}?${params}`}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100%,177.78dvh)] h-[max(100%,56.25vw)] border-0 transition-opacity duration-1000 ${
          playing ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
