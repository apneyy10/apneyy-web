import { Component, ChangeDetectionStrategy, inject, signal, effect, HostListener, NgZone } from '@angular/core';
import { TourService } from '../core/ui/tour.service';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

/** Spotlight overlay that walks through the elements named in TourService steps. */
@Component({
  selector: 'app-tour',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tour.current(); as step) {
      <div class="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        @if (box(); as b) {
          <div
            class="pointer-events-none absolute rounded-2xl ring-4 ring-saffron transition-all duration-300 ease-out"
            [style.top.px]="b.top - pad"
            [style.left.px]="b.left - pad"
            [style.width.px]="b.width + pad * 2"
            [style.height.px]="b.height + pad * 2"
            style="box-shadow: 0 0 0 9999px rgba(28, 26, 23, 0.62)"
          ></div>
        } @else {
          <div class="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"></div>
        }
        <div class="absolute inset-0" (click)="tour.end()"></div>

        <div
          class="absolute w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-2xl animate-fade-up"
          [style.top]="box() ? card().top + 'px' : '50%'"
          [style.left]="box() ? card().left + 'px' : '50%'"
          [style.transform]="box() ? null : 'translate(-50%, -50%)'"
        >
          <p class="text-xs font-bold uppercase tracking-[.14em] text-saffron-ink">Step {{ tour.index() + 1 }} of {{ tour.steps().length }}</p>
          <h2 id="tour-title" class="mt-1.5 font-display text-xl font-bold text-ink">{{ step.title }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-2">{{ step.body }}</p>
          <div class="mt-5 flex items-center justify-between">
            <button type="button" (click)="tour.end()" class="text-sm font-semibold text-ink-3 hover:text-ink">Skip tour</button>
            <div class="flex gap-2">
              @if (tour.index() > 0) {
                <button type="button" (click)="tour.back()" class="apneyy-btn-ghost !py-2">Back</button>
              }
              <button type="button" (click)="tour.next()" class="apneyy-btn-primary !py-2" autofocus>
                {{ tour.index() + 1 === tour.steps().length ? 'Finish' : 'Next' }}
              </button>
            </div>
          </div>
          <div class="mt-4 flex justify-center gap-1.5" aria-hidden="true">
            @for (s of tour.steps(); track $index) {
              <span class="h-1.5 rounded-full transition-all" [class.w-5]="$index === tour.index()" [class.bg-brand]="$index === tour.index()" [class.w-1.5]="$index !== tour.index()" [class.bg-line]="$index !== tour.index()"></span>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class TourComponent {
  readonly tour = inject(TourService);
  private readonly zone = inject(NgZone);
  readonly pad = PAD;
  readonly box = signal<Box | null>(null);
  readonly card = signal({ top: 0, left: 0 });

  constructor() {
    effect(
      () => {
        const step = this.tour.current();
        if (!step) return;
        this.zone.runOutsideAngular(() => setTimeout(() => this.zone.run(() => this.measure(true)), 0));
      },
      { allowSignalWrites: true }
    );
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.tour.active()) this.measure(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.tour.active()) return;
    if (e.key === 'Escape') this.tour.end();
    if (e.key === 'ArrowRight') this.tour.next();
    if (e.key === 'ArrowLeft') this.tour.back();
  }

  private measure(scroll: boolean): void {
    const target = this.tour.current()?.target;
    const el = target ? (document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null) : null;
    if (!el) {
      this.box.set(null);
      return;
    }
    if (scroll) {
      const r0 = el.getBoundingClientRect();
      if (r0.top < 80 || r0.bottom > window.innerHeight - 220) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      }
    }
    const r = el.getBoundingClientRect();
    this.box.set({ top: r.top, left: r.left, width: r.width, height: r.height });

    const cardW = Math.min(352, window.innerWidth - 32);
    const below = r.bottom + PAD + 16;
    const top = below + 230 < window.innerHeight ? below : Math.max(16, r.top - PAD - 16 - 230);
    const left = Math.min(Math.max(16, r.left + r.width / 2 - cardW / 2), window.innerWidth - cardW - 16);
    this.card.set({ top, left });
  }
}
