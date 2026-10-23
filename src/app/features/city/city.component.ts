import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs';
import { DataService } from '../../core/data/data.service';
import { CategoryService } from '../../core/data/category.service';
import { SeoService } from '../../core/seo/seo.service';
import { CityData } from '../../core/models/directory.model';
import { stateName } from '../../core/constants/geography.constant';
import { RevealDirective } from '../../core/ui/reveal.directive';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [RouterLink, RevealDirective, BusinessCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative overflow-hidden bg-ink text-white">
      <div class="bg-motif absolute inset-0 opacity-20"></div>
      <div class="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/50 blur-3xl"></div>
      <div class="apneyy-container relative py-14">
        <nav class="text-xs text-white/60" aria-label="Breadcrumb"><a routerLink="/" class="hover:text-white">Home</a> / <a routerLink="/cities" class="hover:text-white">Cities</a> / {{ title() }}</nav>
        <h1 class="mt-3 animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-5xl">South Asian businesses in {{ title() }}</h1>
        <p class="mt-3 text-white/75">{{ data()?.entries?.length ?? 0 }} places in {{ title() }}, {{ fullState() }}: food, shopping, services and community.</p>
      </div>
    </section>

    <div class="apneyy-container py-8">
      @if (cats().length > 1) {
        <div class="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" class="apneyy-chip" [attr.aria-pressed]="cat() === ''" (click)="cat.set('')">All</button>
          @for (c of cats(); track c.id) {
            <button type="button" class="apneyy-chip" [attr.aria-pressed]="cat() === c.id" (click)="cat.set(c.id)"><app-icon [name]="c.icon" /> {{ c.label }} <span class="text-ink-4">{{ c.count }}</span></button>
          }
        </div>
      }
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        @for (e of list(); track e.id; let i = $index) {
          <app-business-card [entry]="e" [appReveal]="i % 3" />
        } @empty {
          <p class="col-span-full rounded-3xl border border-dashed border-line bg-white p-12 text-center text-ink-3">No businesses listed here yet.</p>
        }
      </div>
      <div class="mt-10 text-center">
        <a routerLink="/search" [queryParams]="{ where: title() + ', ' + (data()?.state ?? '') }" class="apneyy-btn-outline">Search & filter in {{ title() }} →</a>
      </div>
    </div>
  `,
})
export class CityComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataSvc = inject(DataService);
  private readonly catSvc = inject(CategoryService);
  private readonly seo = inject(SeoService);

  readonly data = toSignal<CityData | null>(
    this.route.paramMap.pipe(
      map(p => ({ state: p.get('state') ?? '', city: p.get('city') ?? '' })),
      switchMap(p => this.dataSvc.city(p.state, p.city)),
      tap(d => this.setSeo(d))
    ),
    { initialValue: null }
  );
  readonly cat = signal('');
  readonly title = computed(() => this.data()?.city ?? this.prettyCity());
  readonly fullState = computed(() => stateName(this.data()?.state ?? this.route.snapshot.paramMap.get('state') ?? ''));
  readonly cats = computed(() =>
    Object.entries(this.data()?.categoryCounts ?? {})
      .map(([id, count]) => ({ id, count, label: this.catSvc.label(id), icon: this.catSvc.icon(id) }))
      .sort((a, b) => b.count - a.count)
  );
  readonly list = computed(() => (this.data()?.entries ?? []).filter(e => !this.cat() || e.category === this.cat()));

  private prettyCity(): string {
    return (this.route.snapshot.paramMap.get('city') ?? '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private setSeo(d: CityData | null): void {
    const city = d?.city ?? this.prettyCity();
    const state = d?.state ?? (this.route.snapshot.paramMap.get('state') ?? '').toUpperCase();
    const top = Object.entries(d?.categoryCounts ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => this.catSvc.label(id).toLowerCase())
      .join(', ');
    this.seo.set({
      title: `South Asian businesses in ${city}, ${state}`,
      description: `${d?.entries.length ?? 0} South Asian businesses in ${city}, ${stateName(state)}${top ? ': ' + top + ' and more' : ''}. Hours, directions and reviews on Apneyy.`,
      path: `/city/${state.toLowerCase()}/${this.route.snapshot.paramMap.get('city')}`,
      noindex: !d || !d.entries.length,
      jsonLd: this.seo.breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Cities', path: '/cities' }, { name: `${city}, ${state}`, path: `/city/${d?.key ?? ''}` }]),
    });
  }
}
