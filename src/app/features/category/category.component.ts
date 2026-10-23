import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs';
import { DataService } from '../../core/data/data.service';
import { CategoryService } from '../../core/data/category.service';
import { SeoService } from '../../core/seo/seo.service';
import { CategoryData } from '../../core/models/directory.model';
import { RevealDirective } from '../../core/ui/reveal.directive';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { isOpenNow } from '../../core/util/hours.util';
import { IconComponent } from '../../shared/icon.component';
import { PhotoComponent } from '../../shared/photo.component';

const PAGE = 24;

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [RouterLink, RevealDirective, BusinessCardComponent, IconComponent, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative overflow-hidden border-b border-line bg-gradient-to-br from-[#fff3e4] to-paper">
      <app-photo class="absolute inset-y-0 right-0 hidden w-1/2 md:block" [key]="image()" sizes="50vw" [eager]="true" />
      <div class="absolute inset-0 hidden bg-gradient-to-r from-[#fff3e4] via-[#fff3e4]/90 to-transparent md:block"></div>
      <div class="bg-motif absolute inset-0 opacity-30 md:hidden"></div>
      <div class="apneyy-container relative py-12">
        <nav class="text-xs text-ink-3" aria-label="Breadcrumb"><a routerLink="/" class="hover:text-brand">Home</a> / <a routerLink="/categories" class="hover:text-brand">Categories</a> / {{ label() }}</nav>
        <div class="mt-3 flex items-center gap-4">
          <span class="grid h-16 w-16 shrink-0 animate-scale-in place-items-center rounded-2xl bg-white text-3xl text-brand shadow-card"><app-icon [name]="icon()" /></span>
          <div>
            <h1 class="animate-fade-up font-display text-3xl font-bold tracking-tight sm:text-4xl">South Asian {{ label().toLowerCase() }} in the US</h1>
            <p class="mt-1 text-ink-2">{{ count() }} {{ count() === 1 ? 'place' : 'places' }} on Apneyy, checked by our team.</p>
          </div>
        </div>
        @if (data()?.cities?.length) {
          <div class="mt-6 flex flex-wrap gap-2">
            <button type="button" class="apneyy-chip !py-1.5" [attr.aria-pressed]="city() === ''" (click)="pickCity('')">All cities</button>
            @for (c of data()!.cities.slice(0, 12); track c.key) {
              <button type="button" class="apneyy-chip !py-1.5" [attr.aria-pressed]="city() === c.key" (click)="pickCity(c.key)">{{ c.city }}, {{ c.state }} <span class="text-ink-4">{{ c.count }}</span></button>
            }
          </div>
        }
      </div>
    </section>

    <div class="apneyy-container py-8">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" class="apneyy-chip" [attr.aria-pressed]="openNow()" (click)="openNow.set(!openNow())">
          <span class="h-2 w-2 rounded-full" [class]="openNow() ? 'bg-green-600' : 'bg-ink-4'"></span> Open now
        </button>
        <a routerLink="/search" [queryParams]="{ cat: id() }" class="apneyy-btn-ghost text-brand">More filters →</a>
      </div>
      @if (list().length) {
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (e of list().slice(0, limit()); track e.id; let i = $index) {
            <app-business-card [entry]="e" [appReveal]="i % 3" />
          }
        </div>
        @if (list().length > limit()) {
          <div class="mt-10 text-center"><button type="button" class="apneyy-btn-outline" (click)="limit.set(limit() + 24)">Show more</button></div>
        }
      } @else {
        <div class="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-light text-3xl text-brand"><app-icon [name]="icon()" /></span>
          <h2 class="mt-3 font-display text-2xl font-bold">{{ openNow() ? 'Nothing open right now' : 'Coming soon' }}</h2>
          <p class="mx-auto mt-2 max-w-md text-ink-3">{{ openNow() ? 'Try again later, or turn off “Open now”.' : 'We’re adding ' + label().toLowerCase() + ' every week. Know a great one? Tell them to list on Apneyy for free.' }}</p>
          <a routerLink="/categories" class="apneyy-btn-outline mt-6">Browse other categories</a>
        </div>
      }
    </div>
  `,
})
export class CategoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataSvc = inject(DataService);
  private readonly cats = inject(CategoryService);
  private readonly seo = inject(SeoService);

  readonly id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')), { initialValue: '' });
  readonly data = toSignal<CategoryData | null>(
    this.route.paramMap.pipe(
      map(p => p.get('id') ?? ''),
      tap(id => this.setSeo(id)),
      switchMap(id => this.dataSvc.category(id)),
      tap(d => this.setSeo(this.id(), d))
    ),
    { initialValue: null }
  );
  readonly city = signal('');
  readonly openNow = signal(false);
  readonly limit = signal(PAGE);

  readonly label = computed(() => this.cats.label(this.id()));
  readonly icon = computed(() => this.cats.icon(this.id()));
  readonly image = computed(() => this.cats.image(this.id()));
  readonly count = computed(() => this.data()?.entries.length ?? 0);
  readonly list = computed(() => {
    let l = this.data()?.entries ?? [];
    if (this.city()) l = l.filter(e => e.cityKey === this.city());
    if (this.openNow()) l = l.filter(e => isOpenNow(e.hours, e.timezone) === true);
    return l;
  });

  pickCity(key: string): void {
    this.city.set(key);
    this.limit.set(PAGE);
  }

  private setSeo(id: string, d?: CategoryData | null): void {
    const label = this.cats.label(id);
    const n = d?.entries.length ?? 0;
    const top = (d?.cities ?? []).slice(0, 3).map(c => c.city).join(', ');
    this.seo.set({
      title: `South Asian ${label} near you`,
      description: `Find ${n ? n + ' ' : ''}South Asian ${label.toLowerCase()} across the US${top ? ', including ' + top : ''}. Hours, phone numbers, directions and reviews on Apneyy.`,
      path: `/category/${id}`,
      noindex: !!d && n === 0,
      jsonLd: [
        this.seo.breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Categories', path: '/categories' }, { name: label, path: `/category/${id}` }]),
        ...(d?.entries.length
          ? [{
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: `South Asian ${label}`,
              itemListElement: d.entries.slice(0, 30).map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: this.seo.absolute(`/business/${e.slug}`), name: e.name })),
            }]
          : []),
      ],
    });
  }
}
