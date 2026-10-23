import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IMAGES } from '../core/constants/image-manifest';

/**
 * A bundled stock photo (public/img/<key>-<width>.webp) with a responsive srcset and lazy
 * loading. Fills its host, so give the host a size or aspect ratio. When the key has no
 * image yet the projected content is shown instead.
 */
@Component({
  selector: 'app-photo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // No position class on the host: callers position it (absolute inset-0, an aspect ratio, a size).
  host: { class: 'block overflow-hidden' },
  template: `
    <div class="relative h-full w-full">
      @if (entry(); as img) {
        <img
          [src]="src()"
          [attr.srcset]="srcset()"
          [attr.sizes]="sizes()"
          [alt]="decorative() ? '' : img.alt"
          [attr.loading]="eager() ? 'eager' : 'lazy'"
          [attr.fetchpriority]="eager() ? 'high' : null"
          decoding="async"
          [attr.width]="img.widths[img.widths.length - 1]"
          [attr.height]="height()"
          class="absolute inset-0 h-full w-full object-cover {{ imgClass() }}"
        />
      } @else {
        <ng-content />
      }
    </div>
  `,
})
export class PhotoComponent {
  /** Image key, for example `cat/restaurant`. */
  readonly key = input<string | null>(null);
  readonly sizes = input('100vw');
  readonly eager = input(false);
  /** Most photos sit next to text that already says what they show. */
  readonly decorative = input(true);
  readonly imgClass = input('');

  readonly entry = computed(() => {
    const key = this.key();
    return key ? IMAGES[key] ?? null : null;
  });
  readonly src = computed(() => {
    const img = this.entry();
    return img ? `/img/${this.key()}-${img.widths[Math.min(1, img.widths.length - 1)]}.webp` : '';
  });
  readonly srcset = computed(() => {
    const img = this.entry();
    return img ? img.widths.map(w => `/img/${this.key()}-${w}.webp ${w}w`).join(', ') : null;
  });
  readonly height = computed(() => {
    const img = this.entry();
    return img ? Math.round((img.widths[img.widths.length - 1] * 2) / 3) : null;
  });
}

export function hasPhoto(key: string | null | undefined): boolean {
  return !!key && key in IMAGES;
}
