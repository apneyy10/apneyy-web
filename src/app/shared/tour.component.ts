import { Component, ChangeDetectionStrategy, ElementRef, inject, signal, effect, HostListener, NgZone, ViewChild } from '@angular/core';
import { TourService, findTourTarget } from '../core/ui/tour.service';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
/** Fallback card height before the card has rendered. */
const CARD_H = 240;

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

        <!-- Centered steps use a flex wrapper: animate-fade-up animates transform, so a translate() on the card would be overridden. -->
        <div
          class="pointer-events-none absolute"
          [class]="box() ? '' : 'inset-0 flex items-center justify-center p-4'"
          [style.top.px]="box() ? card().top : null"
          [style.left.px]="box() ? card().left : null"
        >
        <div #cardEl class="pointer-events-auto max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl animate-fade-up">
          <p class="text-xs font-bold uppercase tracking-[.14em] text-saffron-ink">Step {{ tour.index() + 1 }} of {{ tour.steps().length }}</p>
          <h2 id="tour-title" class="mt-1.5 font-display text-xl font-bold text-ink">{{ step.title }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-2">{{ step.body }}</p>
          <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
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
  @ViewChild('cardEl') private cardEl?: ElementRef<HTMLElement>;

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
    const el = target ? findTourTarget(target) : null;
    if (!el) {
      this.box.set(null);
      return;
    }
    if (scroll) {
      const r0 = el.getBoundingClientRect();
      if (r0.top < 80 || r0.bottom > window.innerHeight - 220) {
        // Tall targets on short screens: put the top under the header so the card fits below.
        const tall = r0.height + CARD_H + 120 > window.innerHeight;
        if (tall) window.scrollBy({ top: r0.top - 80, behavior: 'instant' as ScrollBehavior });
        else el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      }
    }
    const r = el.getBoundingClientRect();
    // Keep the spotlight ring inside the viewport for full-width targets.
    const vw = document.documentElement.clientWidth;
    const left0 = Math.max(r.left, PAD);
    const right0 = Math.min(r.right, vw - PAD);
    this.box.set({ top: r.top, left: left0, width: Math.max(0, right0 - left0), height: r.height });

    const cardW = Math.min(352, vw - 32);
    const cardH = this.cardEl?.nativeElement.offsetHeight || CARD_H;
    const below = r.bottom + PAD + 16;
    const above = r.top - PAD - 16 - cardH;
    // Below, else above, else pinned to the bottom of the screen over the target.
    const top = below + cardH < window.innerHeight ? below : above >= 16 ? above : Math.max(16, window.innerHeight - cardH - 16);
    const left = Math.min(Math.max(16, r.left + r.width / 2 - cardW / 2), vw - cardW - 16);
    this.card.set({ top, left });
  }
}
