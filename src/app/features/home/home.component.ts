import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../core/data/data.service';
import { CategoryService } from '../../core/data/category.service';
import { SeoService } from '../../core/seo/seo.service';
import { RecentService } from '../../core/member/recent.service';
import { HOME_TOUR, TourService } from '../../core/ui/tour.service';
import { LANGUAGES } from '../../core/constants/languages.constant';
import { RevealDirective } from '../../core/ui/reveal.directive';
import { SearchBoxComponent } from '../../shared/search-box.component';
import { CarouselComponent } from '../../shared/carousel.component';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { environment } from '../../../environments/environment';

const ROTATING = ['biryani', 'a mehndi artist', 'a gurdwara', 'fresh paneer', 'a Bollywood DJ', 'masala chai', 'a saree shop', 'a pandit ji'];

const FAQ = [
  { q: 'What is Apneyy?', a: 'Apneyy (“our own”) is a free directory of businesses across the US with a South Asian connection: restaurants, grocers, salons, wedding pros, temples, gurdwaras, services and more.' },
  { q: 'Which businesses can be listed?', a: 'Any US business that is South Asian-owned, sells South Asian food or products, speaks South Asian languages, or serves the community. Every listing is checked by our team before it goes live.' },
  { q: 'Is Apneyy free?', a: 'Yes. Searching is free for everyone, and businesses can list themselves for free.' },
  { q: 'How do I find places that speak my language?', a: 'Use the language filter on the search page, or tap a language on the home page, to find businesses where staff speak Hindi, Punjabi, Urdu, Bengali, Gujarati, Tamil, Telugu, Nepali and more.' },
  { q: 'I own a business. How do I get listed?', a: 'Create a free business account, add your details and photos, and our team will review it, usually within two business days.' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective, SearchBoxComponent, CarouselComponent, BusinessCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="relative -mt-16 overflow-hidden pt-16">
      <div class="absolute inset-0 -z-10 bg-gradient-to-b from-[#fff3e4] via-[#fdf2ee] to-paper"></div>
      <div class="bg-motif absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]"></div>
      <div class="pointer-events-none absolute inset-0 -z-10 hidden lg:block" aria-hidden="true">
        @for (f of floaters; track f.icon) {
          <span class="absolute animate-float text-4xl opacity-90 drop-shadow" [style.left]="f.x" [style.top]="f.y" [style.animation-delay]="f.d">{{ f.icon }}</span>
        }
      </div>

      <div class="apneyy-container pb-16 pt-14 text-center sm:pt-20 lg:pb-24">
        <p class="apneyy-eyebrow animate-fade-up">Apneyy · “our own”</p>
        <h1 class="mx-auto mt-4 max-w-4xl animate-fade-up font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink [animation-delay:80ms] sm:text-6xl">
          Find
          <span class="relative inline-block min-w-[6ch] text-brand">
            @for (w of [word()]; track w) {
              <span class="inline-block animate-word-in">{{ w }}</span>
            }
            <svg class="absolute -bottom-2 left-0 h-3 w-full text-saffron" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9c40-7 120-9 196-3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" /></svg>
          </span>
          <br class="hidden sm:block" />
          that feels like home.
        </h1>
        <p class="mx-auto mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-ink-2 [animation-delay:160ms]">
          South Asian restaurants, grocers, salons, wedding pros, temples and everyday services across the US. Checked by our team, free for everyone.
        </p>
        <div class="mx-auto mt-9 max-w-3xl animate-fade-up text-left [animation-delay:240ms]" data-tour="search">
          <app-search-box />
        </div>
        <div class="mt-5 flex animate-fade-up flex-wrap justify-center gap-2 [animation-delay:320ms]">
          <span class="py-2 text-sm text-ink-3">Popular:</span>
          @for (p of popular; track p.label) {
            <a [routerLink]="'/search'" [queryParams]="p.params" class="apneyy-chip !bg-white/80 !py-1.5 backdrop-blur">{{ p.label }}</a>
          }
        </div>

        @if (home(); as h) {
          @if (h.total > 0) {
            <dl class="mx-auto mt-12 grid max-w-2xl animate-fade-up grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white/70 py-4 backdrop-blur [animation-delay:400ms]">
              <div><dt class="text-xs font-medium text-ink-3 sm:text-sm">Businesses</dt><dd class="font-display text-2xl font-bold text-ink sm:text-3xl">{{ count(h.total) }}</dd></div>
              <div><dt class="text-xs font-medium text-ink-3 sm:text-sm">Cities</dt><dd class="font-display text-2xl font-bold text-ink sm:text-3xl">{{ count(h.cityCount) }}</dd></div>
              <div><dt class="text-xs font-medium text-ink-3 sm:text-sm">Languages</dt><dd class="font-display text-2xl font-bold text-ink sm:text-3xl">{{ count(languageCount()) }}</dd></div>
            </dl>
          }
        }
      </div>
    </section>

    <!-- Categories -->
    <section class="apneyy-container" data-tour="categories" aria-labelledby="cat-h">
      <div class="flex flex-wrap items-end justify-between gap-4" appReveal>
        <div>
          <p class="apneyy-eyebrow">Browse</p>
          <h2 id="cat-h" class="apneyy-h2 mt-1">What are you looking for?</h2>
        </div>
        <div class="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Category groups">
          <button type="button" role="tab" class="apneyy-chip !py-1.5" [attr.aria-pressed]="group() === ''" [attr.aria-selected]="group() === ''" (click)="group.set('')">All</button>
          @for (g of cats.groups(); track g.id) {
            <button type="button" role="tab" class="apneyy-chip !py-1.5" [attr.aria-pressed]="group() === g.id" [attr.aria-selected]="group() === g.id" (click)="group.set(g.id)">{{ g.icon }} {{ g.label }}</button>
          }
        </div>
      </div>
      <div class="mt-6">
        <app-carousel label="Categories" [showProgress]="true">
          @for (c of visibleCats(); track c.id; let i = $index) {
            <a [routerLink]="['/category', c.id]" class="group w-36 sm:w-44">
              <div class="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-line bg-white shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:border-brand/30 group-hover:shadow-lift">
                <div class="bg-motif absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-60"></div>
                <span class="relative text-5xl transition duration-500 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">{{ c.icon }}</span>
              </div>
              <p class="mt-2.5 text-center text-sm font-semibold leading-snug text-ink group-hover:text-brand">{{ c.label }}</p>
              <p class="text-center text-xs text-ink-3">{{ countFor(c.id) }}</p>
            </a>
          }
        </app-carousel>
      </div>
    </section>

    @if (home(); as h) {
      <!-- New on Apneyy -->
      @if (h.newest.length) {
        <section class="apneyy-container mt-20" aria-labelledby="new-h">
          <div class="flex items-end justify-between gap-4" appReveal>
            <div>
              <p class="apneyy-eyebrow">Fresh picks</p>
              <h2 id="new-h" class="apneyy-h2 mt-1">New on Apneyy</h2>
            </div>
            <a routerLink="/search" [queryParams]="{ sort: 'newest' }" class="apneyy-btn-ghost text-brand">See all →</a>
          </div>
          <div class="mt-6">
            <app-carousel label="New businesses" [autoplay]="5000">
              @for (e of h.newest; track e.id) {
                <app-business-card class="w-[min(20rem,82vw)]" [entry]="e" />
              }
            </app-carousel>
          </div>
        </section>
      }

      <!-- Recently viewed (this browser only) -->
      @if (recent.items().length) {
        <section class="apneyy-container mt-20" aria-labelledby="recent-h">
          <h2 id="recent-h" class="apneyy-h2">Pick up where you left off</h2>
          <div class="mt-6">
            <app-carousel label="Recently viewed">
              @for (e of recent.items(); track e.id) {
                <app-business-card class="w-[min(17rem,75vw)]" [entry]="e" [compact]="true" />
              }
            </app-carousel>
          </div>
        </section>
      }

      <!-- Cities -->
      @if (h.cities.length) {
        <section class="apneyy-container mt-20" aria-labelledby="city-h">
          <div class="flex items-end justify-between gap-4" appReveal>
            <div>
              <p class="apneyy-eyebrow">Near you</p>
              <h2 id="city-h" class="apneyy-h2 mt-1">Explore by city</h2>
            </div>
            <a routerLink="/cities" class="apneyy-btn-ghost text-brand">All cities →</a>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            @for (c of h.cities.slice(0, 8); track c.key; let i = $index) {
              <a [routerLink]="'/city/' + c.key" [appReveal]="i" class="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-saffron-light to-brand-light transition duration-500 group-hover:scale-150"></div>
                <p class="relative text-xs font-bold uppercase tracking-wider text-ink-3">{{ c.state }}</p>
                <p class="relative mt-1 font-display text-xl font-bold text-ink group-hover:text-brand">{{ c.city }}</p>
                <p class="relative mt-1 text-sm text-ink-3">{{ c.count }} {{ c.count === 1 ? 'business' : 'businesses' }}</p>
              </a>
            }
          </div>
        </section>
      }
    }

    <!-- Languages -->
    <section class="mt-20 overflow-hidden bg-gradient-to-r from-brand to-brand-ink py-14 text-white" aria-labelledby="lang-h" data-tour="languages">
      <div class="apneyy-container">
        <div class="grid items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div appReveal>
            <p class="text-xs font-bold uppercase tracking-[.16em] text-saffron">Speak your language</p>
            <h2 id="lang-h" class="mt-2 font-display text-3xl font-bold sm:text-4xl">Aap ki zubaan, aap ke log.</h2>
            <p class="mt-3 max-w-md text-white/80">Find places where the staff speak your language, from Hindi and Punjabi to Bengali, Tamil, Urdu, Nepali and Sinhala.</p>
          </div>
          <div class="flex flex-wrap gap-2.5">
            @for (l of languages; track l.code; let i = $index) {
              <a [routerLink]="'/search'" [queryParams]="{ lang: l.name }" [appReveal]="i % 6"
                class="group rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-brand">
                <span class="block font-display text-lg font-bold leading-tight">{{ l.nativeName }}</span>
                <span class="block text-xs text-white/70 group-hover:text-brand/70">{{ l.name }}{{ langCount(l.name) }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Dietary -->
    <section class="apneyy-container mt-20" aria-labelledby="diet-h">
      <div class="text-center" appReveal>
        <p class="apneyy-eyebrow">Eat the way you eat</p>
        <h2 id="diet-h" class="apneyy-h2 mt-1">Food that respects your plate</h2>
      </div>
      <div class="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        @for (d of diets; track d.id; let i = $index) {
          <a [routerLink]="'/search'" [queryParams]="{ diet: d.id }" [appReveal]="i" class="group rounded-3xl border border-line bg-white p-6 text-center transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
            <span class="inline-block text-4xl transition duration-500 group-hover:scale-125" aria-hidden="true">{{ d.icon }}</span>
            <p class="mt-3 font-display text-lg font-bold text-ink">{{ d.label }}</p>
            <p class="mt-1 text-sm text-ink-3">{{ d.hint }}</p>
          </a>
        }
      </div>
    </section>

    <!-- How it works -->
    <section class="apneyy-container mt-20" aria-labelledby="how-h">
      <div class="rounded-[2rem] border border-line bg-white p-8 shadow-card sm:p-12">
        <h2 id="how-h" class="apneyy-h2 text-center" appReveal>Why people use Apneyy</h2>
        <div class="mt-10 grid gap-8 md:grid-cols-3">
          @for (s of why; track s.title; let i = $index) {
            <div class="text-center" [appReveal]="i">
              <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-light text-2xl" aria-hidden="true">{{ s.icon }}</span>
              <h3 class="mt-4 font-display text-xl font-bold">{{ s.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-3">{{ s.body }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Business CTA -->
    <section class="apneyy-container mt-20">
      <div class="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white sm:p-12" appReveal>
        <div class="bg-motif absolute inset-0 opacity-20"></div>
        <div class="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-saffron/30 blur-3xl"></div>
        <div class="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p class="text-xs font-bold uppercase tracking-[.16em] text-saffron">For business owners</p>
            <h2 class="mt-2 font-display text-3xl font-bold sm:text-4xl">Your community is already looking for you.</h2>
            <p class="mt-3 max-w-xl text-white/75">List your business on Apneyy for free. Add photos, hours and specialties, and get found by customers who want exactly what you offer.</p>
          </div>
          <a [href]="businessUrl" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-ink transition hover:scale-[1.03] hover:bg-saffron-light">List your business free →</a>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="apneyy-container mt-20 max-w-3xl" aria-labelledby="faq-h">
      <h2 id="faq-h" class="apneyy-h2 text-center" appReveal>Questions, answered</h2>
      <div class="mt-8 divide-y divide-line rounded-3xl border border-line bg-white">
        @for (f of faq; track f.q) {
          <details class="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
              {{ f.q }}
              <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sunk transition duration-300 group-open:rotate-45 group-open:bg-brand group-open:text-white" aria-hidden="true">+</span>
            </summary>
            <p class="mt-3 animate-fade-in text-sm leading-relaxed text-ink-2">{{ f.a }}</p>
          </details>
        }
      </div>
    </section>
  `,
})
export class HomeComponent implements OnDestroy {
  private readonly data = inject(DataService);
  readonly cats = inject(CategoryService);
  private readonly seo = inject(SeoService);
  readonly recent = inject(RecentService);
  private readonly tour = inject(TourService);
  private readonly zone = inject(NgZone);

  readonly home = toSignal(this.data.home(), { initialValue: null });
  readonly group = signal('');
  readonly word = signal(ROTATING[0]);
  readonly counting = signal(1);
  readonly languages = LANGUAGES.filter(l => l.code !== 'other' && l.code !== 'en');
  readonly businessUrl = environment.businessPortalUrl;
  readonly faq = FAQ;
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly floaters = [
    { icon: '🍛', x: '7%', y: '22%', d: '0s' },
    { icon: '🪔', x: '88%', y: '18%', d: '1.2s' },
    { icon: '💍', x: '12%', y: '64%', d: '2.1s' },
    { icon: '☕', x: '84%', y: '60%', d: '.6s' },
    { icon: '🛕', x: '93%', y: '38%', d: '1.8s' },
    { icon: '🥘', x: '3%', y: '43%', d: '2.6s' },
  ];

  readonly popular = [
    { label: '🍛 Biryani', params: { q: 'biryani' } },
    { label: '🥞 Dosa', params: { q: 'dosa' } },
    { label: '☪️ Halal', params: { diet: 'halal' } },
    { label: '🙏 Jain food', params: { diet: 'jain' } },
    { label: '💅 Threading', params: { q: 'threading' } },
    { label: '🍬 Mithai', params: { cat: 'sweets_mithai' } },
    { label: '🛒 Grocery', params: { cat: 'grocery_store' } },
  ];

  readonly diets = [
    { id: 'pure_veg', label: 'Pure veg', icon: '🥬', hint: 'No meat, no eggs' },
    { id: 'jain', label: 'Jain', icon: '🙏', hint: 'Jain-friendly menus' },
    { id: 'halal', label: 'Halal', icon: '☪️', hint: 'Certified or halal meat' },
    { id: 'vegan', label: 'Vegan', icon: '🌱', hint: 'Plant-based options' },
  ];

  readonly why = [
    { icon: '✅', title: 'Checked by real people', body: 'Our team calls and verifies businesses before they go live, so you’re not chasing closed shops or wrong numbers.' },
    { icon: '🗣️', title: 'Your language, your food', body: 'Filter by the languages staff speak and by Jain, halal, pure veg and more. Things big apps don’t ask.' },
    { icon: '⚡', title: 'Fast, free, no clutter', body: 'No sign-up needed to search. Save favourites in one tap and see who’s open right now, in their own time zone.' },
  ];

  readonly visibleCats = computed(() => {
    const g = this.group();
    const counts = this.home()?.categoryCounts ?? {};
    return this.cats
      .all()
      .filter(c => !g || c.group === g)
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  });

  readonly languageCount = computed(() => Object.keys(this.home()?.languageCounts ?? {}).filter(l => l !== 'English' && l !== 'Other').length);

  constructor() {
    this.seo.set({
      title: 'Apneyy · South Asian restaurants, shops & services near you',
      description:
        'Discover South Asian restaurants, grocery stores, salons, wedding vendors, temples, gurdwaras and services across the US. Verified listings, searchable by language, diet and city.',
      path: '/',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Apneyy',
          url: this.seo.siteUrl + '/',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: this.seo.siteUrl + '/search?q={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Apneyy',
          url: this.seo.siteUrl + '/',
          logo: this.seo.siteUrl + '/icon-512.png',
          email: environment.supportEmail,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        },
      ],
    });

    afterNextRender(() => {
      this.recent.load();
      this.tour.startOnce('home', HOME_TOUR, 1400);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Count the stats up from zero once.
      this.counting.set(0);
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / 1200);
        this.counting.set(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      this.zone.runOutsideAngular(() => {
        let i = 0;
        this.timer = setInterval(() => this.zone.run(() => this.word.set(ROTATING[++i % ROTATING.length])), 2400);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  count(n: number): string {
    return Math.round(n * this.counting()).toLocaleString('en-US');
  }

  countFor(id: string): string {
    const n = this.home()?.categoryCounts[id] ?? 0;
    return n ? `${n} ${n === 1 ? 'place' : 'places'}` : 'Coming soon';
  }

  langCount(name: string): string {
    const n = this.home()?.languageCounts[name] ?? 0;
    return n ? ` · ${n}` : '';
  }
}
