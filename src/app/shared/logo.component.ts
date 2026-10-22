import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#a3242f" />
        <path d="M32 12c2 7 7 11 14 12-7 1-12 5-14 12-2-7-7-11-14-12 7-1 12-5 14-12Z" fill="#e8871e" />
        <text x="32" y="55" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="22" fill="#fff">a</text>
      </svg>
      <span class="font-display text-[22px] font-bold leading-none tracking-tight" [class.text-white]="inverse()" [class.text-brand]="!inverse()">apneyy</span>
    </span>
  `,
})
export class LogoComponent {
  readonly size = input(30);
  readonly inverse = input(false);
}
