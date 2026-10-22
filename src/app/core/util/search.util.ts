import { DirectoryEntry } from '../models/directory.model';
import { isOpenNow } from './hours.util';
import { distanceMiles, fold } from './text.util';

export type SortKey = 'relevance' | 'newest' | 'name' | 'distance';

export interface SearchFilters {
  q: string;
  where: string; // "Edison, NJ", a state code or a ZIP
  categories: string[];
  group: string;
  languages: string[];
  dietary: string[];
  services: string[];
  price: string[];
  openNow: boolean;
  sort: SortKey;
}

export const EMPTY_FILTERS: SearchFilters = {
  q: '',
  where: '',
  categories: [],
  group: '',
  languages: [],
  dietary: [],
  services: [],
  price: [],
  openNow: false,
  sort: 'relevance',
};

export interface SearchHit {
  entry: DirectoryEntry;
  score: number;
  miles: number | null;
}

export interface SearchContext {
  categoryLabel: (id: string) => string;
  categoryGroup: (id: string) => string;
  origin: { lat: number; lng: number } | null;
}

/** Precomputed lowercase text per entry so typing stays instant on thousands of listings. */
const haystacks = new WeakMap<DirectoryEntry, { name: string; all: string }>();

function hay(e: DirectoryEntry, ctx: SearchContext) {
  let h = haystacks.get(e);
  if (!h) {
    const name = fold(`${e.name} ${e.nameNative}`);
    const all = fold(
      [name, ctx.categoryLabel(e.category), e.city, e.state, e.postalCode, e.summary, ...e.tags, ...e.languages, ...e.cuisines.map(c => c.replace(/_/g, ' '))].join(' | ')
    );
    h = { name, all };
    haystacks.set(e, h);
  }
  return h;
}

function matchesWhere(e: DirectoryEntry, where: string): boolean {
  const w = fold(where).trim();
  if (!w) return true;
  if (/^\d{3,5}$/.test(w)) return e.postalCode.startsWith(w);
  if (/^[a-z]{2}$/.test(w)) return e.state.toLowerCase() === w;
  const [cityPart, statePart] = w.split(',').map(s => s.trim());
  const cityOk = !cityPart || fold(e.city).includes(cityPart);
  const stateOk = !statePart || e.state.toLowerCase() === statePart.slice(0, 2);
  return cityOk && stateOk;
}

export function runSearch(entries: DirectoryEntry[], f: SearchFilters, ctx: SearchContext): SearchHit[] {
  const terms = fold(f.q).split(/[\s,]+/).filter(Boolean);
  const now = new Date();
  const out: SearchHit[] = [];

  for (const e of entries) {
    if (f.categories.length && !f.categories.includes(e.category)) continue;
    if (f.group && ctx.categoryGroup(e.category) !== f.group) continue;
    if (f.languages.length && !f.languages.some(l => e.languages.includes(l))) continue;
    if (f.dietary.length && !f.dietary.every(d => e.dietary.includes(d))) continue;
    if (f.services.length && !f.services.every(s => e.services.includes(s))) continue;
    if (f.price.length && !f.price.includes(e.priceRange)) continue;
    if (!matchesWhere(e, f.where)) continue;
    if (f.openNow && isOpenNow(e.hours, e.timezone, now) !== true) continue;

    let score = 0;
    if (terms.length) {
      const h = hay(e, ctx);
      let ok = true;
      for (const t of terms) {
        if (!h.all.includes(t)) {
          ok = false;
          break;
        }
        if (h.name.startsWith(t)) score += 12;
        else if (h.name.includes(` ${t}`)) score += 8;
        else if (h.name.includes(t)) score += 5;
        else score += 2;
      }
      if (!ok) continue;
    }
    const miles = ctx.origin ? distanceMiles(ctx.origin, e) : null;
    if (miles != null) score += Math.max(0, 6 - miles / 5);
    if (e.photo) score += 0.5;
    out.push({ entry: e, score, miles });
  }

  const byName = (a: SearchHit, b: SearchHit) => a.entry.name.localeCompare(b.entry.name);
  switch (f.sort) {
    case 'newest':
      out.sort((a, b) => b.entry.createdAt - a.entry.createdAt || byName(a, b));
      break;
    case 'name':
      out.sort(byName);
      break;
    case 'distance':
      out.sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9) || byName(a, b));
      break;
    default:
      out.sort((a, b) => b.score - a.score || b.entry.createdAt - a.entry.createdAt);
  }
  return out;
}

/** How many entries carry each value of a list field, for filter counts. */
export function facetCounts(hits: SearchHit[], pick: (e: DirectoryEntry) => string | string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { entry } of hits) {
    const v = pick(entry);
    for (const k of Array.isArray(v) ? v : [v]) if (k) counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}
