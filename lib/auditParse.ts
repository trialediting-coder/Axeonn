// lib/auditParse.ts
// DataForSEO result shapes → our MapsItem / organic rows. Pure, so the parsers
// are tested on saved fixtures (lib/__fixtures__/dataforseo) without network.
import type { MapsItem } from '@/lib/auditShared';
import { parseMapsProfile } from '@/lib/auditDeepParse';

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : null);
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const items = (result: unknown): Rec[] => {
  const r = rec(result);
  return r && Array.isArray(r.items) ? (r.items as unknown[]).map(rec).filter((x): x is Rec => x !== null) : [];
};

function toMapsItem(i: Rec, rank: number): MapsItem | null {
  const name = str(i.title);
  if (!name) return null;
  const rating = rec(i.rating);
  const cid = str(i.cid);
  const categories = [str(i.category), ...(Array.isArray(i.additional_categories) ? i.additional_categories.map(str) : [])].filter(Boolean);
  return {
    rank,
    name,
    domain: str(i.domain) || null,
    url: str(i.url) || null,
    rating: num(rating?.value),
    reviews: num(rating?.votes_count),
    placeId: str(i.place_id) || null,
    cid: cid || null,
    lat: num(i.latitude),
    lng: num(i.longitude),
    categories,
    gbpUrl: cid ? `https://maps.google.com/?cid=${cid}` : null,
    ...parseMapsProfile(i),
  };
}

/** Maps results in order; ads (`maps_paid_item`) are skipped and `rank_group` is the position people see among real listings. */
export function parseMapsItems(result: unknown): MapsItem[] {
  return items(result)
    .filter((i) => i.type === 'maps_search')
    .map((i) => toMapsItem(i, num(i.rank_group) ?? num(i.rank_absolute) ?? 0))
    .filter((i): i is MapsItem => i !== null && i.rank > 0)
    .sort((a, b) => a.rank - b.rank);
}

export function parseOrganicItems(result: unknown): Array<{ rank: number; domain: string; title: string }> {
  return items(result)
    .filter((i) => i.type === 'organic')
    .map((i) => ({ rank: num(i.rank_group) ?? num(i.rank_absolute) ?? 0, domain: str(i.domain), title: str(i.title) }))
    .filter((i) => i.rank > 0 && i.domain)
    .sort((a, b) => a.rank - b.rank);
}

/** The business-info lookup returns one listing (or none). Rank is 0: it is not a ranking call. */
export function parseBusinessInfo(result: unknown): MapsItem | null {
  const first = items(result)[0];
  return first ? toMapsItem(first, 0) : null;
}
