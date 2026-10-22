import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

/** Read-only star rating, or an input when [editable] is set. */
@Component({
  selector: 'app-stars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (editable()) {
      <div class="flex gap-1" role="radiogroup" aria-label="Your rating">
        @for (n of five; track n) {
          <button type="button" role="radio" [attr.aria-checked]="value() === n" [attr.aria-label]="n + (n === 1 ? ' star' : ' stars')"
            (click)="value.set(n)" class="transition hover:scale-110 active:scale-95">
            <svg [style.width.px]="size()" [style.height.px]="size()" viewBox="0 0 20 20" aria-hidden="true" [attr.fill]="n <= value() ? '#e09f0b' : '#e8e3da'"><path [attr.d]="star" /></svg>
          </button>
        }
      </div>
    } @else {
      <span class="inline-flex items-center gap-0.5" [attr.aria-label]="value().toFixed(1) + ' out of 5 stars'" role="img">
        @for (n of five; track n) {
          <svg [style.width.px]="size()" [style.height.px]="size()" viewBox="0 0 20 20" aria-hidden="true">
            <defs><linearGradient [attr.id]="gid + n"><stop [attr.offset]="fill(n)" stop-color="#e09f0b" /><stop [attr.offset]="fill(n)" stop-color="#e8e3da" /></linearGradient></defs>
            <path [attr.d]="star" [attr.fill]="'url(#' + gid + n + ')'" />
          </svg>
        }
      </span>
    }
  `,
})
export class StarsComponent {
  readonly value = model(0);
  readonly size = input(16);
  readonly editable = input(false);
  readonly five = [1, 2, 3, 4, 5];
  readonly gid = 'st' + Math.random().toString(36).slice(2, 8);
  readonly star = 'M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z';
  readonly rounded = computed(() => Math.round(this.value() * 2) / 2);

  fill(n: number): string {
    const v = this.value();
    return `${Math.max(0, Math.min(1, v - (n - 1))) * 100}%`;
  }
}
