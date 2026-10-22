import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, input, signal, viewChild } from '@angular/core';

/**
 * Horizontal carousel: native scroll-snap (swipe on touch, shift+wheel or drag on desktop),
 * arrow buttons, a progress bar and optional autoplay that pauses on hover, focus or touch.
 * Items are projected: <app-carousel><div>…</div><div>…</div></app-carousel>
 */
@Component({
  selector: 'app-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block relative' },
  template: `
    <div class="group/carousel relative" (mouseenter)="paused = true" (mouseleave)="paused = false" (focusin)="paused = true" (focusout)="paused = false">
      <div
        #track
        [class]="'snap-track ' + itemClass()"
        role="region"
        [attr.aria-label]="label()"
        tabindex="0"
        (scroll)="onScroll()"
        (pointerdown)="dragStart($event)"
        (touchstart)="paused = true"
      >
        <ng-content />
      </div>
      <button type="button" (click)="go(-1)" [disabled]="atStart()" aria-label="Previous"
        class="absolute -left-3 top-[40%] z-[3] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-lift transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 md:grid">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button type="button" (click)="go(1)" [disabled]="atEnd()" aria-label="Next"
        class="absolute -right-3 top-[40%] z-[3] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-lift transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 md:grid">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
      @if (showProgress()) {
        <div class="mx-auto mt-4 h-1 w-24 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div class="h-full rounded-full bg-brand transition-[width] duration-300" [style.width.%]="progress()"></div>
        </div>
      }
    </div>
  `,
})
export class CarouselComponent implements OnDestroy {
  readonly label = input('Carousel');
  /** Classes applied to the track; children size themselves (e.g. w-72). */
  readonly itemClass = input('');
  readonly autoplay = input(0); // ms, 0 = off
  readonly showProgress = input(true);

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly zone = inject(NgZone);
  readonly atStart = signal(true);
  readonly atEnd = signal(false);
  readonly progress = signal(0);
  paused = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private reduced = false;

  constructor() {
    afterNextRender(() => {
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.onScroll();
      if (this.autoplay() > 0 && !this.reduced) {
        this.zone.runOutsideAngular(() => {
          this.timer = setInterval(() => {
            if (this.paused || document.hidden) return;
            const el = this.track().nativeElement;
            if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: 'smooth' });
            else this.go(1);
          }, this.autoplay());
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  go(dir: number): void {
    const el = this.track().nativeElement;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    const per = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: dir * step * per, behavior: this.reduced ? 'auto' : 'smooth' });
  }

  onScroll(): void {
    const el = this.track().nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.atStart.set(el.scrollLeft <= 4);
    this.atEnd.set(el.scrollLeft >= max - 4);
    const visible = el.scrollWidth ? (el.clientWidth / el.scrollWidth) * 100 : 100;
    this.progress.set(max > 0 ? visible + (100 - visible) * (el.scrollLeft / max) : 100);
  }

  /** Mouse drag-to-scroll on desktop. Touch uses native scrolling. */
  dragStart(e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = this.track().nativeElement;
    const startX = e.clientX;
    const startLeft = el.scrollLeft;
    let moved = false;
    const move = (m: PointerEvent) => {
      const dx = m.clientX - startX;
      if (Math.abs(dx) > 5 && !moved) {
        moved = true;
        el.style.scrollSnapType = 'none';
        el.style.scrollBehavior = 'auto';
      }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.style.scrollSnapType = '';
      el.style.scrollBehavior = '';
      if (moved) {
        // Swallow the click that ends a drag so cards don't open.
        const block = (c: Event) => {
          c.preventDefault();
          c.stopPropagation();
        };
        el.addEventListener('click', block, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', block, { capture: true }), 50);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
}
