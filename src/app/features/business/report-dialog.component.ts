import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReviewService } from '../../core/member/review.service';
import { REPORT_REASONS, ReportReason } from '../../core/models/member.model';
import { ToastService } from '../../core/ui/toast.service';

/** "Report a problem": goes to the admin team's queue (listingReports). */
@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[70] grid place-items-end p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="report-h">
      <div class="absolute inset-0 animate-fade-in bg-ink/50" (click)="closed.emit()"></div>
      <div class="relative w-full max-w-md animate-slide-up rounded-t-3xl bg-white p-6 shadow-2xl sm:animate-scale-in sm:rounded-3xl">
        <h2 id="report-h" class="font-display text-2xl font-bold">Report a problem</h2>
        <p class="mt-1 text-sm text-ink-3">Tell our team what’s wrong with {{ businessName() }}. We check every report.</p>
        @if (!auth.signedIn()) {
          <div class="mt-5 rounded-2xl bg-sunk p-4 text-sm">
            Please <a routerLink="/login" [queryParams]="{ next: returnUrl() }" class="font-semibold text-brand underline" (click)="closed.emit()">sign in</a> so we can follow up if needed.
          </div>
        } @else {
          <form class="mt-5 space-y-4" (submit)="send($event)">
            <fieldset class="space-y-1.5">
              <legend class="apneyy-label">What’s the issue?</legend>
              @for (r of reasons; track r.id) {
                <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm transition has-[:checked]:border-brand has-[:checked]:bg-brand-light">
                  <input type="radio" name="reason" [value]="r.id" [(ngModel)]="reason" class="accent-[#a3242f]" /> {{ r.label }}
                </label>
              }
            </fieldset>
            <label class="block">
              <span class="apneyy-label">Details (optional)</span>
              <textarea [(ngModel)]="details" name="details" rows="3" maxlength="1000" class="apneyy-input" placeholder="E.g. the new phone number or correct hours"></textarea>
            </label>
            <div class="flex justify-end gap-2">
              <button type="button" class="apneyy-btn-outline" (click)="closed.emit()">Cancel</button>
              <button type="submit" class="apneyy-btn-primary" [disabled]="!reason || busy()">{{ busy() ? 'Sending…' : 'Send report' }}</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class ReportDialogComponent {
  readonly businessId = input.required<string>();
  readonly businessName = input.required<string>();
  readonly returnUrl = input('/');
  readonly closed = output<void>();

  readonly auth = inject(AuthService);
  private readonly reviews = inject(ReviewService);
  private readonly toast = inject(ToastService);
  readonly reasons = REPORT_REASONS;
  reason: ReportReason | '' = '';
  details = '';
  readonly busy = signal(false);

  async send(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.reason) return;
    this.busy.set(true);
    try {
      await this.reviews.report(this.businessId(), this.businessName(), this.reason, this.details);
      this.toast.show('Thanks! Our team will take a look.', 'success');
      this.closed.emit();
    } catch {
      this.toast.show('Couldn’t send your report. Please try again.', 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
