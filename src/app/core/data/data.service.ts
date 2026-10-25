import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, combineLatest, map, of, shareReplay } from 'rxjs';
import {
  BusinessData,
  CategoryData,
  CitySummary,
  CityData,
  DirectoryData,
  DirectoryEntry,
  HomeData,
} from '../models/directory.model';
import { LiveChanges, LiveDirectoryService } from './live-directory.service';
import { toEntry } from './public-shape';

/**
 * Reads the static directory published with the site (see scripts/build-data.mjs).
 * These files come from the CDN, so browsing costs no Firestore reads. Requests
 * made while prerendering are embedded in the page (HTTP transfer cache), so a
 * visitor's first view doesn't fetch them again.
 *
 * In the browser, listings edited or approved since the build are merged in
 * live (see LiveDirectoryService), so pages update without a refresh.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly live = inject(LiveDirectoryService);
  private readonly cache = new Map<string, Observable<unknown>>();

  private get<T>(path: string): Observable<T | null> {
    let req = this.cache.get(path) as Observable<T | null> | undefined;
    if (!req) {
      req = this.http.get<T>(`/data/${path}`).pipe(
        catchError(() => of(null)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this.cache.set(path, req);
    }
    return req;
  }

  private withLive<T>(path: string, apply: (data: T | null, changes: LiveChanges) => T | null): Observable<T | null> {
    return combineLatest([this.get<T>(path), this.live.changes()]).pipe(
      map(([data, changes]) => (changes.size ? apply(data, changes) : data))
    );
  }

  home() {
    return this.withLive<HomeData>('home.json', (d, changes) => {
      if (!d) return d;
      let total = d.total;
      for (const c of changes.values()) {
        if (c.isNew && c.business) total++;
        if (!c.isNew && !c.business) total--;
      }
      return { ...d, total: Math.max(0, total), newest: mergeEntries(d.newest, changes, () => true).slice(0, 12) };
    });
  }

  /** Every listing in compact form. Large; only loaded in the browser for search. */
  directory() {
    return this.withLive<DirectoryData>('directory.json', (d, changes) =>
      d ? { ...d, entries: mergeEntries(d.entries, changes, () => true) } : d
    );
  }

  cities() {
    return this.get<{ cities: CitySummary[] }>('cities.json');
  }

  business(slug: string) {
    return this.get<BusinessData>(`b/${encodeURIComponent(slug)}.json`);
  }

  category(id: string) {
    return this.withLive<CategoryData>(`category/${encodeURIComponent(id)}.json`, (d, changes) => {
      const entries = mergeEntries(d?.entries ?? [], changes, e => e.category === id);
      if (!d && !entries.length) return null;
      return { id, sample: false, ...d, entries, cities: citySummaries(entries) };
    });
  }

  city(state: string, city: string) {
    const key = `${state.toLowerCase()}/${city}`;
    return this.withLive<CityData>(`city/${encodeURIComponent(state.toLowerCase())}-${encodeURIComponent(city)}.json`, (d, changes) => {
      const entries = mergeEntries(d?.entries ?? [], changes, e => e.cityKey === key);
      if (!d && !entries.length) return null;
      const categoryCounts: Record<string, number> = {};
      for (const e of entries) categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      return {
        city: entries[0]?.city ?? '',
        state: entries[0]?.state ?? state.toUpperCase(),
        key,
        sample: false,
        ...d,
        categoryCounts,
        entries,
      };
    });
  }
}

/**
 * Applies live changes to a list from the snapshot: edited listings are
 * replaced, ones taken down are dropped, and newly approved ones that belong
 * (`keep`) are added. Sorted newest first, like the build.
 */
export function mergeEntries(entries: DirectoryEntry[], changes: LiveChanges, keep: (e: DirectoryEntry) => boolean): DirectoryEntry[] {
  const out: DirectoryEntry[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    seen.add(e.id);
    const c = changes.get(e.id);
    if (!c) {
      out.push(e);
      continue;
    }
    if (!c.business) continue;
    // Keep the published URL; the build may have made it unique.
    const next = { ...toEntry(c.business), slug: e.slug };
    if (keep(next)) out.push(next);
  }
  for (const [id, c] of changes) {
    if (seen.has(id) || !c.business) continue;
    const next = toEntry(c.business);
    if (keep(next)) out.push(next);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt || a.name.localeCompare(b.name));
}

function citySummaries(entries: DirectoryEntry[]): CitySummary[] {
  const map = new Map<string, CitySummary>();
  for (const e of entries) {
    const c = map.get(e.cityKey) ?? { key: e.cityKey, city: e.city, state: e.state, count: 0 };
    c.count++;
    map.set(e.cityKey, c);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}
