'use client';

// components/proof/NotificationsButton.tsx
// "Turn on notifications" in the PROOF header (AxeonCORE and up). Registers
// public/sw.js, asks the browser, subscribes with the VAPID public key and
// saves the subscription. On an iPhone that has not added PROOF to the Home
// Screen it explains how instead, because iOS only pushes to Home Screen apps.
// On mount, a subscription the browser already has is posted again so the
// server re-syncs.
import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { needsHomeScreenInstall, urlBase64ToUint8Array } from '@/lib/pushShared';

type State = 'checking' | 'off' | 'working' | 'on' | 'blocked' | 'install' | 'unsupported' | 'error';

const BUTTON = 'inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50';

export function NotificationsButton({ publicKey, api = '/api/proof/push/subscribe' }: { publicKey: string; api?: string }) {
  const [state, setState] = useState<State>('checking');
  const [tip, setTip] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const set = (s: State) => {
      if (!cancelled) setState(s);
    };
    (async () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (needsHomeScreenInstall(navigator.userAgent, standalone)) return set('install');
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return set('unsupported');
      if (Notification.permission === 'denied') return set('blocked');
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      const on = sub !== null && Notification.permission === 'granted';
      set(on ? 'on' : 'off');
      // Saved again (the route is idempotent) so a server that lost or pruned it re-syncs.
      // Best effort: a failed re-sync changes nothing on screen and is tried again next visit.
      if (on && sub) await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) }).catch(() => undefined);
    })().catch(() => set('off'));
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function turnOn() {
    setState('working');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState(permission === 'denied' ? 'blocked' : 'off');
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      setState(res.ok ? 'on' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'checking' || state === 'unsupported') return null;
  if (state === 'on') {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
        <BellRing size={14} /> Notifications on
      </span>
    );
  }
  if (state === 'blocked') {
    return <span className="text-xs text-neutral-500">Notifications are blocked in this browser&apos;s settings.</span>;
  }
  if (state === 'install') {
    return (
      <span className="relative">
        <button type="button" className={BUTTON} onClick={() => setTip((v) => !v)} aria-expanded={tip}>
          <Bell size={14} /> Get lead alerts
        </button>
        {tip ? (
          <span role="note" className="absolute right-0 top-10 z-40 w-64 rounded-lg bg-white p-3 text-xs text-neutral-700 shadow-lg ring-1 ring-neutral-200">
            On iPhone: tap Share, then Add to Home Screen, then open AxeonPROOF from your Home Screen and tap this again.
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <button type="button" className={BUTTON} onClick={turnOn} disabled={state === 'working'}>
      <Bell size={14} /> {state === 'working' ? 'Turning on…' : state === 'error' ? 'Try notifications again' : 'Turn on notifications'}
    </button>
  );
}
