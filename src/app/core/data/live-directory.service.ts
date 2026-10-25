import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SITE } from '../../../environments/site.generated';
import { firebase } from '../firebase/firebase';
import { PublicBusiness } from '../models/directory.model';
import { isShowable, millis, toPublicBusiness } from './public-shape';

/** A listing that changed after the site was built. `business` is null once it's no longer public. */
export interface LiveChange {
  business: PublicBusiness | null;
  /** True when the listing was approved after the build, so the snapshot doesn't have it. */
  isNew: boolean;
}

export type LiveChanges = ReadonlyMap<string, LiveChange>;

/** Covers clock drift between the build machine and Firestore. */
const OVERLAP_MS = 5 * 60_000;

/**
 * The site is prebuilt from a snapshot of live listings. This keeps it current
 * without a rebuild: one listener for verified listings edited or approved
 * since the build. Usually that's none, so it costs about one read per visit,
 * and edits from the business site or the admin portal show up straight away.
 *
 * A listing taken down after the build only disappears here if it was also
 * edited after the build; the business page itself checks its own listing.
 */
@Injectable({ providedIn: 'root' })
export class LiveDirectoryService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly subject = new BehaviorSubject<LiveChanges>(new Map());
  private started = false;

  /** Emits an empty map first, then whenever a listing changes. Server: never changes. */
  changes(): Observable<LiveChanges> {
    if (!this.browser || SITE.sample) return of(new Map());
    this.start();
    return this.subject;
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    const since = Date.parse(SITE.generatedAt) - OVERLAP_MS;
    if (!Number.isFinite(since)) return;
    firebase()
      .then(({ db, fs }) => {
        const q = fs.query(
          fs.collection(db, 'businesses'),
          fs.where('status', '==', 'verified'),
          fs.where('updatedAt', '>', fs.Timestamp.fromMillis(since))
        );
        fs.onSnapshot(
          q,
          snap => {
            if (!snap.docChanges().length) return;
            const next = new Map(this.subject.value);
            for (const c of snap.docChanges()) {
              const prev = next.get(c.doc.id);
              if (c.type === 'removed') {
                next.set(c.doc.id, { business: null, isNew: prev?.isNew ?? false });
                continue;
              }
              const data = c.doc.data() as Record<string, unknown>;
              const b = toPublicBusiness(c.doc.id, data);
              const built = since + OVERLAP_MS;
              const isNew = prev?.isNew ?? (millis(data['reviewedAt']) > built || millis(data['createdAt']) > built);
              next.set(c.doc.id, { business: isShowable(b) ? b : null, isNew });
            }
            this.subject.next(next);
          },
          err => console.warn('[apneyy] Live updates are off; showing the last published listings.', err)
        );
      })
      .catch(err => console.warn('[apneyy] Live updates are off.', err));
  }
}
