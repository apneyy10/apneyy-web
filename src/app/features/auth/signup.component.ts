import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';
import { SeoService } from '../../core/seo/seo.service';
import { ToastService } from '../../core/ui/toast.service';
import { AuthShellComponent } from './auth-shell.component';
import { GoogleButtonComponent } from './google-button.component';
import { safeNext } from './login.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent, GoogleButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Join Apneyy" sub="Free forever. Save places, write reviews and help the community.">
      <app-google-button [disabled]="busy()" (pressed)="google()" />
      <div class="my-6 flex items-center gap-3 text-xs text-ink-4"><span class="h-px flex-1 bg-line"></span>or with email<span class="h-px flex-1 bg-line"></span></div>
      <form (submit)="submit($event)" class="space-y-4" novalidate>
        <label class="block">
          <span class="apneyy-label">Your name</span>
          <input class="apneyy-input" [(ngModel)]="name" name="name" autocomplete="name" maxlength="80" required />
        </label>
        <label class="block">
          <span class="apneyy-label">Email</span>
          <input type="email" class="apneyy-input" [(ngModel)]="email" name="email" autocomplete="email" required />
        </label>
        <label class="block">
          <span class="apneyy-label">Password</span>
          <input type="password" class="apneyy-input" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" autocomplete="new-password" minlength="8" required />
          <span class="mt-2 flex gap-1" aria-hidden="true">
            @for (i of [1, 2, 3, 4]; track i) { <span class="h-1 flex-1 rounded-full transition-colors" [class]="i <= strength() ? strengthColor() : 'bg-line'"></span> }
          </span>
          <span class="mt-1 block text-xs text-ink-3">{{ strengthText() }}</span>
        </label>
        <label class="flex items-start gap-2.5 text-sm text-ink-2">
          <input type="checkbox" class="mt-0.5 h-4 w-4 accent-[#a3242f]" [(ngModel)]="agree" name="agree" />
          <span>I agree to the <a routerLink="/terms" class="font-semibold text-brand underline" target="_blank">Terms</a> and <a routerLink="/privacy" class="font-semibold text-brand underline" target="_blank">Privacy Policy</a>.</span>
        </label>
        @if (error()) { <p class="animate-fade-in rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{{ error() }}</p> }
        <button type="submit" class="apneyy-btn-primary w-full !py-3" [disabled]="busy()">{{ busy() ? 'Creating account…' : 'Create account' }}</button>
      </form>
      <p class="mt-6 text-center text-sm text-ink-2">Already have an account? <a routerLink="/login" [queryParams]="{ next: next }" class="font-semibold text-brand hover:underline">Sign in</a></p>
    </app-auth-shell>
  `,
})
export class SignupComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly next = safeNext(inject(ActivatedRoute).snapshot.queryParamMap.get('next'));
  name = '';
  email = '';
  agree = false;
  readonly password = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  readonly strength = computed(() => {
    const p = this.password();
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    return p ? Math.max(1, s) : 0;
  });
  readonly strengthColor = computed(() => ['bg-line', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-600'][this.strength()]);
  readonly strengthText = computed(() => ['At least 8 characters', 'Too weak', 'Okay', 'Good', 'Strong 💪'][this.strength()]);

  constructor() {
    inject(SeoService).set({ title: 'Create an account', description: 'Join Apneyy for free to save businesses and write reviews.', path: '/signup', noindex: true });
  }

  async submit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.name.trim()) return this.error.set('Please tell us your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) return this.error.set('Please enter a valid email address.');
    if (this.password().length < 8) return this.error.set('Your password needs at least 8 characters.');
    if (!this.agree) return this.error.set('Please accept the Terms and Privacy Policy.');
    await this.run(() => this.auth.signUp(this.name, this.email, this.password()));
  }

  google(): Promise<void> {
    return this.run(() => this.auth.signInWithGoogle());
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await fn();
      this.toast.show(`Welcome to Apneyy, ${this.auth.firstName()}! 🎉`, 'success');
      void this.router.navigateByUrl(this.next === '/' ? '/saved' : this.next);
    } catch (err) {
      this.error.set(authErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
