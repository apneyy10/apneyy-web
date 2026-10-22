import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Split layout for sign-in pages: form on one side, a warm welcome panel on the other. */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div class="mx-auto w-full max-w-md animate-fade-up">
        <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">{{ heading() }}</h1>
        <p class="mt-2 text-ink-2">{{ sub() }}</p>
        <div class="mt-8"><ng-content /></div>
      </div>
      <div class="relative hidden h-[34rem] overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-brand-ink p-10 text-white lg:block">
        <div class="bg-motif absolute inset-0 opacity-25"></div>
        <div class="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-saffron/40 blur-3xl"></div>
        <div class="relative flex h-full flex-col justify-between">
          <div class="flex gap-3 text-4xl" aria-hidden="true">
            @for (e of emojis; track e; let i = $index) { <span class="animate-float" [style.animation-delay]="i * 0.4 + 's'">{{ e }}</span> }
          </div>
          <div>
            <p class="font-display text-4xl font-bold leading-tight">Apneyy log.<br />Apneyy jagah.</p>
            <ul class="mt-6 space-y-3 text-white/85">
              <li>❤️ Save favourites and find them on any device</li>
              <li>⭐ Review places and help the community</li>
              <li>⚑ Flag wrong info so everyone gets it right</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuthShellComponent {
  readonly heading = input.required<string>();
  readonly sub = input('');
  readonly emojis = ['🍛', '🪔', '🛕', '💍', '☕'];
}
