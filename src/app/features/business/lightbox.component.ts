import { ChangeDetectionStrategy, Component, HostListener, input, model, output } from '@angular/core';

/** Full-screen photo viewer with arrow keys and swipe. */
@Component({
  selector: 'app-lightbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[80] flex animate-fade-in flex-col bg-black/95 text-white" role="dialog" aria-modal="true" [attr.aria-label]="name() + ' photos'"
      (touchstart)="touchX = $event.touches[0].clientX" (touchend)="swipe($event.changedTouches[0].clientX)">
      <div class="flex items-center justify-between px-4 py-3">
        <p class="text-sm text-white/70">{{ index() + 1 }} / {{ photos().length }}</p>
        <button type="button" (click)="closed.emit()" class="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close" autofocus>✕</button>
      </div>
      <div class="relative flex flex-1 items-center justify-center px-4">
        @for (p of [photos()[index()]]; track p) {
          <img [src]="p" [alt]="name() + ' photo ' + (index() + 1)" class="max-h-[78vh] max-w-full animate-scale-in rounded-lg object-contain" />
        }
        @if (photos().length > 1) {
          <button type="button" (click)="step(-1)" class="absolute left-3 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Previous photo">‹</button>
          <button type="button" (click)="step(1)" class="absolute right-3 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Next photo">›</button>
        }
      </div>
      <div class="flex justify-center gap-2 overflow-x-auto p-4">
        @for (p of photos(); track p; let i = $index) {
          <button type="button" (click)="index.set(i)" class="h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition" [class]="i === index() ? 'ring-saffron' : 'ring-transparent opacity-60 hover:opacity-100'" [attr.aria-label]="'Photo ' + (i + 1)">
            <img [src]="p" alt="" class="h-full w-full object-cover" loading="lazy" />
          </button>
        }
      </div>
    </div>
  `,
})
export class LightboxComponent {
  readonly photos = input.required<string[]>();
  readonly name = input('');
  readonly index = model(0);
  readonly closed = output<void>();
  touchX = 0;

  step(d: number): void {
    const n = this.photos().length;
    this.index.set((this.index() + d + n) % n);
  }

  swipe(x: number): void {
    if (Math.abs(x - this.touchX) > 50) this.step(x < this.touchX ? 1 : -1);
  }

  @HostListener('document:keydown', ['$event'])
  key(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.closed.emit();
    if (e.key === 'ArrowRight') this.step(1);
    if (e.key === 'ArrowLeft') this.step(-1);
  }
}
