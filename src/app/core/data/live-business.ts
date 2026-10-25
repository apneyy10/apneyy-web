import { Observable } from 'rxjs';
import { firebase } from '../firebase/firebase';
import { PublicBusiness } from '../models/directory.model';
import { isShowable, toPublicBusiness } from './public-shape';

/**
 * A listing approved after the last site build isn't in the static snapshot yet.
 * Fetch it live (1 read) so its link works right away.
 */
export async function fetchLiveBusiness(slug: string): Promise<PublicBusiness | null> {
  const { db, fs } = await firebase();
  const q = fs.query(fs.collection(db, 'businesses'), fs.where('status', '==', 'verified'), fs.where('slug', '==', slug), fs.limit(1));
  const snap = await fs.getDocs(q);
  const doc = snap.docs[0];
  if (!doc) return null;
  const b = toPublicBusiness(doc.id, doc.data());
  return isShowable(b) ? { ...b, slug } : null;
}

/**
 * Live copy of one public listing (browser only). Emits null once it's taken
 * down or deleted: the rules then refuse the read, since only verified
 * listings are public. Other errors (offline) keep the last copy on screen.
 */
export function watchLiveBusiness(id: string): Observable<PublicBusiness | null> {
  return new Observable<PublicBusiness | null>(sub => {
    let stop: (() => void) | null = null;
    let closed = false;
    firebase()
      .then(({ db, fs }) => {
        if (closed) return;
        stop = fs.onSnapshot(
          fs.doc(db, 'businesses', id),
          snap => {
            const data = snap.exists() ? snap.data() : null;
            const b = data && data['status'] === 'verified' ? toPublicBusiness(snap.id, data) : null;
            sub.next(b && isShowable(b) ? b : null);
          },
          err => {
            if ((err as { code?: string }).code === 'permission-denied') sub.next(null);
            else console.warn('[apneyy] Live updates for this listing are off.', err);
          }
        );
      })
      .catch(err => console.warn('[apneyy] Live updates for this listing are off.', err));
    return () => {
      closed = true;
      stop?.();
    };
  });
}
