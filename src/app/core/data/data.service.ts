import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import {
  BusinessData,
  CategoryData,
  CitySummary,
  CityData,
  DirectoryData,
  HomeData,
} from '../models/directory.model';

/**
 * Reads the static directory published with the site (see scripts/build-data.mjs).
 * These files come from the CDN, so browsing costs no Firestore reads. Requests
 * made while prerendering are embedded in the page (HTTP transfer cache), so a
 * visitor's first view doesn't fetch them again.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
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

  home() {
    return this.get<HomeData>('home.json');
  }

  /** Every listing in compact form. Large; only loaded in the browser for search. */
  directory() {
    return this.get<DirectoryData>('directory.json');
  }

  cities() {
    return this.get<{ cities: CitySummary[] }>('cities.json');
  }

  business(slug: string) {
    return this.get<BusinessData>(`b/${encodeURIComponent(slug)}.json`);
  }

  category(id: string) {
    return this.get<CategoryData>(`category/${encodeURIComponent(id)}.json`);
  }

  city(state: string, city: string) {
    return this.get<CityData>(`city/${encodeURIComponent(state.toLowerCase())}-${encodeURIComponent(city)}.json`);
  }
}
