import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, catchError, concat, distinctUntilChanged, from, map, of, switchMap, tap } from 'rxjs';
import { DataService } from '../../core/data/data.service';
import { CategoryService } from '../../core/data/category.service';
import { SeoService } from '../../core/seo/seo.service';
import { RecentService } from '../../core/member/recent.service';
import { ToastService } from '../../core/ui/toast.service';
import { fetchLiveBusiness, watchLiveBusiness } from '../../core/data/live-business';
import { DirectoryEntry, PublicBusiness } from '../../core/models/directory.model';
import { AMENITIES, CONNECTIONS, CUISINES, DIETARY, ORDERING_PLATFORMS, SCHEMA_TYPES, SERVICES, labelFor } from '../../core/constants/listing-options.constant';
import { WEEKDAYS, formatRanges, isOpenNow, statusLine, todayKey } from '../../core/util/hours.util';
import { stateName } from '../../core/constants/geography.constant';
import { RevealDirective } from '../../core/ui/reveal.directive';
import { CoverComponent } from '../../shared/cover.component';
import { SaveButtonComponent } from '../../shared/save-button.component';
import { CarouselComponent } from '../../shared/carousel.component';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { LightboxComponent } from './lightbox.component';
import { ReviewsComponent } from './reviews.component';
import { ReportDialogComponent } from './report-dialog.component';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/icon.component';

