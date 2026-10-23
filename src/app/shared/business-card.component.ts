import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DirectoryEntry } from '../core/models/directory.model';
import { CategoryService } from '../core/data/category.service';
import { isOpenNow, statusLine } from '../core/util/hours.util';
import { DIETARY, labelFor } from '../core/constants/listing-options.constant';
import { CoverComponent } from './cover.component';
import { SaveButtonComponent } from './save-button.component';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [RouterLink, CoverComponent, SaveButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <article class="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <a [routerLink]="['/business', e().slug]" (click)="markTransition($event)" class="absolute inset-0 z-[1] rounded-3xl" [attr.aria-label]="e().name + ', ' + categoryLabel() + ' in ' + e().city"></a>
      <div class="relative">
        <app-cover class="aspect-[16/10]" [src]="e().photo" [alt]="e().name" [category]="e().category" [attr.data-vt]="e().slug" />
        <div class="absolute left-3 top-3 flex flex-wrap gap-1.5">
          @if (open() === true) {
            <span class="apneyy-badge bg-white/95 text-green-800 shadow-sm"><span class="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-green-600"></span>Open now</span>
          } @else if (open() === false && status()) {
            <span class="apneyy-badge bg-white/95 text-ink-2 shadow-sm">{{ status() }}</span>
          }
          @if (miles() != null) {
            <span class="apneyy-badge bg-ink/75 text-white">{{ milesLabel() }}</span>
          }
        </div>
        <div class="absolute right-3 top-3 z-[2]">
          <app-save-button [businessId]="e().id" [name]="e().name" />
        </div>
        @if (e().logo) {
          <img [src]="e().logo" alt="" class="absolute -bottom-5 left-4 h-12 w-12 rounded-xl border-2 border-white bg-white object-cover shadow-md" loading="lazy" width="48" height="48" />
        }
      </div>
      <div class="flex flex-1 flex-col gap-2.5 p-4" [class.pt-7]="e().logo">
        <div>
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-display text-lg font-bold leading-snug text-ink transition group-hover:text-brand">{{ e().name }}</h3>
            @if (e().priceRange) {
              <span class="mt-0.5 shrink-0 text-sm font-semibold text-ink-3" [attr.aria-label]="'Price ' + e().priceRange">{{ e().priceRange }}</span>
            }
          </div>
          @if (e().nameNative) {
            <p class="text-sm text-ink-3">{{ e().nameNative }}</p>
          }
          <p class="mt-0.5 text-sm text-ink-2"><app-icon class="mr-0.5 text-ink-3" [name]="categoryIcon()" /> {{ categoryLabel() }} <span class="text-ink-4">·</span> {{ e().city }}, {{ e().state }}</p>
        </div>
        @if (!compact() && e().summary) {
          <p class="line-clamp-2 text-sm leading-relaxed text-ink-3">{{ e().summary }}</p>
        }
        @if (chips().length) {
          <div class="mt-auto flex flex-wrap gap-1.5 pt-1">
            @for (chip of chips(); track chip) {
              <span class="rounded-full bg-sunk px-2.5 py-1 text-xs font-medium text-ink-2">{{ chip }}</span>
            }
          </div>
        }
        @if (e().languages.length) {
          <p class="flex items-center gap-1.5 text-xs text-ink-3">
            <svg class="h-3.5 w-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.05 9.5A18 18 0 0 1 6.4 9m6.1 9h7M11 21l5-10 5 10M12.75 5C11.8 10.8 8.1 15.6 3 18.1" /></svg>
            <span class="truncate">{{ e().languages.join(' · ') }}</span>
          </p>
        }
      </div>
    </article>
  `,
})
export class BusinessCardComponent {
  readonly e = input.required<DirectoryEntry>({ alias: 'entry' });
  readonly miles = input<number | null>(null);
  readonly compact = input(false);

  private readonly cats = inject(CategoryService);
  readonly categoryLabel = computed(() => this.cats.label(this.e().category));
  readonly categoryIcon = computed(() => this.cats.icon(this.e().category));
  readonly open = computed(() => isOpenNow(this.e().hours, this.e().timezone));
  readonly status = computed(() => statusLine(this.e().hours, this.e().timezone));
  readonly milesLabel = computed(() => {
    const m = this.miles();
    return m == null ? '' : m < 0.2 ? 'Nearby' : `${m < 10 ? m.toFixed(1) : Math.round(m)} mi`;
  });
  readonly chips = computed(() =>
    [...this.e().dietary.slice(0, 2).map(d => labelFor(DIETARY, d)), ...this.e().tags].slice(0, this.compact() ? 3 : 4)
  );

  /** Lets the photo morph into the business page header (View Transitions). */
  markTransition(ev: MouseEvent): void {
    const card = (ev.currentTarget as HTMLElement).parentElement;
    document.querySelectorAll<HTMLElement>('[style*="view-transition-name: business-hero"]').forEach(el => el.style.removeProperty('view-transition-name'));
    const cover = card?.querySelector<HTMLElement>('app-cover');
    cover?.style.setProperty('view-transition-name', 'business-hero');
  }
}
