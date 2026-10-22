import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/ui/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-2xl" role="status">
          <span aria-hidden="true">{{ t.kind === 'success' ? '❤️' : t.kind === 'error' ? '⚠️' : 'ℹ️' }}</span>
          <span class="flex-1">{{ t.text }}</span>
          @if (t.action) {
            <a [routerLink]="t.action.link" (click)="toasts.dismiss(t.id)" class="font-semibold text-saffron hover:underline">{{ t.action.label }}</a>
          }
          <button type="button" (click)="toasts.dismiss(t.id)" class="text-white/60 hover:text-white" aria-label="Dismiss">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);
}
