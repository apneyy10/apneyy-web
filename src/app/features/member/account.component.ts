import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { SavedService } from '../../core/member/saved.service';
import { SeoService } from '../../core/seo/seo.service';
import { ToastService } from '../../core/ui/toast.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container max-w-2xl py-12">
      <div class="flex items-center gap-4">
        <span class="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-saffron text-2xl font-bold text-white">{{ (name || 'A')[0].toUpperCase() }}</span>
        <div>
          <h1 class="font-display text-3xl font-bold">Namaste, {{ auth.firstName() }}</h1>
          <p class="text-sm text-ink-3">{{ auth.user()?.email }}</p>
        </div>
      </div>

      @if (auth.user() && !auth.user()!.emailVerified && auth.user()!.email) {
        <p class="mt-6 rounded-2xl bg-saffron-light px-4 py-3 text-sm text-saffron-ink">Please confirm your email. We sent a link to {{ auth.user()!.email }}.</p>
      }

      <div class="mt-8 grid gap-3 sm:grid-cols-2">
        <a routerLink="/saved" class="apneyy-card flex items-center gap-4 p-5 transition hover:shadow-lift">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-2xl text-brand"><app-icon name="heart" /></span>
          <span><span class="block font-display text-2xl font-bold">{{ saved.count() }}</span><span class="text-sm text-ink-3">Saved businesses</span></span>
        </a>
        <a routerLink="/search" class="apneyy-card flex items-center gap-4 p-5 transition hover:shadow-lift">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-saffron-light text-2xl text-saffron-ink"><app-icon name="compass" /></span>
          <span><span class="block font-semibold">Explore</span><span class="text-sm text-ink-3">Find something new</span></span>
        </a>
      </div>

      <form class="apneyy-card mt-8 space-y-4 p-6" (submit)="save($event)">
        <h2 class="font-display text-xl font-bold">Profile</h2>
        <label class="block">
          <span class="apneyy-label">Display name</span>
          <input class="apneyy-input" [(ngModel)]="name" name="name" maxlength="80" />
          <span class="mt-1 block text-xs text-ink-3">Shown on your reviews.</span>
        </label>
        <label class="block">
          <span class="apneyy-label">Home city (optional)</span>
          <input class="apneyy-input" [(ngModel)]="homeCity" name="homeCity" maxlength="80" placeholder="e.g. Edison, NJ" />
        </label>
        <div class="flex justify-end"><button type="submit" class="apneyy-btn-primary" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save changes' }}</button></div>
      </form>

      <div class="mt-8 flex justify-between">
        <a routerLink="/forgot-password" [queryParams]="{ email: auth.user()?.email }" class="apneyy-btn-ghost">Change password</a>
        <button type="button" class="apneyy-btn-ghost text-brand" (click)="signOut()">Sign out</button>
      </div>
    </div>
  `,
})
export class AccountComponent {
  readonly auth = inject(AuthService);
  readonly saved = inject(SavedService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  name = '';
  homeCity = '';
  readonly busy = signal(false);

  constructor() {
    inject(SeoService).set({ title: 'Your account', description: 'Manage your Apneyy account.', path: '/account', noindex: true });
    effect(() => {
      const m = this.auth.member();
      if (m) {
        this.name = m.displayName;
        this.homeCity = m.homeCity;
      }
    });
  }

  async save(e: Event): Promise<void> {
    e.preventDefault();
    this.busy.set(true);
    try {
      await this.auth.updateMember({ displayName: this.name.trim().slice(0, 80), homeCity: this.homeCity.trim().slice(0, 80) });
      this.toast.show('Profile saved', 'success');
    } catch {
      this.toast.show('Couldn’t save. Please try again.', 'error');
    } finally {
      this.busy.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    void this.router.navigateByUrl('/');
  }
}
