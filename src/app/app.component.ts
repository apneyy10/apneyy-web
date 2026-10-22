import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar.component';
import { FooterComponent } from './shared/footer.component';
import { ToastContainerComponent } from './shared/toast-container.component';
import { TourComponent } from './shared/tour.component';
import { AuthService } from './core/auth/auth.service';
import { SITE } from '../environments/site.generated';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastContainerComponent, TourComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sample) {
      <div class="bg-saffron-light px-4 py-2 text-center text-xs font-semibold text-saffron-ink">
        Preview: these are sample listings to show how Apneyy works. Real businesses appear here once they’re approved.
      </div>
    }
    <app-navbar />
    <main id="main" class="min-h-[60vh]">
      <router-outlet />
    </main>
    <app-footer />
    <app-toasts />
    <app-tour />
  `,
})
export class AppComponent {
  readonly sample = SITE.sample;

  constructor() {
    inject(AuthService).restore();
  }
}
