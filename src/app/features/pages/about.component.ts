import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { RevealDirective } from '../../core/ui/reveal.directive';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container max-w-3xl py-14">
      <p class="apneyy-eyebrow">About</p>
      <h1 class="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Apneyy means “our own”.</h1>
      <div class="mt-8 space-y-5 text-lg leading-relaxed text-ink-2">
        <p appReveal>Moving to a new city, the first things you look for are the familiar ones: a plate of food that tastes like home, a store that stocks the right atta, someone who can thread your eyebrows in five minutes, a temple or gurdwara for Sunday.</p>
        <p appReveal>Apneyy brings those places together. Restaurants and sweet shops, grocers, tailors, jewelers, salons, mehndi artists, wedding pros, travel agents, temples, gurdwaras and community groups, across the US, all with a South Asian connection.</p>
        <p appReveal>Every listing is reviewed by our team before it goes live, and business owners keep their own details up to date. Searching is free, and so is listing a business.</p>
      </div>
      <div class="mt-10 flex flex-wrap gap-3" appReveal>
        <a routerLink="/search" class="apneyy-btn-primary">Start exploring</a>
        <a [href]="businessUrl" class="apneyy-btn-outline">List your business</a>
        <a [href]="'mailto:' + email" class="apneyy-btn-ghost">{{ email }}</a>
      </div>
    </div>
  `,
})
export class AboutComponent {
  readonly businessUrl = environment.businessPortalUrl;
  readonly email = environment.supportEmail;

  constructor() {
    inject(SeoService).set({
      title: 'About Apneyy',
      description: 'Apneyy is a free directory of South Asian businesses and community spaces across the US, checked by our team.',
      path: '/about',
    });
  }
}
