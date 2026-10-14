// The Reels card on a client's admin page (AxeonGROWTH only): upload a video
// straight to Vercel Blob, write the caption (checked against Instagram's
// limits as you type), pick Instagram, Facebook or both, and schedule it. The
// hourly cron posts it. Lists every post with its status, error and reach.
'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import { captionProblem, SOCIAL_STATUS_LABEL, type MetaPagePublic, type SocialPlatform, type SocialPost } from '@/lib/metaShared';
import { blobPathFor, REEL_CONTENT_TYPES, REEL_MAX_BYTES, retryBlockedReason } from '@/lib/socialShared';

/** The file's video type, falling back to its extension when the browser reports none (common for .mov on Windows). Null when not MP4/MOV. */
function reelType(file: File): string | null {
  const byExt = /\.mp4$/i.test(file.name) ? 'video/mp4' : /\.mov$/i.test(file.name) ? 'video/quicktime' : null;
  const type = file.type || byExt;
  return type && (REEL_CONTENT_TYPES as readonly string[]).includes(type) ? type : null;
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');

export function SocialPanel({ token, onboardingId, tier, configured, pages, initial }: { token: string; onboardingId: number; tier: string; configured: boolean; pages: MetaPagePublic[]; initial: SocialPost[] }) {
  // The page is known before the hooks so the channel choice starts from its real links (Instagram only when linked).
  const page = pages.find((p) => p.status === 'active') ?? null;
  const igLinked = Boolean(page?.igUserId);
  const [posts, setPosts] = useState<SocialPost[]>(initial);
  const [videoUrl, setVideoUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [caption, setCaption] = useState('');
  const [picked, setPlatforms] = useState<SocialPlatform[]>(() => (igLinked ? ['instagram', 'facebook'] : ['facebook']));
  const [at, setAt] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (tier !== 'axeongrowth') return null;
  // Never send Instagram for a page without a linked account, even if the page changed after the first render.
  const platforms = picked.filter((p) => p !== 'instagram' || igLinked);
  const problem = captionProblem(caption);
  const api = `/api/admin/onboarding/${token}/social`;

  async function call(method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown>) {
    const res = await fetch(api, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => null)) as { posts?: SocialPost[]; error?: string } | null;
    if (!res.ok || !json?.posts) throw new Error(json?.error || `Request failed (${res.status})`);
    setPosts(json.posts);
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    // Checked here before any upload starts; the upload token enforces the same type and size limits on Blob's side.
    const contentType = reelType(file);
    if (!contentType) {
      setError('Reels must be an MP4 or MOV video.');
      return;
    }
    if (file.size > REEL_MAX_BYTES) {
      setError('That video is over 300 MB. Export a shorter or smaller version.');
      return;
    }
    void run('upload', async () => {
      const blob = await upload(blobPathFor(onboardingId, file.name), file, { access: 'public', handleUploadUrl: `${api}/upload`, multipart: true, contentType });
      setVideoUrl(blob.url);
      setFileName(file.name);
    });
  }

  function save(schedule: boolean) {
    void run('save', async () => {
      await call('POST', { platforms, videoUrl, caption, scheduledAt: schedule && at ? new Date(at).toISOString() : null });
      setVideoUrl('');
      setFileName('');
      setCaption('');
      setAt('');
    });
  }

  const toggle = (p: SocialPlatform) => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Reels</p>
      <h2 className="mt-1 text-lg font-bold text-neutral-950">{page ? `Posting as ${page.pageName}${page.igUsername ? ` and @${page.igUsername}` : ''}` : 'Connect their Facebook page first'}</h2>
      {!configured ? <p className="mt-3 text-sm text-neutral-600">Meta is not configured yet, so nothing can be posted.</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}

      {configured && page ? (
        <div className="mt-5 grid gap-4">
          <div>
            <label className={adminLabel} htmlFor="reel-file">Video (MP4 or MOV, up to 300 MB, vertical 9:16 looks best)</label>
            <input id="reel-file" type="file" accept="video/mp4,video/quicktime" disabled={busy !== null} onChange={(e) => pickFile(e.target.files?.[0])} className="text-sm" />
            {busy === 'upload' ? <p className="mt-1 text-xs text-neutral-500">Uploading…</p> : fileName ? <p className="mt-1 text-xs text-emerald-700">Uploaded {fileName}</p> : null}
          </div>
          <div>
            <label className={adminLabel} htmlFor="reel-caption">Caption</label>
            <textarea id="reel-caption" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} className={adminInput} placeholder="Before and after on a 2024 F-150. Booking next week in Des Moines." />
            <p className={`mt-1 text-xs ${problem ? 'text-red-600' : 'text-neutral-500'}`}>{problem ?? `${[...caption].length.toLocaleString('en-US')} / 2,200`}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={igLinked && platforms.includes('instagram')} disabled={!igLinked} onChange={() => toggle('instagram')} /> Instagram{!igLinked ? ' (not linked)' : ''}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={platforms.includes('facebook')} onChange={() => toggle('facebook')} /> Facebook
            </label>
          </div>
          <div>
            <label className={adminLabel} htmlFor="reel-at">Post at (your time)</label>
            <input id="reel-at" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={adminInput} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy !== null || !videoUrl || !!problem || !at || !platforms.length} onClick={() => save(true)} className={btn('primary', 'sm')}>
              Schedule
            </button>
            <button type="button" disabled={busy !== null || !videoUrl || !!problem || !platforms.length} onClick={() => save(false)} className={btn('secondary', 'sm')}>
              Save as draft
            </button>
          </div>
        </div>
      ) : null}

      {posts.length ? (
        <ul className="mt-6 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          {posts.map((p) => {
            const blocked = retryBlockedReason(p);
            return (
            <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900">
                  {p.platform === 'instagram' ? 'Instagram' : 'Facebook'} · {SOCIAL_STATUS_LABEL[p.status]} · {when(p.publishedAt ?? p.scheduledAt)}
                </p>
                <p className="truncate text-neutral-600">{p.caption || 'No caption'}</p>
                {p.status === 'published' && p.platform === 'instagram' ? (
                  <p className="text-neutral-600">{p.reach != null ? `${p.reach.toLocaleString('en-US')} reached · ${(p.plays ?? 0).toLocaleString('en-US')} views` : 'Reach shows the day after posting'}</p>
                ) : null}
                {p.error ? <p className="text-amber-800">{p.error}</p> : null}
                {p.status === 'failed' && blocked && blocked !== p.error ? <p className="text-amber-800">{blocked}</p> : null}
                {p.status === 'failed' && blocked ? <p className="text-xs text-neutral-500">It will not be posted again from here. To post it anyway, upload it as a new post.</p> : null}
                {p.permalink ? (
                  <a href={p.permalink} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">
                    Open post
                  </a>
                ) : null}
              </div>
              {p.status !== 'published' ? (
                <div className="flex gap-2">
                  {p.status !== 'scheduled' && at && !blocked ? (
                    <button type="button" disabled={busy !== null} onClick={() => run(`s${p.id}`, () => call('PATCH', { id: p.id, scheduledAt: new Date(at).toISOString() }))} className={btn('secondary', 'sm')}>
                      Schedule for {when(new Date(at).toISOString())}
                    </button>
                  ) : null}
                  <button type="button" disabled={busy !== null} onClick={() => window.confirm('Delete this post?') && run(`d${p.id}`, () => call('DELETE', { id: p.id }))} className={btn('danger', 'sm')}>
                    Delete
                  </button>
                </div>
              ) : null}
            </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
