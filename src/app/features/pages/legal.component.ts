import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { environment } from '../../../environments/environment';

/** Privacy policy and terms; which one comes from the route's data.kind. */
@Component({
  selector: 'app-legal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apneyy-container max-w-3xl py-14">
      <h1 class="font-display text-4xl font-bold tracking-tight">{{ kind === 'privacy' ? 'Privacy Policy' : 'Terms of Use' }}</h1>
      <p class="mt-2 text-sm text-ink-3">Last updated October 2026</p>
      <div class="mt-8 space-y-5 leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        @if (kind === 'privacy') {
          <p>This page explains what Apneyy collects when you use this website and why.</p>
          <h2>Browsing</h2>
          <p>You can search and browse without an account. Saved businesses for guests stay in your browser. We don’t sell your personal information.</p>
          <h2>Accounts</h2>
          <p>If you create an account we store your name, email address, optional home city and the businesses you save, so they’re available on any device. Sign-in is handled by Google Firebase Authentication.</p>
          <h2>Reviews and reports</h2>
          <p>Reviews show your display name publicly. Problem reports go only to the Apneyy team.</p>
          <h2>Maps</h2>
          <p>Business pages may show an OpenStreetMap map and link to Google Maps for directions. Those services have their own privacy policies.</p>
          <h2>Your choices</h2>
          <p>You can edit your profile at any time. To delete your account and reviews, email {{ email }}.</p>
        } @else {
          <p>By using Apneyy you agree to these terms.</p>
          <h2>Listings</h2>
          <p>Business information is provided by business owners and checked by our team, but details like hours and prices can change. Please confirm directly with the business before you visit.</p>
          <h2>Reviews</h2>
          <p>Reviews must be your own honest experience. No hate speech, harassment, spam, or personal information about others. We may hide reviews that break these rules.</p>
          <h2>Accounts</h2>
          <p>Keep your password safe. You are responsible for activity on your account.</p>
          <h2>Contact</h2>
          <p>Questions? Email {{ email }}.</p>
        }
      </div>
    </div>
  `,
})
export class LegalComponent {
  readonly kind = inject(ActivatedRoute).snapshot.data['kind'] as 'privacy' | 'terms';
  readonly email = environment.supportEmail;

  constructor() {
    inject(SeoService).set(
      this.kind === 'privacy'
        ? { title: 'Privacy Policy', description: 'How Apneyy handles your information.', path: '/privacy' }
        : { title: 'Terms of Use', description: 'The terms for using Apneyy.', path: '/terms' }
    );
  }
}
