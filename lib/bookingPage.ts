// lib/bookingPage.ts
// The hosted booking page (/b/<site>) and its cancel page as plain HTML documents.
// Route handlers serve them instead of app/ pages so app/layout.tsx (Axeon's
// header, footer, GA, Clarity, Apollo and our own t.js) never runs on a client's
// customers. Brand-neutral, mobile-first, system fonts. Pure string building:
// every value from the database goes through esc(), and the page's config goes
// through jsonForScript(). Client-safe.

/** Our own script only, our own API only, framable by any site (that is what book.js does). */
export const BOOKING_PAGE_CSP =
  "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors *";

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** JSON that is safe inside <script type="application/json">: no "<", ">" or "&", no line separators. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const STYLE = [
  ':root{color-scheme:light;--ink:#111827;--muted:#6b7280;--line:#e5e7eb;--accent:#111827}',
  '*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
  '.wrap{max-width:560px;margin:0 auto;padding:24px 16px 40px}body.embed .wrap{padding:8px 4px 16px}',
  '.eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
  'h1{margin:4px 0 20px;font-size:26px;line-height:1.2}h2{margin:20px 0 10px;font-size:16px}',
  '.muted{color:var(--muted)}.note{padding:10px 12px;border-radius:10px;background:#fef3c7;color:#78350f;font-size:14px}.err{color:#b91c1c;font-size:14px}',
  '.days{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}',
  '.chip,.time{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:10px;padding:10px 12px;font:inherit;font-size:14px;cursor:pointer;white-space:nowrap}',
  '.chip.on{background:var(--accent);border-color:var(--accent);color:#fff}',
  '.times{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.field{display:block;margin:12px 0}.field span{display:block;font-size:13px;font-weight:600;margin-bottom:4px}',
  'input,select{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:11px 12px;font:inherit;font-size:16px;background:#fff;color:var(--ink)}',
  '.go{width:100%;margin-top:8px;border:0;border-radius:12px;background:var(--accent);color:#fff;padding:14px;font:inherit;font-weight:600;cursor:pointer}.go:disabled{opacity:.6}',
  '.link{background:none;border:0;padding:0;color:var(--ink);text-decoration:underline;font:inherit;cursor:pointer}',
  '.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
  '.card{border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:12px}.card p{margin:0}',
].join('');

function documentHtml(input: { title: string; body: string; embed: boolean; config?: unknown; script?: string }): string {
  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="robots" content="noindex,nofollow">',
    `<title>${esc(input.title)}</title><style>${STYLE}</style></head>`,
    `<body${input.embed ? ' class="embed"' : ''}>${input.body}`,
    input.config === undefined ? '' : `<script id="cfg" type="application/json">${jsonForScript(input.config)}</script>`,
    input.script ? `<script src="${esc(input.script)}" defer></script>` : '',
    '</body></html>',
  ].join('');
}

export interface BookingPageConfig {
  site: string;
  /** Same-origin API base, /api/book/<site>. */
  api: string;
  business: string;
  services: string[];
  timeZone: string;
  /** Inside book.js's iframe: no header, and the page reports its height to the parent. */
  embed: boolean;
}

export function renderBookingPage(c: BookingPageConfig): string {
  const header = c.embed ? '' : `<header><p class="eyebrow">Book online</p><h1>${esc(c.business)}</h1></header>`;
  const body =
    `<main class="wrap">${header}` +
    '<div id="app" aria-live="polite"><p class="muted">Loading open times…</p></div>' +
    '<noscript><p>Please turn on JavaScript to book online, or call to book.</p></noscript></main>';
  return documentHtml({ title: `Book with ${c.business}`, body, embed: c.embed, config: c, script: '/book-page.js' });
}

export function renderNoticePage(input: { title: string; message: string; embed?: boolean }): string {
  const embed = Boolean(input.embed);
  const heading = embed ? '' : `<h1>${esc(input.title)}</h1>`;
  return documentHtml({ title: input.title, body: `<main class="wrap">${heading}<p>${esc(input.message)}</p></main>`, embed });
}

export type CancelView =
  | { state: 'confirm'; business: string; when: string; service: string; action: string }
  | { state: 'cancelled'; business: string; when: string }
  | { state: 'already' | 'past' | 'not_found' };

/** Opening the link only asks. The button is a POST, so a link preview can never cancel. */
export function renderCancelPage(v: CancelView): string {
  let inner: string;
  switch (v.state) {
    case 'confirm':
      inner =
        '<h1>Cancel your booking?</h1>' +
        `<div class="card"><p><b>${esc(v.service || 'Appointment')}</b> with ${esc(v.business)}</p><p>${esc(v.when)}</p></div>` +
        `<form method="post" action="${esc(v.action)}"><button class="go" type="submit">Yes, cancel it</button></form>` +
        '<p class="muted">Changed your mind? Close this page and your booking stays.</p>';
      break;
    case 'cancelled':
      inner = `<h1>Cancelled</h1><p>Your ${esc(v.when)} booking with ${esc(v.business)} is cancelled. They have been told.</p>`;
      break;
    case 'already':
      inner = '<h1>Already cancelled</h1><p>This booking was cancelled earlier. Nothing else to do.</p>';
      break;
    case 'past':
      inner = '<h1>Too late to cancel online</h1><p>This booking has already started or finished. Please call the business.</p>';
      break;
    default:
      inner = '<h1>Booking not found</h1><p>We could not find that booking. The link may be incomplete; please check the text we sent you.</p>';
  }
  return documentHtml({ title: 'Your booking', body: `<main class="wrap">${inner}</main>`, embed: false });
}
