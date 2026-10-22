import { Injectable, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../ui/toast.service';

const GUEST_KEY = 'apneyy_saved_guest';
const MAX_SAVED = 200;

/**
 * Saved businesses. Guests keep them in this browser; once signed in they live on
 * members/{uid}.savedIds (already loaded with the profile, so no extra reads) and
 * any guest saves are merged in.
 */
@Injectable({ providedIn: 'root' })
export class SavedService {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly guest = signal<string[]>(this.readGuest());

  readonly ids = computed<string[]>(() => this.auth.member()?.savedIds ?? (this.auth.signedIn() ? [] : this.guest()));
  readonly count = computed(() => this.ids().length);

  constructor() {
    // Merge guest saves into the account on sign-in.
    effect(() => {
      const member = this.auth.member();
      if (!member) return;
      untracked(() => {
        const local = this.guest();
        if (!local.length) return;
        const merged = [...new Set([...member.savedIds, ...local])].slice(0, MAX_SAVED);
        this.writeGuest([]);
        if (merged.length !== member.savedIds.length) void this.auth.updateMember({ savedIds: merged }).catch(() => undefined);
      });
    });
  }

  has(id: string): boolean {
    return this.ids().includes(id);
  }

  async toggle(id: string, name = 'Business'): Promise<boolean> {
    const was = this.has(id);
    const next = was ? this.ids().filter(x => x !== id) : [id, ...this.ids()].slice(0, MAX_SAVED);
    if (this.auth.signedIn()) {
      const before = this.auth.member()?.savedIds ?? [];
      this.auth.member.update(m => (m ? { ...m, savedIds: next } : m));
      try {
        await this.auth.updateMember({ savedIds: next });
      } catch {
        this.auth.member.update(m => (m ? { ...m, savedIds: before } : m));
        this.toast.show('Couldn’t update your saved list. Please try again.', 'error');
        return was;
      }
    } else {
      this.writeGuest(next);
    }
    this.toast.show(was ? `Removed ${name} from Saved` : `Saved ${name}`, was ? 'info' : 'success', was ? undefined : { label: 'View saved', link: '/saved' });
    return !was;
  }

  private readGuest(): string[] {
    if (!this.browser) return [];
    try {
      const v = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
      return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  private writeGuest(ids: string[]): void {
    this.guest.set(ids);
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }
}
