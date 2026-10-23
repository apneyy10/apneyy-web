import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';
import { SeoService } from '../../core/seo/seo.service';
import { ToastService } from '../../core/ui/toast.service';
import { AuthShellComponent } from './auth-shell.component';
import { GoogleButtonComponent } from './google-button.component';

export function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent, GoogleButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Welcome back" sub="Sign in to see your saved places and write reviews.">
      <app-google-button [disabled]="busy()" (pressed)="google()" />
      <div class="my-6 flex items-center gap-3 text-xs text-ink-4"><span class="h-px flex-1 bg-line"></span>or with email<span class="h-px flex-1 bg-line"></span></div>
      <form (submit)="submit($event)" class="space-y-4" novalidate>
        <label class="block">
          <span class="apneyy-label">Email</span>
          <input type="email" class="apneyy-input" [(ngModel)]="email" name="email" autocomplete="email" required />
        </label>
        <label class="block">
          <span class="flex items-center justify-between"><span class="apneyy-label">Password</span><a routerLink="/forgot-password" [queryParams]="{ email: email }" class="mb-1.5 text-xs font-semibold text-brand hover:underline">Forgot?</a></span>
          <input type="password" class="apneyy-input" [(ngModel)]="password" name="password" autocomplete="current-password" required />
        </label>
        @if (error()) { <p class="animate-fade-in rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{{ error() }}</p> }
        <button type="submit" class="apneyy-btn-primary w-full !py-3" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
      </form>
      <p class="mt-6 text-center text-sm text-ink-2">New to Apneyy? <a routerLink="/signup" [queryParams]="{ next: next }" class="font-semibold text-brand hover:underline">Create a free account</a></p>
    </app-auth-shell>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly next = safeNext(inject(ActivatedRoute).snapshot.queryParamMap.get('next'));
  email = '';
  password = '';
  readonly busy = signal(false);
  readonly error = signal('');

  constructor() {
    inject(SeoService).set({ title: 'Sign in', description: 'Sign in to Apneyy to save businesses and write reviews.', path: '/login', noindex: true });
    void this.auth.start().then(() => this.auth.signedIn() && this.router.navigateByUrl(this.next));
  }

  async submit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.email || !this.password) return this.error.set('Please enter your email and password.');
    await this.run(() => this.auth.signIn(this.email, this.password));
  }

  google(): Promise<void> {
    return this.run(() => this.auth.signInWithGoogle());
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await fn();
      this.toast.show(`Welcome back, ${this.auth.firstName()}!`, 'success');
      void this.router.navigateByUrl(this.next);
    } catch (err) {
      this.error.set(authErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
