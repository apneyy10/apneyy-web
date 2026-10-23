import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CategoryService } from '../core/data/category.service';
import { IconComponent } from './icon.component';
import { PhotoComponent } from './photo.component';

const GRADIENTS: Record<string, string> = {
  food: 'from-[#fff1e0] via-[#fde3d6] to-[#f9d2d0]',
  shopping: 'from-[#fdeaf1] via-[#fbe7da] to-[#fff3d6]',
  beauty: 'from-[#fde7ef] via-[#f8e3f6] to-[#ece4fb]',
  events: 'from-[#fff4d6] via-[#ffe6c7] to-[#fbd6c4]',
  services: 'from-[#e3f1fb] via-[#e4f5ef] to-[#f0f7dc]',
  community: 'from-[#fff0d9] via-[#fde9c8] to-[#fbe3b4]',
};

/**
 * A business's photo or, when it has none, a stock photo for its category (marked as such
 * so nobody mistakes it for the place itself).
 */
@Component({
  selector: 'app-cover',
  standalone: true,
  imports: [IconComponent, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block relative overflow-hidden' },
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="alt()" class="h-full w-full object-cover transition duration-700 group-hover:scale-105" [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" width="1600" height="900" />
    } @else {
      <app-photo class="absolute inset-0 bg-gradient-to-br {{ gradient() }}" [key]="image()" [sizes]="sizes()" [eager]="eager()" imgClass="transition duration-700 group-hover:scale-105">
        <div class="bg-motif absolute inset-0 opacity-70"></div>
        <div class="absolute inset-0 grid place-items-center text-brand/70">
          <app-icon [name]="icon()" [stroke]="1.5" class="transition duration-700 group-hover:scale-110" [style.font-size]="iconSize()" />
        </div>
      </app-photo>
      @if (image()) {
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent"></div>
        <span class="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          <app-icon [name]="icon()" /> {{ label() }}
        </span>
      }
    }
  `,
})
export class CoverComponent {
  readonly src = input('');
  readonly alt = input('');
  readonly category = input('');
  readonly eager = input(false);
  readonly iconSize = input('3.5rem');
  readonly sizes = input('(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 90vw');

  private readonly cats = inject(CategoryService);
  readonly icon = computed(() => this.cats.icon(this.category()));
  readonly label = computed(() => this.cats.label(this.category()));
  readonly image = computed(() => this.cats.image(this.category()));
  readonly gradient = computed(() => GRADIENTS[this.cats.group(this.category())] ?? GRADIENTS['services']);
}
