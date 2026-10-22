import { Injectable, inject } from '@angular/core';
import { firebase } from '../firebase/firebase';
import { AuthService } from '../auth/auth.service';
import { Review, ReportReason } from '../models/member.model';

export interface ReviewPage {
  items: Review[];
  cursor: unknown | null;
}

function toDate(v: unknown): Date | null {
  return v && typeof (v as { toDate?: () => Date }).toDate === 'function' ? (v as { toDate: () => Date }).toDate() : null;
}

/**
 * Reviews and problem reports. Ratings come from a Firestore aggregate query
 * (billed as one read per 1,000 reviews), and reviews load in pages of 5 only
 * when the reviews section scrolls into view.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly auth = inject(AuthService);

  async summary(businessId: string): Promise<{ count: number; average: number }> {
    const { db, fs } = await firebase();
    const q = fs.query(fs.collection(db, 'reviews'), fs.where('businessId', '==', businessId), fs.where('status', '==', 'published'));
    const snap = await fs.getAggregateFromServer(q, { count: fs.count(), average: fs.average('rating') });
    const d = snap.data();
    return { count: d.count, average: d.average ?? 0 };
  }

  async page(businessId: string, cursor: unknown | null, size = 5): Promise<ReviewPage> {
    const { db, fs } = await firebase();
    const parts = [
      fs.where('businessId', '==', businessId),
      fs.where('status', '==', 'published'),
      fs.orderBy('createdAt', 'desc'),
      ...(cursor ? [fs.startAfter(cursor)] : []),
      fs.limit(size),
    ];
    const snap = await fs.getDocs(fs.query(fs.collection(db, 'reviews'), ...(parts as never[])));
    const items = snap.docs.map(d => this.map(d.id, d.data()));
    return { items, cursor: snap.docs.length === size ? snap.docs[snap.docs.length - 1] : null };
  }

  /** The signed-in user's own review of this business, if any (1 read). */
  async mine(businessId: string): Promise<Review | null> {
    const u = this.auth.user();
    if (!u) return null;
    const { db, fs } = await firebase();
    try {
      const snap = await fs.getDoc(fs.doc(db, 'reviews', `${businessId}_${u.uid}`));
      return snap.exists() ? this.map(snap.id, snap.data()) : null;
    } catch {
      return null;
    }
  }

  async save(businessId: string, rating: number, text: string, existing: Review | null): Promise<Review> {
    const u = this.auth.user();
    if (!u) throw new Error('Not signed in');
    const { db, fs } = await firebase();
    const ref = fs.doc(db, 'reviews', `${businessId}_${u.uid}`);
    const clean = text.trim().slice(0, 1000);
    if (existing) {
      await fs.updateDoc(ref, { rating, text: clean, updatedAt: fs.serverTimestamp() });
      return { ...existing, rating, text: clean, updatedAt: new Date() };
    }
    const displayName = (this.auth.member()?.displayName || u.displayName || 'Apneyy member').slice(0, 80);
    await fs.setDoc(ref, { businessId, uid: u.uid, displayName, rating, text: clean, status: 'published', createdAt: fs.serverTimestamp() });
    return { id: ref.id, businessId, uid: u.uid, displayName, rating, text: clean, status: 'published', createdAt: new Date(), updatedAt: null };
  }

  async report(businessId: string, businessName: string, reason: ReportReason, details: string): Promise<void> {
    const u = this.auth.user();
    if (!u) throw new Error('Not signed in');
    const { db, fs } = await firebase();
    await fs.addDoc(fs.collection(db, 'listingReports'), {
      businessId,
      businessName: businessName.slice(0, 150),
      reason,
      details: details.trim().slice(0, 1000),
      uid: u.uid,
      status: 'open',
      createdAt: fs.serverTimestamp(),
    });
  }

  private map(id: string, d: Record<string, unknown>): Review {
    return {
      id,
      businessId: String(d['businessId'] ?? ''),
      uid: String(d['uid'] ?? ''),
      displayName: String(d['displayName'] ?? 'Apneyy member'),
      rating: Number(d['rating'] ?? 0),
      text: String(d['text'] ?? ''),
      status: (d['status'] as Review['status']) ?? 'published',
      createdAt: toDate(d['createdAt']),
      updatedAt: toDate(d['updatedAt']),
    };
  }
}
