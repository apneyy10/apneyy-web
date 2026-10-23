import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from './icons';

export { isIconName } from './icons';

const cache = new Map<string, SafeHtml>();

/**
 * Inline SVG icon from the bundled Lucide subset. Sized by the host's font size (1em)
 * unless a Tailwind size class is set on the host, and coloured with currentColor.
 * Unknown names (for example an old emoji saved in the category catalog) render the fallback.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block h-[1em] w-[1em] shrink-0 align-[-0.125em]', 'aria-hidden': 'true', '[innerHTML]': 'svg()' },
  template: '',
})
export class IconComponent {
  readonly name = input.required<string | null | undefined>();
  readonly fallback = input('store');
  readonly stroke = input(2);

  private readonly sanitizer = inject(DomSanitizer);

  readonly svg = computed(() => {
    const requested = this.name();
    const name = requested && ICONS[requested] ? requested : this.fallback();
    const key = `${name}:${this.stroke()}`;
    let html = cache.get(key);
    if (!html) {
      html = this.sanitizer.bypassSecurityTrustHtml(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="${this.stroke()}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ''}</svg>`
      );
      cache.set(key, html);
    }
    return html;
  });
}

