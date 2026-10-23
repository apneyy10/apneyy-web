import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface TourStep {
  /** Matches an element's data-tour attribute. Omit for a centered card. */
  target?: string;
  title: string;
  body: string;
}

export const HOME_TOUR: TourStep[] = [
  { title: 'Welcome to Apneyy', body: 'Find South Asian restaurants, grocers, salons, temples and more near you. Here’s a 20-second look around.' },
  { target: 'search', title: 'Search anything', body: 'Type a craving or a need, like “dosa”, “mehndi” or “gurdwara”, and a city or ZIP. Results show up as you type.' },
  { target: 'categories', title: 'Browse by category', body: 'Swipe through categories, or tap one to see every business of that kind.' },
  { target: 'languages', title: 'Speak your language', body: 'Find places where staff speak Hindi, Punjabi, Urdu, Bengali, Tamil, Nepali and more.' },
  { target: 'account', title: 'Save your favourites', body: 'Tap the heart on any business to save it. Sign in to keep your list on every device.' },
];

export const SEARCH_TOUR: TourStep[] = [
  { target: 'filters', title: 'Narrow it down', body: 'Filter by category, language, dietary needs like Jain or halal, price and more.' },
  { target: 'open-now', title: 'Open right now', body: 'Switch this on to only see places open at this moment, in their own time zone.' },
  { target: 'sort', title: 'Sort your way', body: 'Best match, newest on Apneyy, A to Z, or nearest to you.' },
  { target: 'results', title: 'Tap to explore', body: 'Open any card for hours, menu highlights, directions and reviews. Tap the heart to save it.' },
];

/** Spotlight tours, shown once per browser per tour and replayable from the help menu. */
@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly steps = signal<TourStep[]>([]);
  readonly index = signal(-1);
  readonly active = computed(() => this.index() >= 0 && this.index() < this.steps().length);
  readonly current = computed(() => (this.active() ? this.steps()[this.index()] : null));

  start(steps: TourStep[]): void {
    if (!this.browser) return;
    this.steps.set(steps.filter(s => !s.target || document.querySelector(`[data-tour="${s.target}"]`)));
    this.index.set(0);
  }

  startOnce(name: string, steps: TourStep[], delay = 900): void {
    if (!this.browser) return;
    const key = `apneyy_tour_${name}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      return;
    }
    setTimeout(() => this.start(steps), delay);
  }

  next(): void {
    this.index.update(i => (i + 1 < this.steps().length ? i + 1 : -1));
  }

  back(): void {
    this.index.update(i => Math.max(i - 1, 0));
  }

  end(): void {
    this.index.set(-1);
  }
}
