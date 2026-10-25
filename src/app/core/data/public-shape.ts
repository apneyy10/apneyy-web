import { DirectoryEntry, OpeningHours, PublicBusiness, Weekday } from '../models/directory.model';
import { slugify } from '../util/text.util';

/**
 * Turns a Firestore business document into the public shapes the site renders.
 * Mirrors toPublicBusiness / toEntry in scripts/build-data.mjs, so a listing
 * read live looks exactly like one from the static snapshot.
 */

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const arr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map(x => x.trim()) : [];
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
export const millis = (v: unknown) =>
  v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0;

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const HHMM = /^\d\d:\d\d$/;

function cleanHours(h: unknown): OpeningHours | null {
  if (!h || typeof h !== 'object') return null;
  const out = {} as OpeningHours;
  let any = false;
  for (const d of WEEKDAYS) {
    const day = (h as Record<string, any>)[d];
    const ranges = Array.isArray(day?.ranges)
      ? day.ranges.filter((r: any) => HHMM.test(r?.open) && HHMM.test(r?.close)).map((r: any) => ({ open: r.open, close: r.close }))
      : [];
    out[d] = { isOpen: !!day?.isOpen && ranges.length > 0, ranges };
    if (out[d].isOpen) any = true;
  }
  return any ? out : null;
}

function cleanLinks(o: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (str(v)) out[k] = str(v);
  return out;
}

export function toPublicBusiness(id: string, d: Record<string, any>): PublicBusiness {
  const a = d['address'] ?? {};
  const city = str(a.city);
  const state = str(a.state).toUpperCase();
  return {
    id,
    slug: slugify(str(d['slug'])) || id,
    name: str(d['name']),
    nameNative: str(d['nameNative']),
    category: str(d['category']) || 'other_service',
    connections: arr(d['indianConnection']),
    cuisines: arr(d['cuisines']),
    dietary: arr(d['dietary']),
    services: arr(d['services']),
    amenities: arr(d['amenities']),
    tags: arr(d['tags']).slice(0, 20),
    languages: arr(d['languagesSpoken']),
    description: str(d['description']),
    phone: str(d['phone']),
    phoneDisplay: str(d['phoneDisplay']) || str(d['phone']),
    email: str(d['email']),
    website: str(d['website']),
    menuUrl: str(d['menuUrl']),
    orderingLinks: cleanLinks(d['orderingLinks']),
    socialLinks: cleanLinks(d['socialLinks']),
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
    openingHours: cleanHours(d['openingHours']),
    priceRange: str(d['priceRange']),
    paymentMethods: arr(d['paymentMethods']),
    featuredItems: (Array.isArray(d['featuredItems']) ? d['featuredItems'] : [])
      .filter((i: any) => str(i?.name))
      .slice(0, 12)
      .map((i: any) => ({ name: str(i.name), price: str(i.price), description: str(i.description), isVeg: !!i.isVeg })),
    photos: arr(d['photos']).slice(0, 10),
    logo: str(d['logo']),
    licenseNumber: str(d['licenseNumber']),
    createdAt: millis(d['createdAt']),
    updatedAt: millis(d['updatedAt']),
    cityKey: `${state.toLowerCase()}/${slugify(city)}`,
  };
}

/** The compact card used by search, lists and carousels. */
export function toEntry(b: PublicBusiness): DirectoryEntry {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    nameNative: b.nameNative,
    category: b.category,
    city: b.address.city,
    state: b.address.state,
    postalCode: b.address.postalCode,
    cityKey: b.cityKey,
    tags: b.tags.slice(0, 8),
    languages: b.languages,
    dietary: b.dietary,
    cuisines: b.cuisines,
    services: b.services,
    connections: b.connections,
    priceRange: b.priceRange,
    photo: b.photos[0] || '',
    logo: b.logo,
    summary: b.description.length > 160 ? b.description.slice(0, 157).replace(/\s+\S*$/, '') + '…' : b.description,
    hours: b.openingHours,
    timezone: b.address.timezone,
    lat: b.address.lat,
    lng: b.address.lng,
    createdAt: b.createdAt,
  };
}

/** Same rule as the build: a listing needs a name, city and state to be shown. */
export function isShowable(b: PublicBusiness): boolean {
  return !!(b.name && b.address.city && b.address.state);
}
