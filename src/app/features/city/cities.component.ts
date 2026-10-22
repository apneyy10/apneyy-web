import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../../core/seo/seo.service';
import { CitySummary } from '../../core/models/directory.model';
import { stateName } from '../../core/constants/geography.constant';
import { fold } from '../../core/util/text.util';

@Component({
  selector: 'app-cities',
  standalone: true,
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container py-12">
      <p class="apneyy-eyebrow">Near you</p>
      <h1 class="mt-1 font-display text-4xl font-bold tracking-tight">Cities on Apneyy</h1>
      <label class="mt-6 block max-w-md">
        <span class="sr-only">Find a city</span>
        <input class="apneyy-input" placeholder="Find a city or state" [ngModel]="q()" (ngModelChange)="q.set($event)" name="q" />
      </label>
      <div class="mt-8 space-y-10">
        @for (s of byState(); track s.state) {
          <section>
            <h2 class="font-display text-xl font-bold">{{ s.name }}</h2>
            <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              @for (c of s.cities; track c.key) {
                <a [routerLink]="'/city/' + c.key" class="rounded-xl border border-line bg-white px-4 py-3 transition hover:border-brand/40 hover:shadow-card">
                  <span class="block font-semibold text-ink">{{ c.city }}</span>
                  <span class="text-xs text-ink-3">{{ c.count }} {{ c.count === 1 ? 'business' : 'businesses' }}</span>
                </a>
              }
            </div>
          </section>
        } @empty {
          <p class="text-ink-3">No cities match “{{ q() }}”.</p>
        }
      </div>
    </div>
  `,
})
export class CitiesComponent {
  // Small file; fine to embed in the prerendered page (unlike the full directory).
  private readonly cities = toSignal(inject(HttpClient).get<{ cities: CitySummary[] }>('/data/cities.json?page'), { initialValue: { cities: [] } });
  readonly q = signal('');

  readonly byState = computed(() => {
    const q = fold(this.q()).trim();
    const groups = new Map<string, CitySummary[]>();
    for (const c of this.cities()?.cities ?? []) {
      if (q && !fold(`${c.city} ${c.state} ${stateName(c.state)}`).includes(q)) continue;
      groups.set(c.state, [...(groups.get(c.state) ?? []), c]);
    }
    return [...groups.entries()]
      .map(([state, cities]) => ({ state, name: stateName(state), cities: cities.sort((a, b) => a.city.localeCompare(b.city)) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    inject(SeoService).set({
      title: 'Cities',
      description: 'Find South Asian restaurants, shops and services by city across the US on Apneyy.',
      path: '/cities',
    });
  }
}
