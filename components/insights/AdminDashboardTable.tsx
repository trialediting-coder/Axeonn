'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/posts';
import { btn } from '@/components/admin/ui';

function statusBadge(status: Post['status']) {
  const styles: Record<Post['status'], string> = {
    draft: 'bg-neutral-100 text-neutral-600',
    scheduled: 'bg-amber-100 text-amber-700',
    published: 'bg-green-100 text-green-700',
  };
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}>{status}</span>;
}

export function AdminDashboardTable({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState<string | null>(null);

  async function handlePublishNow(id: number) {
    setError(null);
    const res = await fetch(`/api/admin/posts/${id}/publish`, { method: 'POST' });
    if (res.ok) {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'published' as const } : p)));
      return;
    }
    const data = await res.json().catch(() => ({}));
    const reasons = Array.isArray(data.reasons) ? `: ${data.reasons.join('; ')}` : '';
    setError(`${data.error ?? 'Failed to publish post.'}${reasons}`);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this post permanently?')) return;
    setError(null);
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? 'Failed to delete post.');
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {/* Below sm each row stacks into a card; from sm up it's a regular table. */}
      <table className="w-full text-sm">
        <thead className="hidden sm:table-header-group">
          <tr className="text-left text-neutral-500 border-b border-neutral-200">
            <th className="py-3 pr-4">Title</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Author</th>
            <th className="py-3 pr-4">Scheduled for</th>
            <th className="py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="block sm:table-row-group">
          {posts.map((post) => (
            <tr key={post.id} className="block border-b border-neutral-100 py-4 first:pt-0 last:border-b-0 sm:table-row sm:py-0 sm:last:border-b">
              <td className="block font-medium text-neutral-900 sm:table-cell sm:py-3 sm:pr-4">{post.title}</td>
              <td className="mt-2 mr-2 inline-block align-middle sm:mt-0 sm:mr-0 sm:table-cell sm:py-3 sm:pr-4">{statusBadge(post.status)}</td>
              <td className="inline align-middle text-neutral-500 sm:table-cell sm:py-3 sm:pr-4">{post.author}</td>
              <td className="mt-1 block text-xs text-neutral-500 sm:mt-0 sm:table-cell sm:py-3 sm:pr-4 sm:text-sm">
                {post.scheduledPublishAt ? (
                  <>
                    <span className="sm:hidden">Scheduled for </span>
                    {new Date(post.scheduledPublishAt).toLocaleString()}
                  </>
                ) : (
                  <span className="hidden sm:inline">—</span>
                )}
              </td>
              <td className="mt-3 block sm:mt-0 sm:table-cell sm:py-3">
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Link href={`/admin/posts/${post.id}/edit`} className={btn('secondary', 'sm')}>
                    Edit
                  </Link>
                  {post.status !== 'published' && (
                    <button type="button" onClick={() => handlePublishNow(post.id)} className={btn('success', 'sm')}>
                      Publish now
                    </button>
                  )}
                  <button type="button" onClick={() => handleDelete(post.id)} className={btn('danger', 'sm')}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
