import { ChangeDetectionStrategy, Component, HostListener, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LogoComponent } from './logo.component';
import { SearchBoxComponent } from './search-box.component';
import { AuthService } from '../core/auth/auth.service';
import { SavedService } from '../core/member/saved.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent, SearchBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-50 transition-all duration-300" [class]="solid() ? 'border-b border-line bg-paper/90 shadow-[0_1px_0_rgba(0,0,0,.02)] backdrop-blur-lg' : 'border-b border-transparent bg-transparent'">
      <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">Skip to content</a>
      <nav class="apneyy-container flex h-16 items-center gap-4" aria-label="Main">
        <a routerLink="/" class="shrink-0 rounded-lg" aria-label="Apneyy home"><app-logo /></a>

        @if (!onHome()) {
          <div class="hidden max-w-xl flex-1 lg:block">
            <app-search-box size="sm" placeholder="Search businesses" />
          </div>
        }

        <div class="ml-auto hidden items-center gap-1 md:flex">
          <a routerLink="/search" routerLinkActive="!text-brand" class="apneyy-btn-ghost">Explore</a>
          <a routerLink="/categories" routerLinkActive="!text-brand" class="apneyy-btn-ghost">Categories</a>
          <a routerLink="/cities" routerLinkActive="!text-brand" class="apneyy-btn-ghost">Cities</a>
          <a [href]="businessUrl" class="apneyy-btn-ghost">For business</a>
        </div>

        <div class="ml-auto flex items-center gap-1.5 md:ml-2">
          <a routerLink="/saved" class="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-sunk" aria-label="Saved businesses">
            <svg class="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
            @if (savedCount() > 0) {
              <span class="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 animate-scale-in place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">{{ savedCount() }}</span>
            }
          </a>
          <div data-tour="account" class="relative">
            @if (auth.signedIn()) {
              <button type="button" (click)="menu.set(!menu())" [attr.aria-expanded]="menu()" aria-haspopup="menu" class="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 transition hover:shadow-card">
                <span class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-saffron text-sm font-bold text-white">{{ initial() }}</span>
                <span class="hidden text-sm font-semibold sm:inline">{{ auth.firstName() }}</span>
              </button>
              @if (menu()) {
                <div role="menu" class="absolute right-0 top-12 w-56 animate-scale-in overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-2xl">
                  <p class="truncate px-3 py-2 text-xs text-ink-3">{{ auth.user()?.email }}</p>
                  <a role="menuitem" routerLink="/saved" (click)="menu.set(false)" class="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-sunk">Saved businesses</a>
                  <a role="menuitem" routerLink="/account" (click)="menu.set(false)" class="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-sunk">Account</a>
                  <button role="menuitem" type="button" (click)="signOut()" class="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-brand hover:bg-brand-light">Sign out</button>
                </div>
              }
            } @else {
              <a routerLink="/login" class="apneyy-btn-primary !px-4 !py-2">Sign in</a>
            }
          </div>
          <button type="button" class="grid h-10 w-10 place-items-center rounded-full hover:bg-sunk md:hidden" (click)="mobile.set(!mobile())" [attr.aria-expanded]="mobile()" aria-label="Menu">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              @if (mobile()) { <path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" /> } @else { <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" /> }
            </svg>
          </button>
        </div>
      </nav>
      @if (mobile()) {
        <div class="animate-fade-in border-t border-line bg-paper md:hidden">
          <div class="apneyy-container space-y-1 py-3">
            @if (!onHome()) {
              <div class="pb-2"><app-search-box size="sm" placeholder="Search businesses" /></div>
            }
            <a routerLink="/search" class="block rounded-xl px-3 py-2.5 font-semibold hover:bg-sunk">Explore</a>
            <a routerLink="/categories" class="block rounded-xl px-3 py-2.5 font-semibold hover:bg-sunk">Categories</a>
            <a routerLink="/cities" class="block rounded-xl px-3 py-2.5 font-semibold hover:bg-sunk">Cities</a>
            <a [href]="businessUrl" class="block rounded-xl px-3 py-2.5 font-semibold hover:bg-sunk">List your business</a>
          </div>
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly saved = inject(SavedService);
  private readonly router = inject(Router);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly businessUrl = environment.businessPortalUrl;

  readonly menu = signal(false);
  readonly mobile = signal(false);
  readonly scrolled = signal(false);
  readonly url = signal(this.router.url);
  readonly onHome = computed(() => this.url().split('?')[0] === '/');
  readonly solid = computed(() => this.scrolled() || !this.onHome() || this.mobile());
  readonly savedCount = computed(() => (this.browser ? this.saved.count() : 0));
  readonly initial = computed(() => (this.auth.firstName()[0] || 'A').toUpperCase());

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(e => {
        this.url.set(e.urlAfterRedirects);
        this.menu.set(false);
        this.mobile.set(false);
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.menu.set(false);
  }

  async signOut(): Promise<void> {
    this.menu.set(false);
    await this.auth.signOut();
    void this.router.navigateByUrl('/');
  }
}
