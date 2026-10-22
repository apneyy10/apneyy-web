import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
  template: `
    <div class="overflow-hidden rounded-3xl border border-line bg-white">
      <div class="skeleton aspect-[16/10] !rounded-none"></div>
      <div class="space-y-3 p-4">
        <div class="skeleton h-5 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <div class="skeleton h-4 w-full"></div>
        <div class="flex gap-2"><div class="skeleton h-6 w-16 !rounded-full"></div><div class="skeleton h-6 w-20 !rounded-full"></div></div>
      </div>
    </div>
  `,
})
export class CardSkeletonComponent {}
