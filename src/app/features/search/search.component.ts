import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, PLATFORM_ID, afterNextRender, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/data/data.service';
import { CategoryService } from '../../core/data/category.service';
import { SeoService } from '../../core/seo/seo.service';
import { SEARCH_TOUR, TourService } from '../../core/ui/tour.service';
import { DirectoryEntry } from '../../core/models/directory.model';
import { EMPTY_FILTERS, SearchFilters, SortKey, facetCounts, runSearch } from '../../core/util/search.util';
import { DIETARY, PRICE_RANGES, SERVICES } from '../../core/constants/listing-options.constant';
import { LANGUAGES } from '../../core/constants/languages.constant';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { CardSkeletonComponent } from '../../shared/card-skeleton.component';
import { ToastService } from '../../core/ui/toast.service';

const PAGE = 24;

const csv = (v: unknown) => (typeof v === 'string' && v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

function fromParams(p: Params): SearchFilters {
  const sort = (['relevance', 'newest', 'name', 'distance'] as SortKey[]).includes(p['sort']) ? (p['sort'] as SortKey) : 'relevance';
  return {
    q: p['q'] ?? '',
    where: p['where'] ?? '',
    categories: csv(p['cat']),
    group: p['group'] ?? '',
    languages: csv(p['lang']),
    dietary: csv(p['diet']),
    services: csv(p['svc']),
    price: csv(p['price']),
    openNow: p['open'] === '1',
    sort,
  };
}

function toParams(f: SearchFilters): Params {
  const p: Params = {};
  if (f.q) p['q'] = f.q;
  if (f.where) p['where'] = f.where;
  if (f.categories.length) p['cat'] = f.categories.join(',');
  if (f.group) p['group'] = f.group;
  if (f.languages.length) p['lang'] = f.languages.join(',');
  if (f.dietary.length) p['diet'] = f.dietary.join(',');
  if (f.services.length) p['svc'] = f.services.join(',');
  if (f.price.length) p['price'] = f.price.join(',');
  if (f.openNow) p['open'] = '1';
  if (f.sort !== 'relevance') p['sort'] = f.sort;
  return p;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, RouterLink, BusinessCardComponent, CardSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-line bg-white/60">
      <div class="apneyy-container py-6">
        <nav class="text-xs text-ink-3" aria-label="Breadcrumb"><a routerLink="/" class="hover:text-brand">Home</a> <span aria-hidden="true">/</span> Explore</nav>
        <h1 class="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{{ heading() }}</h1>
        <form class="mt-5 flex flex-col gap-2 sm:flex-row" (submit)="$event.preventDefault()" role="search">
          <label class="relative flex-1">
            <span class="sr-only">Search</span>
            <svg class="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" /></svg>
            <input class="apneyy-input !py-3 !pl-11" placeholder="Name, food, service or tag" [ngModel]="f().q" (ngModelChange)="patch({ q: $event })" name="q" autocomplete="off" />
          </label>
          <label class="relative sm:w-64">
            <span class="sr-only">Where</span>
            <svg class="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-saffron-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            <input class="apneyy-input !py-3 !pl-11" placeholder="City, state or ZIP" [ngModel]="f().where" (ngModelChange)="patch({ where: $event })" name="where" list="city-list" autocomplete="off" />
            <datalist id="city-list">
              @for (c of cityOptions(); track c) { <option [value]="c"></option> }
            </datalist>
          </label>
        </form>
      </div>
    </div>

    <div class="apneyy-container grid gap-8 py-8 lg:grid-cols-[17rem_1fr]">
      <!-- Filters -->
      <aside class="hidden lg:block" data-tour="filters" aria-label="Filters">
        <div class="sticky top-24 max-h-[calc(100vh-7rem)] space-y-6 overflow-y-auto pb-6 pr-2">
          <ng-container *ngTemplateOutlet="filtersTpl" />
        </div>
      </aside>

      <div>
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-2">
          <p class="mr-auto text-sm text-ink-2" aria-live="polite">
            @if (loading()) { Loading businesses… } @else { <strong class="text-ink">{{ hits().length.toLocaleString() }}</strong> {{ hits().length === 1 ? 'result' : 'results' }} }
          </p>
          <button type="button" class="apneyy-chip lg:hidden" (click)="sheet.set(true)">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M4 6h16M7 12h10M10 18h4" /></svg>
            Filters @if (activeCount()) { <span class="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">{{ activeCount() }}</span> }
          </button>
          <button type="button" data-tour="open-now" class="apneyy-chip" [attr.aria-pressed]="f().openNow" (click)="patch({ openNow: !f().openNow })">
            <span class="h-2 w-2 rounded-full" [class]="f().openNow ? 'bg-green-600 animate-pulse-dot' : 'bg-ink-4'"></span> Open now
          </button>
          <label class="flex items-center gap-2 text-sm" data-tour="sort">
            <span class="text-ink-3">Sort</span>
            <select class="apneyy-select !w-auto !py-2" [ngModel]="f().sort" (ngModelChange)="setSort($event)" name="sort">
              <option value="relevance">Best match</option>
              <option value="newest">Newest</option>
              <option value="name">A to Z</option>
              <option value="distance">Nearest to me</option>
            </select>
          </label>
        </div>

        @if (chips().length) {
          <div class="mt-4 flex flex-wrap gap-2">
            @for (c of chips(); track c.key) {
              <button type="button" (click)="c.remove()" class="inline-flex animate-scale-in items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-sm font-medium text-brand-ink transition hover:bg-brand hover:text-white">
                {{ c.label }} <span aria-hidden="true">✕</span><span class="sr-only">Remove filter</span>
              </button>
            }
            <button type="button" class="apneyy-btn-ghost !py-1.5 text-brand" (click)="clear()">Clear all</button>
          </div>
        }

        <!-- Results -->
        <div class="mt-6" data-tour="results">
          @if (loading()) {
            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) { <app-card-skeleton /> }
            </div>
          } @else if (!hits().length) {
            <div class="animate-fade-up rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
              <p class="text-5xl" aria-hidden="true">🔍</p>
              <h2 class="mt-4 font-display text-2xl font-bold">No matches yet</h2>
              <p class="mx-auto mt-2 max-w-md text-ink-3">Try fewer filters, a nearby city, or a broader word like “restaurant” or “grocery”. New businesses join Apneyy every week.</p>
              <div class="mt-6 flex flex-wrap justify-center gap-2">
                @if (activeCount() || f().q || f().where) { <button type="button" class="apneyy-btn-primary" (click)="clear()">Clear search</button> }
                <a routerLink="/categories" class="apneyy-btn-outline">Browse categories</a>
              </div>
            </div>
          } @else {
            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              @for (h of shown(); track h.entry.id; let i = $index) {
                <app-business-card class="animate-fade-up" [style.animation-delay.ms]="(i % PAGE) * 35" [entry]="h.entry" [miles]="h.miles" />
              }
            </div>
            @if (shown().length < hits().length) {
              <div #more class="mt-10 flex justify-center">
                <button type="button" class="apneyy-btn-outline" (click)="limit.set(limit() + PAGE)">Show more ({{ hits().length - shown().length }} left)</button>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Mobile filter sheet -->
    @if (sheet()) {
      <div class="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
        <div class="absolute inset-0 animate-fade-in bg-ink/50" (click)="sheet.set(false)"></div>
        <div class="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-slide-up flex-col rounded-t-3xl bg-paper shadow-2xl">
          <div class="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 class="font-display text-xl font-bold">Filters</h2>
            <button type="button" class="apneyy-btn-ghost" (click)="sheet.set(false)" aria-label="Close">✕</button>
          </div>
          <div class="flex-1 space-y-6 overflow-y-auto px-5 py-5"><ng-container *ngTemplateOutlet="filtersTpl" /></div>
          <div class="flex gap-2 border-t border-line p-4">
            <button type="button" class="apneyy-btn-outline flex-1" (click)="clear()">Clear</button>
            <button type="button" class="apneyy-btn-primary flex-[2]" (click)="sheet.set(false)">Show {{ hits().length }} results</button>
          </div>
        </div>
      </div>
    }

    <ng-template #filtersTpl>
      <fieldset>
        <legend class="mb-2.5 text-sm font-bold text-ink">Category</legend>
        <div class="space-y-1">
          @for (g of cats.groups(); track g.id) {
            <details class="group" [open]="g.categories.some(isSelectedCat)">
              <summary class="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-2 hover:bg-sunk">
                <span>{{ g.icon }} {{ g.label }}</span>
                <span class="text-xs text-ink-4 transition group-open:rotate-90" aria-hidden="true">▶</span>
              </summary>
              <div class="ml-2 mt-1 space-y-0.5 border-l border-line pl-3">
                @for (c of g.categories; track c.id) {
                  <label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-sunk" [class.opacity-50]="!catCounts()[c.id] && !f().categories.includes(c.id)">
                    <input type="checkbox" class="h-4 w-4 rounded accent-[#a3242f]" [checked]="f().categories.includes(c.id)" (change)="toggle('categories', c.id)" />
                    <span class="flex-1">{{ c.label }}</span>
                    <span class="text-xs text-ink-4">{{ catCounts()[c.id] || 0 }}</span>
                  </label>
                }
              </div>
            </details>
          }
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2.5 text-sm font-bold text-ink">Language spoken</legend>
        <div class="flex flex-wrap gap-1.5">
          @for (l of languages; track l.code) {
            <button type="button" class="apneyy-chip !px-3 !py-1.5 !text-xs" [attr.aria-pressed]="f().languages.includes(l.name)" (click)="toggle('languages', l.name)">{{ l.name }}</button>
          }
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2.5 text-sm font-bold text-ink">Dietary</legend>
        <div class="flex flex-wrap gap-1.5">
          @for (d of dietary; track d.id) {
            <button type="button" class="apneyy-chip !px-3 !py-1.5 !text-xs" [attr.aria-pressed]="f().dietary.includes(d.id)" (click)="toggle('dietary', d.id)">{{ d.icon }} {{ d.label }}</button>
          }
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2.5 text-sm font-bold text-ink">Price</legend>
        <div class="flex gap-1.5">
          @for (p of prices; track p.value) {
            <button type="button" class="apneyy-chip flex-1 justify-center !px-2 !py-1.5" [attr.aria-pressed]="f().price.includes(p.value)" (click)="toggle('price', p.value)" [title]="p.desc">{{ p.value }}</button>
          }
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2.5 text-sm font-bold text-ink">Services</legend>
        <div class="flex flex-wrap gap-1.5">
          @for (s of services; track s.id) {
            <button type="button" class="apneyy-chip !px-3 !py-1.5 !text-xs" [attr.aria-pressed]="f().services.includes(s.id)" (click)="toggle('services', s.id)">{{ s.label }}</button>
          }
        </div>
      </fieldset>
    </ng-template>
  `,
})
export class SearchComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  readonly cats = inject(CategoryService);
  private readonly seo = inject(SeoService);
  private readonly tour = inject(TourService);
  private readonly toast = inject(ToastService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly more = viewChild<ElementRef<HTMLElement>>('more');

  readonly PAGE = PAGE;
  readonly languages = LANGUAGES.filter(l => l.code !== 'other');
  readonly dietary = DIETARY;
  readonly prices = PRICE_RANGES;
  readonly services = SERVICES.filter(s => !s.foodOnly || ['dine_in', 'takeout', 'catering', 'buffet'].includes(s.id));

  readonly f = signal<SearchFilters>(fromParams(this.route.snapshot.queryParams));
  readonly entries = signal<DirectoryEntry[] | null>(null);
  readonly loading = computed(() => this.entries() === null);
  readonly origin = signal<{ lat: number; lng: number } | null>(null);
  readonly limit = signal(PAGE);
  readonly sheet = signal(false);
  private observer: IntersectionObserver | null = null;
  private urlTimer: ReturnType<typeof setTimeout> | null = null;

  readonly hits = computed(() =>
    runSearch(this.entries() ?? [], this.f(), {
      categoryLabel: id => this.cats.label(id),
      categoryGroup: id => this.cats.group(id),
      origin: this.origin(),
    })
  );
  readonly shown = computed(() => this.hits().slice(0, this.limit()));

  /** Category counts with every filter applied except category itself. */
  readonly catCounts = computed(() => {
    const base = runSearch(this.entries() ?? [], { ...this.f(), categories: [], sort: 'name' }, { categoryLabel: id => this.cats.label(id), categoryGroup: id => this.cats.group(id), origin: null });
    return facetCounts(base, e => e.category);
  });

  readonly cityOptions = computed(() => {
    const set = new Set<string>();
    for (const e of this.entries() ?? []) set.add(`${e.city}, ${e.state}`);
    return [...set].sort().slice(0, 300);
  });

  readonly activeCount = computed(() => {
    const f = this.f();
    return f.categories.length + f.languages.length + f.dietary.length + f.services.length + f.price.length + (f.group ? 1 : 0);
  });

  readonly heading = computed(() => {
    const f = this.f();
    const what = f.categories.length === 1 ? this.cats.label(f.categories[0]) : f.group ? this.cats.groups().find(g => g.id === f.group)?.label : f.q ? `“${f.q}”` : 'South Asian businesses';
    return f.where ? `${what} near ${f.where}` : f.q || f.categories.length || f.group ? `${what}` : 'Explore South Asian businesses';
  });

  readonly chips = computed(() => {
    const f = this.f();
    const out: { key: string; label: string; remove: () => void }[] = [];
    if (f.group) out.push({ key: 'g', label: this.cats.groups().find(g => g.id === f.group)?.label ?? f.group, remove: () => this.patch({ group: '' }) });
    for (const c of f.categories) out.push({ key: 'c' + c, label: this.cats.label(c), remove: () => this.toggle('categories', c) });
    for (const l of f.languages) out.push({ key: 'l' + l, label: `Speaks ${l}`, remove: () => this.toggle('languages', l) });
    for (const d of f.dietary) out.push({ key: 'd' + d, label: DIETARY.find(x => x.id === d)?.label ?? d, remove: () => this.toggle('dietary', d) });
    for (const s of f.services) out.push({ key: 's' + s, label: SERVICES.find(x => x.id === s)?.label ?? s, remove: () => this.toggle('services', s) });
    for (const p of f.price) out.push({ key: 'p' + p, label: p, remove: () => this.toggle('price', p) });
    return out;
  });

  readonly isSelectedCat = (c: { id: string }) => this.f().categories.includes(c.id);

  constructor() {
    this.seo.set({
      title: 'Explore South Asian businesses near you',
      description: 'Search South Asian restaurants, grocers, salons, wedding vendors, temples and services across the US. Filter by language, Jain, halal, pure veg, price and open now.',
      path: '/search',
    });

    // Back/forward and links into /search update the filters.
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(p => {
      const next = fromParams(p);
      if (JSON.stringify(next) !== JSON.stringify(untracked(this.f))) {
        this.f.set(next);
        this.limit.set(PAGE);
      }
    });

    // The directory loads in the browser only; the prerendered page shows skeletons.
    if (this.browser) this.data.directory().subscribe(d => this.entries.set(d?.entries ?? []));

    // Infinite scroll: load the next page when "Show more" comes into view.
    effect(() => {
      const el = this.more()?.nativeElement;
      this.observer?.disconnect();
      if (!el || !this.browser) return;
      this.observer = new IntersectionObserver(es => es.some(e => e.isIntersecting) && this.limit.update(n => n + PAGE), { rootMargin: '400px' });
      this.observer.observe(el);
    });

    afterNextRender(() => {
      if (this.f().sort === 'distance') this.locate();
      setTimeout(() => this.tour.startOnce('search', SEARCH_TOUR, 0), 1600);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.urlTimer) clearTimeout(this.urlTimer);
  }

  patch(p: Partial<SearchFilters>): void {
    this.f.update(f => ({ ...f, ...p }));
    this.limit.set(PAGE);
    this.syncUrl();
  }

  toggle(key: 'categories' | 'languages' | 'dietary' | 'services' | 'price', value: string): void {
    const list = this.f()[key];
    this.patch({ [key]: list.includes(value) ? list.filter(v => v !== value) : [...list, value] } as Partial<SearchFilters>);
  }

  setSort(sort: SortKey): void {
    this.patch({ sort });
    if (sort === 'distance') this.locate();
  }

  clear(): void {
    this.f.set({ ...EMPTY_FILTERS });
    this.limit.set(PAGE);
    this.syncUrl();
  }

  private locate(): void {
    if (this.origin() || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => this.origin.set({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        this.toast.show('We couldn’t get your location. Type a city or ZIP instead.', 'error');
        this.patch({ sort: 'relevance' });
      },
      { maximumAge: 600000, timeout: 10000 }
    );
  }

  /** Typing updates the URL after a short pause so it can be shared and survives refresh. */
  private syncUrl(): void {
    if (this.urlTimer) clearTimeout(this.urlTimer);
    this.urlTimer = setTimeout(() => {
      void this.router.navigate([], { queryParams: toParams(this.f()), replaceUrl: true });
    }, 300);
  }
}
