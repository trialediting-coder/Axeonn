// components/proof/MetaReplyNotice.tsx
// Shown under the inbox reply box when Facebook or Instagram refused a reply
// (POST …/reply answered reason 'meta'): the 24-hour window closed, the page
// needs reconnecting, permissions are off, or Meta did not take it. Whenever
// nothing went out and a text really could (canText: a phone, not opted out,
// texting on; lib/contactsShared.ts canTextInstead), one button sends the same
// words as a text instead. An unclear send never offers it.
'use client';

export function MetaReplyNotice({ error, canText, busy, onTextInstead }: { error: string; canText: boolean; busy: boolean; onTextInstead: () => void }) {
  return (
    <div role="status" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <p>{error}</p>
      {canText ? (
        <button
          type="button"
          disabled={busy}
          onClick={onTextInstead}
          className="mt-2 inline-flex items-center rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Text them instead
        </button>
      ) : null}
    </div>
  );
}
