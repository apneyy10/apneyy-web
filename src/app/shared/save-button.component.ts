import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { SavedService } from '../core/member/saved.service';

/** Heart toggle with a little pop and burst when saving. */
@Component({
  selector: 'app-save-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle($event)"
      [attr.aria-pressed]="saved()"
      [attr.aria-label]="(saved() ? 'Remove ' : 'Save ') + name()"
      [title]="saved() ? 'Saved' : 'Save'"
      class="relative grid place-items-center rounded-full transition active:scale-90"
      [class]="variant() === 'solid' ? 'h-10 w-10 bg-white/95 shadow-md backdrop-blur hover:bg-white' : 'h-11 gap-2 border border-line bg-white px-4 hover:bg-sunk !flex items-center'"
    >
      <svg class="h-5 w-5 transition-colors" [class.animate-pop]="popping()" viewBox="0 0 24 24" aria-hidden="true"
        [attr.fill]="saved() ? '#a3242f' : 'none'" [attr.stroke]="saved() ? '#a3242f' : '#1c1a17'" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
      @if (variant() === 'outline') {
        <span class="text-sm font-semibold">{{ saved() ? 'Saved' : 'Save' }}</span>
      }
      @if (popping()) {
        @for (p of particles; track $index) {
          <span class="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 animate-burst rounded-full"
            [style.background]="p.c" [style.--bx]="p.x" [style.--by]="p.y"></span>
        }
      }
    </button>
  `,
})
export class SaveButtonComponent {
  readonly businessId = input.required<string>();
  readonly name = input('this business');
  readonly variant = input<'solid' | 'outline'>('solid');

  private readonly savedSvc = inject(SavedService);
  readonly saved = computed(() => this.savedSvc.ids().includes(this.businessId()));
  readonly popping = signal(false);

  readonly particles = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: `${Math.round(Math.cos(a) * 22)}px`, y: `${Math.round(Math.sin(a) * 22)}px`, c: i % 2 ? '#e8871e' : '#a3242f' };
  });

  async toggle(e: Event): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = await this.savedSvc.toggle(this.businessId(), this.name());
    if (nowSaved) {
      this.popping.set(true);
      setTimeout(() => this.popping.set(false), 650);
    }
  }
}
