import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReviewService } from '../../core/member/review.service';
import { Review } from '../../core/models/member.model';
import { ToastService } from '../../core/ui/toast.service';
import { StarsComponent } from '../../shared/stars.component';
import { IconComponent } from '../../shared/icon.component';

/** Reviews load only when this section scrolls into view, so most visits cost no reads. */
@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, StarsComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section aria-labelledby="reviews-h" class="scroll-mt-24" id="reviews">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-h" class="font-display text-2xl font-bold">Reviews</h2>
          @if (summary(); as s) {
            @if (s.count) {
              <p class="mt-1 flex items-center gap-2 text-sm text-ink-2">
                <app-stars [value]="s.average" [size]="18" /> <strong class="text-ink">{{ s.average.toFixed(1) }}</strong> · {{ s.count }} {{ s.count === 1 ? 'review' : 'reviews' }}
              </p>
            }
          }
        </div>
        @if (!writing()) {
          @if (auth.signedIn()) {
            <button type="button" class="apneyy-btn-outline" (click)="startWriting()">{{ mine() ? 'Edit your review' : 'Write a review' }}</button>
          } @else {
            <a routerLink="/login" [queryParams]="{ next: returnUrl() + '#reviews' }" class="apneyy-btn-outline"><app-icon name="pen-line" /> Sign in to review</a>
          }
        }
      </div>

      @if (writing()) {
        <form class="mt-5 animate-fade-up rounded-3xl border border-line bg-white p-5" (submit)="save($event)">
          <p class="apneyy-label">Your rating</p>
          <app-stars [editable]="true" [(value)]="draftRating" [size]="30" />
          <label class="mt-4 block">
            <span class="apneyy-label">Your experience</span>
            <textarea [(ngModel)]="draftText" name="text" rows="4" maxlength="1000" class="apneyy-input" placeholder="What did you love? What should others know?"></textarea>
            <span class="mt-1 block text-right text-xs text-ink-4">{{ draftText.length }}/1000</span>
          </label>
          <div class="mt-2 flex justify-end gap-2">
            <button type="button" class="apneyy-btn-outline" (click)="writing.set(false)">Cancel</button>
            <button type="submit" class="apneyy-btn-primary" [disabled]="!draftRating() || busy()">{{ busy() ? 'Posting…' : 'Post review' }}</button>
          </div>
        </form>
      }

      <div class="mt-5 space-y-3">
        @if (state() === 'loading') {
          @for (i of [1, 2]; track i) {
            <div class="space-y-2 rounded-2xl border border-line bg-white p-5"><div class="skeleton h-4 w-32"></div><div class="skeleton h-4 w-full"></div><div class="skeleton h-4 w-2/3"></div></div>
          }
        } @else if (!items().length && (state() === 'ready' || state() === 'error')) {
          <div class="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
            <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-light text-3xl text-brand"><app-icon name="star" /></span>
            <p class="mt-2 font-semibold">No reviews yet</p>
            <p class="text-sm text-ink-3">Been here? Help the community by sharing your experience.</p>
          </div>
        }
        @for (r of items(); track r.id) {
          <article class="animate-fade-up rounded-2xl border border-line bg-white p-5">
            <div class="flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-saffron-light to-brand-light font-bold text-brand">{{ r.displayName[0] || 'A' }}</span>
              <div>
                <p class="font-semibold text-ink">{{ r.displayName }}</p>
                <p class="flex items-center gap-2 text-xs text-ink-3"><app-stars [value]="r.rating" [size]="13" /> {{ r.createdAt | date: 'MMM d, y' }}</p>
              </div>
            </div>
            @if (r.text) { <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-2">{{ r.text }}</p> }
          </article>
        }
        @if (cursor) {
          <button type="button" class="apneyy-btn-ghost w-full" (click)="loadMore()" [disabled]="busy()">Show more reviews</button>
        }
      </div>
    </section>
  `,
})
export class ReviewsComponent {
  readonly businessId = input.required<string>();
  readonly returnUrl = input('/');

  readonly auth = inject(AuthService);
  private readonly svc = inject(ReviewService);
  private readonly toast = inject(ToastService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly items = signal<Review[]>([]);
  readonly summary = signal<{ count: number; average: number } | null>(null);
  readonly mine = signal<Review | null>(null);
  readonly writing = signal(false);
  readonly busy = signal(false);
  readonly draftRating = signal(0);
  draftText = '';
  cursor: unknown | null = null;

  constructor() {
    afterNextRender(() => {
      const io = new IntersectionObserver(
        es => {
          if (es.some(e => e.isIntersecting)) {
            io.disconnect();
            void this.load();
          }
        },
        { rootMargin: '300px' }
      );
      io.observe(this.host.nativeElement);
    });
  }

  private async load(): Promise<void> {
    this.state.set('loading');
    try {
      const [summary, page] = await Promise.all([this.svc.summary(this.businessId()), this.svc.page(this.businessId(), null)]);
      this.summary.set(summary);
      this.items.set(page.items);
      this.cursor = page.cursor;
      this.state.set('ready');
      await this.auth.start();
      if (this.auth.signedIn()) this.mine.set(await this.svc.mine(this.businessId()));
    } catch (e) {
      console.warn('Reviews not loaded', e);
      this.state.set('error');
    }
  }

  async loadMore(): Promise<void> {
    this.busy.set(true);
    try {
      const page = await this.svc.page(this.businessId(), this.cursor);
      this.items.update(list => [...list, ...page.items]);
      this.cursor = page.cursor;
    } finally {
      this.busy.set(false);
    }
  }

  startWriting(): void {
    const m = this.mine();
    this.draftRating.set(m?.rating ?? 0);
    this.draftText = m?.text ?? '';
    this.writing.set(true);
  }

  async save(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.draftRating()) return;
    this.busy.set(true);
    try {
      const saved = await this.svc.save(this.businessId(), this.draftRating(), this.draftText, this.mine());
      const isNew = !this.mine();
      this.mine.set(saved);
      this.items.update(list => [saved, ...list.filter(r => r.id !== saved.id)]);
      if (isNew) this.summary.update(s => (s ? { count: s.count + 1, average: (s.average * s.count + saved.rating) / (s.count + 1) } : { count: 1, average: saved.rating }));
      this.writing.set(false);
      this.toast.show('Thanks for your review!', 'success');
    } catch {
      this.toast.show('Couldn’t post your review. Please try again.', 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