type Loaded = { state: 'ok'; business: PublicBusiness; similar: DirectoryEntry[] } | { state: 'missing' } | { state: 'loading' };

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [RouterLink, RevealDirective, CoverComponent, SaveButtonComponent, CarouselComponent, BusinessCardComponent, LightboxComponent, ReviewsComponent, ReportDialogComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (loaded().state) {
      @case ('loading') {
        <div class="apneyy-container py-10" aria-busy="true">
          <div class="skeleton aspect-[21/9] w-full !rounded-3xl"></div>
          <div class="mt-6 skeleton h-10 w-1/2"></div>
          <div class="mt-3 skeleton h-5 w-1/3"></div>
        </div>
      }
      @case ('missing') {
        <div class="apneyy-container py-24 text-center">
          <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-light text-3xl text-brand"><app-icon name="compass" /></span>
          <h1 class="mt-4 font-display text-3xl font-bold">We couldn’t find that business</h1>
          <p class="mt-2 text-ink-3">It may have moved or is no longer listed.</p>
          <a routerLink="/search" class="apneyy-btn-primary mt-6">Explore businesses</a>
        </div>
      }
    }

    @if (b(); as b) {
      <article itemscope>
        <!-- Gallery -->
        <div class="apneyy-container pt-5">
          <nav class="mb-4 flex flex-wrap items-center gap-1 text-xs text-ink-3" aria-label="Breadcrumb">
            <a routerLink="/" class="hover:text-brand">Home</a> <span aria-hidden="true">/</span>
            <a [routerLink]="['/category', b.category]" class="hover:text-brand">{{ categoryLabel() }}</a> <span aria-hidden="true">/</span>
            <a [routerLink]="'/city/' + b.cityKey" class="hover:text-brand">{{ b.address.city }}, {{ b.address.state }}</a> <span aria-hidden="true">/</span>
            <span class="text-ink-2">{{ b.name }}</span>
          </nav>

          @if (b.photos.length > 1) {
            <div class="hidden gap-2 overflow-hidden rounded-3xl md:grid md:h-[26rem] md:grid-cols-4 md:grid-rows-2">
              <button type="button" class="group relative col-span-2 row-span-2 overflow-hidden" (click)="openPhoto(0)" style="view-transition-name: business-hero">
                <app-cover class="h-full" [src]="b.photos[0]" [alt]="b.name" [category]="b.category" [eager]="true" />
              </button>
              @for (p of b.photos.slice(1, 5); track p; let i = $index) {
                <button type="button" class="group relative overflow-hidden" (click)="openPhoto(i + 1)" [attr.aria-label]="'Open photo ' + (i + 2)">
                  <img [src]="p" [alt]="b.name + ' photo ' + (i + 2)" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" width="1200" height="900" />
                  @if (i === 3 && b.photos.length > 5) {
                    <span class="absolute inset-0 grid place-items-center bg-ink/50 text-lg font-semibold text-white">+{{ b.photos.length - 5 }} more</span>
                  }
                </button>
              }
            </div>
            <div class="md:hidden">
              <app-carousel label="Photos" [showProgress]="true">
                @for (p of b.photos; track p; let i = $index) {
                  <button type="button" class="aspect-[4/3] w-[86vw] overflow-hidden rounded-2xl" (click)="openPhoto(i)" [attr.aria-label]="'Open photo ' + (i + 1)">
                    <img [src]="p" [alt]="b.name + ' photo ' + (i + 1)" class="h-full w-full object-cover" [attr.loading]="i ? 'lazy' : 'eager'" />
                  </button>
                }
              </app-carousel>
            </div>
          } @else {
            <div class="overflow-hidden rounded-3xl" style="view-transition-name: business-hero">
              <app-cover class="aspect-[16/9] max-h-[26rem] w-full md:aspect-[21/8]" [src]="b.photos[0] || ''" [alt]="b.name" [category]="b.category" [eager]="true" iconSize="6rem" sizes="(min-width: 1280px) 1216px, 100vw" />
            </div>
          }
        </div>

        <!-- Header -->
        <header class="apneyy-container mt-6">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex animate-fade-up gap-4">
              @if (b.logo) {
                <img [src]="b.logo" [alt]="b.name + ' logo'" class="h-20 w-20 shrink-0 rounded-2xl border border-line bg-white object-cover shadow-card" width="80" height="80" />
              }
              <div>
                <p class="inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-ink"><app-icon [name]="categoryIcon()" /> {{ categoryLabel() }}</p>
                <h1 class="mt-1 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{{ b.name }}</h1>
                @if (b.nameNative) { <p class="mt-0.5 text-lg text-ink-3">{{ b.nameNative }}</p> }
                <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-2">
                  @if (open() === true) {
                    <span class="apneyy-badge bg-apneyyGreen-tint text-apneyyGreen"><span class="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-green-600"></span>Open now</span>
                  } @else if (open() === false) {
                    <span class="apneyy-badge bg-sunk text-ink-2">Closed</span>
                  }
                  @if (status()) { <span>{{ status() }}</span> <span class="text-ink-4" aria-hidden="true">·</span> }
                  <span>{{ b.address.city }}, {{ b.address.state }}</span>
                  @if (b.priceRange) { <span class="text-ink-4" aria-hidden="true">·</span> <span class="font-semibold">{{ b.priceRange }}</span> }
                  <a href="#reviews" class="font-semibold text-brand hover:underline">Reviews</a>
                </div>
              </div>
            </div>

            <div class="flex animate-fade-up flex-wrap gap-2 [animation-delay:100ms]">
              @if (b.phone) {
                <a [href]="'tel:' + b.phone" class="apneyy-btn-primary !h-11"><app-icon name="phone" /> Call</a>
              }
              <a [href]="directionsUrl()" target="_blank" rel="noopener" class="apneyy-btn-outline !h-11"><app-icon name="navigation" /> Directions</a>
              @if (b.website) {
                <a [href]="link(b.website)" target="_blank" rel="noopener nofollow" class="apneyy-btn-outline !h-11"><app-icon name="globe" /> Website</a>
              }
              <button type="button" class="apneyy-btn-outline !h-11" (click)="share()"><app-icon name="share-2" /> Share</button>
              <app-save-button variant="outline" [businessId]="b.id" [name]="b.name" />
            </div>
          </div>
        </header>

        <div class="apneyy-container mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <!-- Main -->
          <div class="space-y-10">
            @if (b.description) {
              <section appReveal>
                <h2 class="font-display text-2xl font-bold">About</h2>
                <p class="mt-3 whitespace-pre-line leading-relaxed text-ink-2">{{ b.description }}</p>
              </section>
            }

            @if (b.connections.length) {
              <section appReveal>
                <h2 class="font-display text-2xl font-bold">Why it’s on Apneyy</h2>
                <ul class="mt-4 grid gap-2 sm:grid-cols-2">
                  @for (c of connections(); track c.id) {
                    <li class="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-light text-lg text-brand"><app-icon [name]="c.icon || 'sparkles'" /></span>{{ c.label }}</li>
                  }
                </ul>
              </section>
            }

            @if (b.featuredItems.length) {
              <section appReveal>
                <div class="flex items-end justify-between">
                  <h2 class="font-display text-2xl font-bold">{{ isFood() ? 'Must-try dishes' : 'Highlights' }}</h2>
                  @if (b.menuUrl) { <a [href]="link(b.menuUrl)" target="_blank" rel="noopener nofollow" class="text-sm font-semibold text-brand hover:underline">Full menu →</a> }
                </div>
                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  @for (item of b.featuredItems; track item.name; let i = $index) {
                    <div class="rounded-2xl border border-line bg-white p-4 transition hover:shadow-card" [appReveal]="i">
                      <div class="flex items-start justify-between gap-3">
                        <p class="font-semibold text-ink">
                          @if (isFood()) { <span class="mr-1 inline-block h-3 w-3 rounded-sm border-2 align-middle" [class]="item.isVeg ? 'border-green-700' : 'border-red-700'" [attr.aria-label]="item.isVeg ? 'Vegetarian' : 'Non-vegetarian'"><span class="m-auto block h-1 w-1 rounded-full" [class]="item.isVeg ? 'bg-green-700' : 'bg-red-700'"></span></span> }
                          {{ item.name }}
                        </p>
                        @if (item.price) { <span class="shrink-0 text-sm font-semibold text-brand">{{ item.price }}</span> }
                      </div>
                      @if (item.description) { <p class="mt-1 text-sm text-ink-3">{{ item.description }}</p> }
                    </div>
                  }
                </div>
              </section>
            }

            @if (orderLinks().length) {
              <section appReveal>
                <h2 class="font-display text-2xl font-bold">Order online</h2>
                <div class="mt-4 flex flex-wrap gap-2">
                  @for (o of orderLinks(); track o.label) {
                    <a [href]="o.url" target="_blank" rel="noopener nofollow" class="apneyy-btn-outline">{{ o.label }} ↗</a>
                  }
                </div>
              </section>
            }

            @if (details().length) {
              <section appReveal>
                <h2 class="font-display text-2xl font-bold">Good to know</h2>
                <dl class="mt-4 space-y-4">
                  @for (d of details(); track d.label) {
                    <div>
                      <dt class="text-sm font-bold text-ink-3">{{ d.label }}</dt>
                      <dd class="mt-2 flex flex-wrap gap-1.5">
                        @for (v of d.values; track v) { <span class="rounded-full bg-sunk px-3 py-1.5 text-sm text-ink-2">{{ v }}</span> }
                      </dd>
                    </div>
                  }
                </dl>
              </section>
            }

            <app-reviews [businessId]="b.id" [returnUrl]="'/business/' + b.slug" />
          </div>

          <!-- Side -->
          <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
            @if (b.openingHours) {
              <section class="apneyy-card p-5" aria-labelledby="hours-h">
                <h2 id="hours-h" class="font-display text-lg font-bold">Hours</h2>
                <table class="mt-3 w-full text-sm">
                  <tbody>
                    @for (d of hours(); track d.key) {
                      <tr [class.font-bold]="d.today" [class.text-brand]="d.today">
                        <th scope="row" class="py-1.5 pr-3 text-left font-medium">{{ d.label }}</th>
                        <td class="py-1.5 text-right" [class.text-ink-4]="!d.open">{{ d.text }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                <p class="mt-2 text-xs text-ink-4">Times shown in local time ({{ tzLabel() }}).</p>
              </section>
            }

            <section class="apneyy-card overflow-hidden" aria-labelledby="loc-h">
              @if (mapUrl(); as m) {
                <iframe [src]="m" class="h-48 w-full border-0" loading="lazy" referrerpolicy="no-referrer" [title]="'Map of ' + b.name"></iframe>
              }
              <div class="space-y-3 p-5 text-sm">
                <h2 id="loc-h" class="font-display text-lg font-bold">Location & contact</h2>
                <address class="not-italic leading-relaxed text-ink-2">
                  {{ b.address.line1 }}@if (b.address.line2) {, {{ b.address.line2 }}}<br />
                  {{ b.address.city }}, {{ b.address.state }} {{ b.address.postalCode }}
                </address>
                <a [href]="directionsUrl()" target="_blank" rel="noopener" class="inline-block font-semibold text-brand hover:underline">Get directions →</a>
                @if (b.phone) { <p><a [href]="'tel:' + b.phone" class="inline-flex items-center gap-2 font-semibold text-ink hover:text-brand"><app-icon name="phone" class="text-ink-3" /> {{ b.phoneDisplay }}</a></p> }
                @if (b.email) { <p><a [href]="'mailto:' + b.email" class="inline-flex items-center gap-2 break-all text-ink-2 hover:text-brand"><app-icon name="mail" class="text-ink-3" /> {{ b.email }}</a></p> }
                @if (b.website) { <p><a [href]="link(b.website)" target="_blank" rel="noopener nofollow" class="inline-flex items-center gap-2 break-all text-ink-2 hover:text-brand"><app-icon name="globe" class="text-ink-3" /> {{ b.website.replace('https://', '').replace('http://', '') }}</a></p> }
                @if (socials().length) {
                  <div class="flex flex-wrap gap-2 pt-1">
                    @for (s of socials(); track s.label) { <a [href]="s.url" target="_blank" rel="noopener nofollow" class="rounded-full bg-sunk px-3 py-1.5 text-xs font-semibold hover:bg-line">{{ s.label }}</a> }
                  </div>
                }
              </div>
            </section>

            @if (b.paymentMethods.length || b.licenseNumber) {
              <section class="apneyy-card space-y-3 p-5 text-sm">
                @if (b.paymentMethods.length) {
                  <div><h2 class="font-bold">Payment</h2><p class="mt-1 text-ink-2">{{ b.paymentMethods.join(' · ') }}</p></div>
                }
                @if (b.licenseNumber) {
                  <div><h2 class="font-bold">State license</h2><p class="mt-1 text-ink-2">{{ b.licenseNumber }}</p></div>
                }
              </section>
            }

            <div class="rounded-2xl bg-sunk p-5 text-sm">
              <p class="font-semibold">Is this your business?</p>
              <p class="mt-1 text-ink-3">Update photos, hours and details for free.</p>
              <a [href]="businessUrl" class="mt-3 inline-block font-semibold text-brand hover:underline">Manage your listing →</a>
              <hr class="my-4 border-line" />
              <button type="button" class="font-semibold text-ink-2 hover:text-brand" (click)="reporting.set(true)"><span class="inline-flex items-center gap-2"><app-icon name="flag" /> Report a problem</span></button>
            </div>
          </aside>
        </div>

        @if (similar().length) {
          <section class="apneyy-container mt-16" aria-labelledby="similar-h">
            <h2 id="similar-h" class="apneyy-h2" appReveal>You might also like</h2>
            <div class="mt-6">
              <app-carousel label="Similar businesses">
                @for (e of similar(); track e.id) { <app-business-card class="w-[min(18rem,78vw)]" [entry]="e" [compact]="true" /> }
              </app-carousel>
            </div>
          </section>
        }
      </article>

      <!-- Mobile action bar -->
      <div class="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
        @if (b.phone) { <a [href]="'tel:' + b.phone" class="apneyy-btn-primary flex-1"><app-icon name="phone" /> Call</a> }
        <a [href]="directionsUrl()" target="_blank" rel="noopener" class="apneyy-btn-outline flex-1"><app-icon name="navigation" /> Directions</a>
        <app-save-button [businessId]="b.id" [name]="b.name" />
      </div>
      <div class="h-16 md:hidden" aria-hidden="true"></div>

      @if (lightbox() !== null) {
        <app-lightbox [photos]="b.photos" [name]="b.name" [(index)]="lightboxIndex" (closed)="lightbox.set(null)" />
      }
      @if (reporting()) {
        <app-report-dialog [businessId]="b.id" [businessName]="b.name" [returnUrl]="'/business/' + b.slug" (closed)="reporting.set(false)" />
      }
    }
  `,
})
export class BusinessComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  private readonly cats = inject(CategoryService);
  private readonly seo = inject(SeoService);
  private readonly recent = inject(RecentService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly businessUrl = environment.businessPortalUrl;

  readonly lightbox = signal<number | null>(null);
  readonly lightboxIndex = signal(0);
  readonly reporting = signal(false);

  readonly loaded = toSignal(
    this.route.paramMap.pipe(
      map(p => p.get('slug') ?? ''),
      switchMap(slug =>
        this.data.business(slug).pipe(
          switchMap((d): Observable<Loaded> => {
            if (d) return of<Loaded>({ state: 'ok', business: d.business, similar: d.similar });
            // Approved after the last build? Try Firestore (browser only).
            if (!this.browser) return of<Loaded>({ state: 'missing' });
            return from(fetchLiveBusiness(slug)).pipe(
              map((b): Loaded => (b ? { state: 'ok', business: b, similar: [] } : { state: 'missing' })),
              catchError(() => of<Loaded>({ state: 'missing' }))
            );
          }),
          // Then follow the listing live, so an owner's edit or a take-down shows without a refresh.
          switchMap(l => (l.state === 'ok' && this.browser ? concat(of(l), this.follow(l)) : of(l))),
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
        )
      ),
      tap(l => this.onLoaded(l))
    ),
    { initialValue: { state: 'loading' } as Loaded }
  );

  readonly b = computed(() => {
    const l = this.loaded();
    return l.state === 'ok' ? l.business : null;
  });
  readonly similar = computed(() => {
    const l = this.loaded();
    return l.state === 'ok' ? l.similar : [];
  });

  readonly categoryLabel = computed(() => this.cats.label(this.b()?.category ?? ''));
  readonly categoryIcon = computed(() => this.cats.icon(this.b()?.category ?? ''));
  readonly isFood = computed(() => this.cats.group(this.b()?.category ?? '') === 'food');
  readonly open = computed(() => (this.b() ? isOpenNow(this.b()!.openingHours, this.b()!.address.timezone) : null));
  readonly status = computed(() => (this.b() ? statusLine(this.b()!.openingHours, this.b()!.address.timezone) : ''));
  readonly connections = computed(() => CONNECTIONS.filter(c => this.b()?.connections.includes(c.id)));
  readonly tzLabel = computed(() => (this.b()?.address.timezone ?? '').split('/').pop()?.replace(/_/g, ' ') ?? '');

  readonly hours = computed(() => {
    const b = this.b();
    if (!b?.openingHours) return [];
    const today = todayKey(b.address.timezone);
    return WEEKDAYS.map(d => {
      const h = b.openingHours![d.key];
      const open = !!h?.isOpen && h.ranges.length > 0;
      return { key: d.key, label: d.label, today: d.key === today, open, text: open ? formatRanges(h.ranges) : 'Closed' };
    });
  });

  readonly details = computed(() => {
    const b = this.b();
    if (!b) return [];
    const out: { label: string; values: string[] }[] = [];
    if (b.languages.length) out.push({ label: 'Languages spoken', values: b.languages });
    if (b.cuisines.length) out.push({ label: 'Cuisine', values: b.cuisines.map(c => labelFor(CUISINES, c)) });
    if (b.dietary.length) out.push({ label: 'Dietary', values: b.dietary.map(d => labelFor(DIETARY, d)) });
    if (b.services.length) out.push({ label: 'Services', values: b.services.map(s => labelFor(SERVICES, s)) });
    if (b.amenities.length) out.push({ label: 'Amenities', values: b.amenities.map(a => labelFor(AMENITIES, a)) });
    if (b.tags.length) out.push({ label: 'Known for', values: b.tags });
    return out;
  });

  readonly orderLinks = computed(() => {
    const b = this.b();
    if (!b) return [];
    return ORDERING_PLATFORMS.filter(p => b.orderingLinks[p.key]).map(p => ({ label: p.label, url: this.link(b.orderingLinks[p.key]!) }));
  });

  readonly socials = computed(() => {
    const s = this.b()?.socialLinks ?? {};
    return (
      [
        ['instagram', 'Instagram'],
        ['facebook', 'Facebook'],
        ['yelp', 'Yelp'],
        ['googleMaps', 'Google Maps'],
      ] as const
    )
      .filter(([k]) => s[k])
      .map(([k, label]) => ({ label, url: this.link(s[k]!) }));
  });

  readonly directionsUrl = computed(() => {
    const b = this.b();
    if (!b) return '#';
    const q = b.address.lat != null ? `${b.address.lat},${b.address.lng}` : `${b.name}, ${b.address.line1}, ${b.address.city}, ${b.address.state} ${b.address.postalCode}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  });

  /** OpenStreetMap embed: no API key, no cookies. Only when we have coordinates. */
  readonly mapUrl = computed<SafeResourceUrl | null>(() => {
    const a = this.b()?.address;
    if (!a || a.lat == null || a.lng == null) return null;
    const d = 0.006;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${a.lng - d},${a.lat - d / 1.6},${a.lng + d},${a.lat + d / 1.6}&layer=mapnik&marker=${a.lat},${a.lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  link(url: string): string {
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  openPhoto(i: number): void {
    this.lightboxIndex.set(i);
    this.lightbox.set(i);
  }

  async share(): Promise<void> {
    const b = this.b();
    if (!b) return;
    const url = this.seo.absolute(`/business/${b.slug}`);
    try {
      if (navigator.share) await navigator.share({ title: b.name, text: `${b.name} on Apneyy`, url });
      else {
        await navigator.clipboard.writeText(url);
        this.toast.show('Link copied', 'success');
      }
    } catch {
      /* cancelled */
    }
  }

  /** Live updates after the first copy. Keeps the published URL, which the build may have made unique. */
  private follow(l: Extract<Loaded, { state: 'ok' }>): Observable<Loaded> {
    return watchLiveBusiness(l.business.id).pipe(
      map((b): Loaded => (b ? { ...l, business: { ...b, slug: l.business.slug } } : { state: 'missing' }))
    );
  }

  private onLoaded(l: Loaded): void {
    if (l.state === 'missing') {
      this.seo.set({ title: 'Business not found', description: 'This business is not listed on Apneyy.', path: this.router.url.split('?')[0], noindex: true });
      return;
    }
    if (l.state !== 'ok') return;
    const b = l.business;
    const cat = this.cats.label(b.category);
    const where = `${b.address.city}, ${b.address.state}`;
    this.seo.set({
      title: `${b.name} · ${cat} in ${where}`,
      description: b.description ? `${b.name} in ${where}. ${b.description}` : `${b.name} is a ${cat.toLowerCase()} in ${where}. Hours, phone, directions and reviews on Apneyy.`,
      path: `/business/${b.slug}`,
      image: b.photos[0],
      type: 'business.business',
      jsonLd: [this.schema(b), this.seo.breadcrumbs([
        { name: 'Home', path: '/' },
        { name: cat, path: `/category/${b.category}` },
        { name: where, path: `/city/${b.cityKey}` },
        { name: b.name, path: `/business/${b.slug}` },
      ])],
    });
    if (this.browser) {
      this.recent.push({
        id: b.id, slug: b.slug, name: b.name, nameNative: b.nameNative, category: b.category, city: b.address.city, state: b.address.state,
        postalCode: b.address.postalCode, cityKey: b.cityKey, tags: b.tags.slice(0, 8), languages: b.languages, dietary: b.dietary, cuisines: b.cuisines,
        services: b.services, connections: b.connections, priceRange: b.priceRange, photo: b.photos[0] || '', logo: b.logo, summary: b.description.slice(0, 160),
        hours: b.openingHours, timezone: b.address.timezone, lat: b.address.lat, lng: b.address.lng, createdAt: b.createdAt,
      });
    }
  }

  private schema(b: PublicBusiness): object {
    const s: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': SCHEMA_TYPES[b.category] ?? 'LocalBusiness',
      '@id': this.seo.absolute(`/business/${b.slug}`),
      name: b.name,
      url: this.seo.absolute(`/business/${b.slug}`),
      description: b.description || undefined,
      telephone: b.phone || undefined,
      email: b.email || undefined,
      priceRange: b.priceRange || undefined,
      image: b.photos.length ? b.photos : undefined,
      logo: b.logo || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: [b.address.line1, b.address.line2].filter(Boolean).join(', '),
        addressLocality: b.address.city,
        addressRegion: b.address.state,
        postalCode: b.address.postalCode,
        addressCountry: 'US',
      },
      knowsLanguage: b.languages.length ? b.languages : undefined,
      paymentAccepted: b.paymentMethods.length ? b.paymentMethods.join(', ') : undefined,
      sameAs: Object.values(b.socialLinks).filter(Boolean).map(u => this.link(u!)),
    };
    if (b.address.lat != null) s['geo'] = { '@type': 'GeoCoordinates', latitude: b.address.lat, longitude: b.address.lng };
    if (b.website) s['sameAs'] = [this.link(b.website), ...(s['sameAs'] as string[])];
    if (this.isFoodCategory(b.category)) {
      if (b.cuisines.length) s['servesCuisine'] = b.cuisines.map(c => labelFor(CUISINES, c));
      if (b.menuUrl) s['hasMenu'] = this.link(b.menuUrl);
    }
    if (b.openingHours) {
      s['openingHoursSpecification'] = WEEKDAYS.flatMap(d => {
        const h = b.openingHours![d.key];
        return h?.isOpen ? h.ranges.map(r => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${d.schema}`, opens: r.open, closes: r.close })) : [];
      });
    }
    return s;
  }

  private isFoodCategory(id: string): boolean {
    return this.cats.group(id) === 'food';
  }

  protected readonly stateName = stateName;
}
