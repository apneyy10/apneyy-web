import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../core/data/category.service';
import { DataService } from '../core/data/data.service';
import { CitySummary, DirectoryEntry } from '../core/models/directory.model';
import { fold } from '../core/util/text.util';
import { IconComponent } from './icon.component';
import { PhotoComponent } from './photo.component';

interface Suggestion {
  kind: 'category' | 'business' | 'city';
  label: string;
  sub: string;
  icon: string;
  image?: string | null;
  run: () => void;
}

/**
 * "What" + "Where" search with instant suggestions for categories, businesses and
 * cities. The directory loads the first time someone focuses the box.
 */
@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [FormsModule, IconComponent, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Raise the whole box while suggestions are open so they sit above later siblings
  // that form their own stacking contexts (animated or blurred sections).
  host: { class: 'block relative', '[class.z-50]': 'showList()' },
  template: `
    <form (submit)="submit($event)" role="search" class="relative flex flex-col gap-2 rounded-[1.4rem] bg-white p-2 shadow-lift ring-1 ring-line sm:flex-row sm:items-center sm:gap-0"
      [class.!rounded-2xl]="size() === 'sm'" [class.!p-1.5]="size() === 'sm'" [class.!shadow-none]="size() === 'sm'">
      <label class="flex flex-1 items-center gap-2.5 px-3" [class.py-2]="size() === 'lg'">
        <svg class="h-5 w-5 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" /></svg>
        <span class="sr-only">What are you looking for?</span>
        <input
          [ngModel]="q()" (ngModelChange)="q.set($event)"
          name="q"
          (focus)="focus('q')"
          (input)="open.set(true); active.set(-1)"
          (keydown)="key($event)"
          [placeholder]="placeholder()"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          [attr.aria-expanded]="showList()"
          aria-controls="search-suggestions"
          class="w-full bg-transparent py-2 text-[15px] text-ink placeholder-ink-4 outline-none"
          [class.text-base]="size() === 'lg'"
        />
      </label>
      <div class="hidden h-8 w-px bg-line sm:block" aria-hidden="true"></div>
      <label class="flex items-center gap-2.5 border-t border-line px-3 sm:w-56 sm:border-0" [class.py-2]="size() === 'lg'">
        <svg class="h-5 w-5 shrink-0 text-saffron-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
        <span class="sr-only">Where?</span>
        <input [ngModel]="where()" (ngModelChange)="where.set($event)" name="where" (focus)="focus('where')" (input)="open.set(true); active.set(-1)" (keydown)="key($event)" placeholder="City, state or ZIP" autocomplete="off"
          class="w-full bg-transparent py-2 text-[15px] text-ink placeholder-ink-4 outline-none" />
      </label>
      <button type="submit" class="apneyy-btn-primary shrink-0 !rounded-2xl" [class.!px-7]="size() === 'lg'" [class.!py-3.5]="size() === 'lg'">
        <span>Search</span>
      </button>
    </form>

    @if (showList()) {
      <ul id="search-suggestions" role="listbox" class="absolute inset-x-0 top-full z-40 mt-2 max-h-[22rem] animate-scale-in overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-2xl">
        @for (s of suggestions(); track s.kind + s.label + s.sub; let i = $index) {
          <li role="option" [attr.aria-selected]="i === active()">
            <button type="button" (mousedown)="$event.preventDefault()" (click)="s.run()" (mouseenter)="active.set(i)"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition" [class.bg-sunk]="i === active()">
              <span class="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-light text-base text-brand">
                @if (s.image) {
                  <app-photo class="absolute inset-0" [key]="s.image" sizes="36px" />
                } @else {
                  <app-icon [name]="s.icon" />
                }
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold text-ink">{{ s.label }}</span>
                <span class="block truncate text-xs text-ink-3">{{ s.sub }}</span>
              </span>
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class SearchBoxComponent {
  readonly size = input<'lg' | 'sm'>('lg');
  readonly placeholder = input('Biryani, mehndi, gurdwara, grocery…');
  readonly initialQ = input('');
  readonly initialWhere = input('');

  private readonly router = inject(Router);
  private readonly cats = inject(CategoryService);
  private readonly data = inject(DataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly q = signal('');
  readonly where = signal('');
  readonly field = signal<'q' | 'where'>('q');
  readonly open = signal(false);
  readonly active = signal(-1);
  private readonly entries = signal<DirectoryEntry[]>([]);
  private readonly cities = signal<CitySummary[]>([]);
  private loaded = false;

  ngOnInit(): void {
    this.q.set(this.initialQ());
    this.where.set(this.initialWhere());
  }

  readonly suggestions = computed<Suggestion[]>(() => {
    const out: Suggestion[] = [];
    if (this.field() === 'where') {
      const w = fold(this.where()).trim();
      for (const c of this.cities()) {
        if (w && !fold(`${c.city}, ${c.state}`).includes(w) && !c.state.toLowerCase().startsWith(w)) continue;
        out.push({ kind: 'city', label: `${c.city}, ${c.state}`, sub: `${c.count} ${c.count === 1 ? 'business' : 'businesses'}`, icon: 'map-pin', run: () => this.pickWhere(`${c.city}, ${c.state}`) });
        if (out.length >= 8) break;
      }
      return out;
    }
    const q = fold(this.q()).trim();
    if (!q) {
      return this.cats
        .all()
        .slice(0, 6)
        .map(c => ({ kind: 'category' as const, label: c.label, sub: 'Category', icon: c.icon || 'store', image: this.cats.image(c.id), run: () => this.goCategory(c.id) }));
    }
    for (const c of this.cats.all()) {
      if (fold(c.label).includes(q) || c.suggestedTags.some(t => fold(t).includes(q))) {
        out.push({ kind: 'category', label: c.label, sub: 'Category', icon: c.icon || 'store', image: this.cats.image(c.id), run: () => this.goCategory(c.id) });
      }
      if (out.length >= 3) break;
    }
    let n = 0;
    for (const e of this.entries()) {
      if (fold(e.name).includes(q) || fold(e.nameNative).includes(q)) {
        out.push({ kind: 'business', label: e.name, sub: `${this.cats.label(e.category)} · ${e.city}, ${e.state}`, icon: this.cats.icon(e.category), run: () => this.goBusiness(e.slug) });
        if (++n >= 5) break;
      }
    }
    return out;
  });

  readonly showList = computed(() => this.open() && this.suggestions().length > 0);

  focus(f: 'q' | 'where'): void {
    this.field.set(f);
    this.open.set(true);
    this.active.set(-1);
    if (!this.loaded) {
      this.loaded = true;
      this.data.directory().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(d => this.entries.set(d?.entries ?? []));
      this.data.cities().subscribe(c => this.cities.set(c?.cities ?? []));
    }
  }

  key(e: KeyboardEvent): void {
    const list = this.suggestions();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.open.set(true);
      this.active.update(i => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active.update(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && this.active() >= 0 && list[this.active()]) {
      e.preventDefault();
      list[this.active()].run();
    } else if (e.key === 'Escape') {
      this.open.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDoc(e: Event): void {
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  submit(e: Event): void {
    e.preventDefault();
    this.open.set(false);
    const queryParams: Record<string, string> = {};
    if (this.q().trim()) queryParams['q'] = this.q().trim();
    if (this.where().trim()) queryParams['where'] = this.where().trim();
    void this.router.navigate(['/search'], { queryParams });
  }

  private pickWhere(w: string): void {
    this.where.set(w);
    this.open.set(false);
  }

  private goCategory(id: string): void {
    this.open.set(false);
    const queryParams: Record<string, string> = { cat: id };
    if (this.where().trim()) queryParams['where'] = this.where().trim();
    void this.router.navigate(['/search'], { queryParams });
  }

  private goBusiness(slug: string): void {
    this.open.set(false);
    void this.router.navigate(['/business', slug]);
  }
}
