import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DirectoryEntry } from '../models/directory.model';

const KEY = 'apneyy_recent';

/** Recently viewed businesses, kept in this browser only. */
@Injectable({ providedIn: 'root' })
export class RecentService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly items = signal<DirectoryEntry[]>([]);

  /** Read after hydration so server and browser render the same first frame. */
  load(): void {
    if (!this.browser) return;
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      this.items.set(Array.isArray(v) ? v : []);
    } catch {
      this.items.set([]);
    }
  }

  push(e: DirectoryEntry): void {
    if (!this.browser) return;
    this.load();
    const next = [e, ...this.items().filter(x => x.id !== e.id)].slice(0, 12);
    this.items.set(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
}
