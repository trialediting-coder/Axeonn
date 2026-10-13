// lib/auditHtml.ts
// What we read off a business's homepage ourselves (no third party): tap-to-call,
// a form, title, meta description, JSON-LD types. Plus the address checks that
// keep the site fetch from reaching anything private. Pure; tested on strings.

export interface HtmlChecks {
  clickToCall: boolean;
  form: boolean;
  title: string | null;
  metaDescription: string | null;
  schema: string[];
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function collectTypes(node: unknown, out: string[]): void {
  if (Array.isArray(node)) return node.forEach((n) => collectTypes(n, out));
  if (!node || typeof node !== 'object') return;
  const o = node as Record<string, unknown>;
  const t = o['@type'];
  if (typeof t === 'string') out.push(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.push(x));
  if (o['@graph']) collectTypes(o['@graph'], out);
}

export function htmlChecks(html: string): HtmlChecks {
  const h = html.slice(0, 2_000_000);
  const titleRaw = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  let metaDescription: string | null = null;
  for (const tag of h.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bname\s*=\s*["']?description["']?/i.test(tag)) continue;
    const c = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const v = decode(c?.[1] ?? c?.[2] ?? c?.[3] ?? '');
    if (v) {
      metaDescription = v;
      break;
    }
  }
  const schema: string[] = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(h))) {
    try {
      collectTypes(JSON.parse(m[1].trim()), schema);
    } catch {
      // not JSON: ignore the block
    }
  }
  return {
    clickToCall: /\bhref\s*=\s*["']?tel:/i.test(h),
    form: /<form[\s>]/i.test(h),
    title: decode(titleRaw) || null,
    metaDescription,
    schema: Array.from(new Set(schema)),
  };
}

/** Loopback, RFC 1918, link-local, CGNAT, "this network", and the IPv6 equivalents (incl. v4-mapped). */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.match(/^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v6 = ip.toLowerCase();
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

export function isPublicHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return false;
  if (/^[\d.]+$/.test(h) || h.includes(':')) return !isPrivateAddress(h); // a literal IP
  return true;
}
