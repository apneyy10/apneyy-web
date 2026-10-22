import { firebase } from '../firebase/firebase';
import { OpeningHours, PublicBusiness } from '../models/directory.model';
import { slugify } from '../util/text.util';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : []);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const millis = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0);

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
  const d = doc.data() as Record<string, any>;
  const a = d['address'] ?? {};
  const city = str(a.city);
  const state = str(a.state).toUpperCase();
  return {
    id: doc.id,
    slug,
    name: str(d['name']),
    nameNative: str(d['nameNative']),
    category: str(d['category']) || 'other_service',
    connections: arr(d['indianConnection']),
    cuisines: arr(d['cuisines']),
    dietary: arr(d['dietary']),
    services: arr(d['services']),
    amenities: arr(d['amenities']),
    tags: arr(d['tags']),
    languages: arr(d['languagesSpoken']),
    description: str(d['description']),
    phone: str(d['phone']),
    phoneDisplay: str(d['phoneDisplay']) || str(d['phone']),
    email: str(d['email']),
    website: str(d['website']),
    menuUrl: str(d['menuUrl']),
    orderingLinks: d['orderingLinks'] ?? {},
    socialLinks: d['socialLinks'] ?? {},
    address: {
      line1: str(a.line1),
      line2: str(a.line2),
      city,
      state,
      postalCode: str(a.postalCode),
      timezone: str(a.timezone) || 'America/New_York',
      lat: num(a.lat),
      lng: num(a.lng),
    },
    openingHours: (d['openingHours'] as OpeningHours) ?? null,
    priceRange: str(d['priceRange']),
    paymentMethods: arr(d['paymentMethods']),
    featuredItems: Array.isArray(d['featuredItems']) ? d['featuredItems'] : [],
    photos: arr(d['photos']),
    logo: str(d['logo']),
    licenseNumber: str(d['licenseNumber']),
    createdAt: millis(d['createdAt']),
    updatedAt: millis(d['updatedAt']),
    cityKey: `${state.toLowerCase()}/${slugify(city)}`,
  };
}
