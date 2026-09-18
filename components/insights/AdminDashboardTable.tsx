'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/posts';

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

  async function handlePublishNow(id: number) {
    const res = await fetch(`/api/admin/posts/${id}/publish`, { method: 'POST' });
    if (res.ok) {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'published' as const } : p)));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this post permanently?')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-neutral-500 border-b border-neutral-200">
          <th className="py-3 pr-4">Title</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3 pr-4">Author</th>
          <th className="py-3 pr-4">Scheduled for</th>
          <th className="py-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} className="border-b border-neutral-100">
            <td className="py-3 pr-4 font-medium text-neutral-900">{post.title}</td>
            <td className="py-3 pr-4">{statusBadge(post.status)}</td>
            <td className="py-3 pr-4 text-neutral-500">{post.author}</td>
            <td className="py-3 pr-4 text-neutral-500">
              {post.scheduledPublishAt ? new Date(post.scheduledPublishAt).toLocaleString() : '—'}
            </td>
            <td className="py-3 flex items-center gap-3">
              <Link href={`/insights/admin/posts/${post.id}/edit`} className="text-blue-600 hover:underline">
                Edit
              </Link>
              {post.status !== 'published' && (
                <button onClick={() => handlePublishNow(post.id)} className="text-green-600 hover:underline cursor-pointer">
                  Publish now
                </button>
              )}
              <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:underline cursor-pointer">
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
