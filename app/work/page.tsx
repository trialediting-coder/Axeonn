import { buildMetadata } from '@/lib/metadata';

// Portfolio is being rebuilt; keep the route live for nav links but out of the index.
export const metadata = {
  ...buildMetadata({
    path: '/work',
    title: 'Our Work | Axeon Studio',
    description: 'Axeon Studio portfolio, coming soon.',
  }),
  robots: { index: false, follow: true },
};

export default function WorkPage() {
  return (
    <main className="pt-24 min-h-[70vh] flex items-center justify-center px-6">
      <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-neutral-950">WIP</h1>
    </main>
  );
}
