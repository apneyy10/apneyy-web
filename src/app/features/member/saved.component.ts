import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { SavedService } from '../../core/member/saved.service';
import { AuthService } from '../../core/auth/auth.service';
import { SeoService } from '../../core/seo/seo.service';
import { DirectoryEntry } from '../../core/models/directory.model';
import { BusinessCardComponent } from '../../shared/business-card.component';
import { CardSkeletonComponent } from '../../shared/card-skeleton.component';
import { IconComponent } from '../../shared/icon.component';

/** Saved businesses, drawn from the static directory, so viewing costs no Firestore reads. */
@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [RouterLink, BusinessCardComponent, CardSkeletonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container py-12">
      <p class="apneyy-eyebrow">Your list</p>
      <h1 class="mt-1 font-display text-4xl font-bold tracking-tight">Saved businesses</h1>
      @if (ready() && !auth.signedIn() && list().length) {
        <div class="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-saffron-light px-5 py-4 text-sm text-saffron-ink">
          <span>These are saved in this browser only.</span>
          <a routerLink="/signup" [queryParams]="{ next: '/saved' }" class="font-semibold underline">Create a free account</a> to keep them on every device.
        </div>
      }
      <div class="mt-8">
        @if (!ready()) {
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">@for (i of [1, 2, 3]; track i) { <app-card-skeleton /> }</div>
        } @else if (list().length) {
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (e of list(); track e.id) { <app-business-card class="animate-fade-up" [entry]="e" /> }
          </div>
        } @else {
          <div class="animate-fade-up rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-light text-3xl text-brand"><app-icon name="heart" /></span>
            <h2 class="mt-3 font-display text-2xl font-bold">Nothing saved yet</h2>
            <p class="mx-auto mt-2 max-w-sm text-ink-3">Tap the heart on any business to keep it here, like a list of your go-to places.</p>
            <a routerLink="/search" class="apneyy-btn-primary mt-6">Start exploring</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class SavedComponent {
  readonly auth = inject(AuthService);
  private readonly saved = inject(SavedService);
  private readonly entries = signal<DirectoryEntry[] | null>(null);
  readonly ready = computed(() => this.entries() !== null && this.auth.ready());

  readonly list = computed(() => {
    const byId = new Map((this.entries() ?? []).map(e => [e.id, e]));
    return this.saved.ids().map(id => byId.get(id)).filter((e): e is DirectoryEntry => !!e);
  });

  constructor() {
    inject(SeoService).set({ title: 'Saved businesses', description: 'Your saved businesses on Apneyy.', path: '/saved', noindex: true });
    if (isPlatformBrowser(inject(PLATFORM_ID))) inject(DataService).directory().subscribe(d => this.entries.set(d?.entries ?? []));
  }
}
