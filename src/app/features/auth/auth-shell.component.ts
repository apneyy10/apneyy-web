import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';
import { PhotoComponent } from '../../shared/photo.component';

/** Split layout for sign-in pages: form on one side, a warm welcome panel on the other. */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [IconComponent, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div class="mx-auto w-full max-w-md animate-fade-up">
        <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">{{ heading() }}</h1>
        <p class="mt-2 text-ink-2">{{ sub() }}</p>
        <div class="mt-8"><ng-content /></div>
      </div>
      <div class="relative hidden h-[34rem] overflow-hidden rounded-[2rem] bg-brand-ink p-10 text-white lg:block">
        <app-photo class="absolute inset-0" key="hero/home" sizes="50vw" />
        <div class="absolute inset-0 bg-gradient-to-br from-brand/80 via-brand-ink/80 to-brand-ink/95"></div>
        <div class="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-saffron/40 blur-3xl"></div>
        <div class="relative flex h-full flex-col justify-between">
          <div class="flex gap-3">
            @for (p of photos; track p; let i = $index) {
              <app-photo class="h-16 w-16 animate-float rounded-2xl ring-2 ring-white/70 shadow-lg" [key]="p" sizes="64px" [style.animation-delay]="i * 0.4 + 's'" />
            }
          </div>
          <div>
            <p class="font-display text-4xl font-bold leading-tight">Apneyy log.<br />Apneyy jagah.</p>
            <ul class="mt-6 space-y-3 text-white/85">
              <li class="flex items-center gap-2.5"><app-icon name="heart" class="text-saffron" /> Save favourites and find them on any device</li>
              <li class="flex items-center gap-2.5"><app-icon name="star" class="text-saffron" /> Review places and help the community</li>
              <li class="flex items-center gap-2.5"><app-icon name="flag" class="text-saffron" /> Flag wrong info so everyone gets it right</li>
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
  readonly photos = ['cat/restaurant', 'cat/pooja_services', 'cat/temple', 'cat/jewelry_store', 'cat/bakery_cafe'];
}
