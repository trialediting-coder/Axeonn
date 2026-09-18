'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    // With redirect: false, next-auth's credentials callback always responds
    // with HTTP 200 (even on bad credentials) and encodes failure as an
    // `error` field rather than `ok: false` — so `error` is the signal to check.
    if (res?.error) {
      setError('Invalid email or password.');
    } else {
      router.push('/insights/admin');
      router.refresh();
    }
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center px-6 bg-neutral-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-950 mb-6">Insights Admin</h1>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </main>
  );
}
