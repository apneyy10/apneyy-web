import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { SearchBoxComponent } from '../../shared/search-box.component';
import { PhotoComponent } from '../../shared/photo.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, SearchBoxComponent, PhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container max-w-2xl py-24 text-center">
      <app-photo class="mx-auto aspect-[3/2] w-48 animate-float rounded-3xl shadow-lift" key="cat/pooja_services" sizes="12rem" />
      <h1 class="mt-6 font-display text-4xl font-bold">This page wandered off</h1>
      <p class="mt-3 text-ink-2">The link may be old. Try a search instead.</p>
      <div class="mt-8 text-left"><app-search-box /></div>
      <a routerLink="/" class="apneyy-btn-ghost mt-6 text-brand">← Back home</a>
    </div>
  `,
})
export class NotFoundComponent {
  constructor() {
    inject(SeoService).set({ title: 'Page not found', description: 'This page could not be found on Apneyy.', path: '/404', noindex: true });
  }
}
