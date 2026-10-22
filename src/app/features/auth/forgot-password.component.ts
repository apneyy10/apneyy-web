import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { SeoService } from '../../core/seo/seo.service';
import { AuthShellComponent } from './auth-shell.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heading="Reset your password" sub="We’ll email you a link to choose a new one.">
      @if (sent()) {
        <div class="animate-scale-in rounded-2xl bg-apneyyGreen-tint p-5 text-sm text-apneyyGreen">
          <p class="font-semibold">Check your inbox 📬</p>
          <p class="mt-1">If an account exists for {{ email }}, a reset link is on its way. It can take a minute, and may land in spam.</p>
        </div>
        <a routerLink="/login" class="apneyy-btn-outline mt-6 w-full">Back to sign in</a>
      } @else {
        <form (submit)="submit($event)" class="space-y-4">
          <label class="block">
            <span class="apneyy-label">Email</span>
            <input type="email" class="apneyy-input" [(ngModel)]="email" name="email" autocomplete="email" required />
          </label>
          <button type="submit" class="apneyy-btn-primary w-full !py-3" [disabled]="busy() || !email">{{ busy() ? 'Sending…' : 'Send reset link' }}</button>
        </form>
        <p class="mt-6 text-center text-sm"><a routerLink="/login" class="font-semibold text-brand hover:underline">Back to sign in</a></p>
      }
    </app-auth-shell>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  email = inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '';
  readonly busy = signal(false);
  readonly sent = signal(false);

  constructor() {
    inject(SeoService).set({ title: 'Reset password', description: 'Reset your Apneyy password.', path: '/forgot-password', noindex: true });
  }

  async submit(e: Event): Promise<void> {
    e.preventDefault();
    this.busy.set(true);
    try {
      await this.auth.resetPassword(this.email);
    } catch {
      /* Don't reveal whether the account exists. */
    }
    this.busy.set(false);
    this.sent.set(true);
  }
}
