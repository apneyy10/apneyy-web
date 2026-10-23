import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from './logo.component';
import { CategoryService } from '../core/data/category.service';
import { HOME_TOUR, SEARCH_TOUR, TourService } from '../core/ui/tour.service';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LogoComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="mt-24 bg-ink text-white/80">
      <div class="apneyy-container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <app-logo [inverse]="true" />
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-white/70">Apneyy means “our own”. Find South Asian restaurants, shops, services and community spaces across the US, all in one place.</p>
          <a [href]="businessUrl" class="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
            Own a business? List it free →
          </a>
        </div>
        <div>
          <h2 class="text-sm font-bold uppercase tracking-[.14em] text-saffron">Explore</h2>
          <ul class="mt-4 space-y-2.5 text-sm">
            @for (g of cats.groups(); track g.id) {
              <li><a routerLink="/search" [queryParams]="{ group: g.id }" class="hover:text-white">{{ g.label }}</a></li>
            }
          </ul>
        </div>
        <div>
          <h2 class="text-sm font-bold uppercase tracking-[.14em] text-saffron">Apneyy</h2>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li><a routerLink="/about" class="hover:text-white">About us</a></li>
            <li><a routerLink="/categories" class="hover:text-white">All categories</a></li>
            <li><a routerLink="/cities" class="hover:text-white">All cities</a></li>
            <li><a [href]="'mailto:' + email" class="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <h2 class="text-sm font-bold uppercase tracking-[.14em] text-saffron">Help</h2>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li><button type="button" (click)="replayTour()" class="hover:text-white">Take the quick tour</button></li>
            <li><a routerLink="/privacy" class="hover:text-white">Privacy</a></li>
            <li><a routerLink="/terms" class="hover:text-white">Terms</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10">
        <div class="apneyy-container flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {{ year }} Apneyy. Made with <app-icon name="heart" class="text-brand" /><span class="sr-only">love</span> for our community.</p>
          <p>Listings are shared by business owners and checked by our team.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly cats = inject(CategoryService);
  private readonly tour = inject(TourService);
  private readonly router = inject(Router);
  readonly businessUrl = environment.businessPortalUrl;
  readonly email = environment.supportEmail;
  readonly year = new Date().getFullYear();

  replayTour(): void {
    const onSearch = this.router.url.startsWith('/search');
    if (!onSearch && this.router.url.split('?')[0] !== '/') {
      void this.router.navigateByUrl('/').then(() => setTimeout(() => this.tour.start(HOME_TOUR), 500));
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.tour.start(onSearch ? SEARCH_TOUR : HOME_TOUR), 400);
  }
}
