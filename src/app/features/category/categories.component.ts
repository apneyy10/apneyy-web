import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../core/data/category.service';
import { DataService } from '../../core/data/data.service';
import { SeoService } from '../../core/seo/seo.service';
import { RevealDirective } from '../../core/ui/reveal.directive';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container py-12">
      <p class="apneyy-eyebrow">Browse</p>
      <h1 class="mt-1 font-display text-4xl font-bold tracking-tight">All categories</h1>
      <p class="mt-2 max-w-2xl text-ink-2">From biryani to bridal mehndi, everything our community looks for, in one place.</p>
      <div class="mt-10 space-y-12">
        @for (g of cats.groups(); track g.id) {
          <section [attr.aria-labelledby]="'g-' + g.id">
            <h2 [id]="'g-' + g.id" class="flex items-center gap-2 font-display text-2xl font-bold" appReveal><span aria-hidden="true">{{ g.icon }}</span> {{ g.label }}</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              @for (c of g.categories; track c.id; let i = $index) {
                <a [routerLink]="['/category', c.id]" [appReveal]="i % 4" class="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sunk text-2xl transition group-hover:scale-110 group-hover:bg-brand-light" aria-hidden="true">{{ c.icon }}</span>
                  <span class="min-w-0">
                    <span class="block font-semibold leading-snug text-ink group-hover:text-brand">{{ c.label }}</span>
                    <span class="text-xs text-ink-3">{{ countLabel(c.id) }}</span>
                  </span>
                </a>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
})
export class CategoriesComponent {
  readonly cats = inject(CategoryService);
  private readonly home = toSignal(inject(DataService).home(), { initialValue: null });

  constructor() {
    inject(SeoService).set({
      title: 'All categories',
      description: 'Browse every kind of South Asian business on Apneyy: restaurants, sweets, grocery, clothing, jewelry, salons, mehndi, wedding vendors, temples, gurdwaras and services.',
      path: '/categories',
    });
  }

  countLabel(id: string): string {
    const n = this.home()?.categoryCounts[id] ?? 0;
    return n ? `${n} ${n === 1 ? 'place' : 'places'}` : 'Coming soon';
  }
}
