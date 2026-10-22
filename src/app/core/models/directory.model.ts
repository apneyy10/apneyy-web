/**
 * Shapes of the static JSON written by scripts/build-data.mjs.
 * Firestore document shape lives in apneyy-admin (business.model.ts); these are
 * the public, trimmed versions of it.
 */

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeRange {
  open: string; // HH:mm
  close: string; // HH:mm
}

export interface DayHours {
  isOpen: boolean;
  ranges: TimeRange[];
}

export type OpeningHours = Record<Weekday, DayHours>;

/** Compact card used by search, lists and carousels. */
export interface DirectoryEntry {
  id: string;
  slug: string;
  name: string;
  nameNative: string;
  category: string;
  city: string;
  state: string;
  postalCode: string;
  cityKey: string; // "nj/edison"
  tags: string[];
  languages: string[];
  dietary: string[];
  cuisines: string[];
  services: string[];
  connections: string[];
  priceRange: string;
  photo: string;
  logo: string;
  summary: string;
  hours: OpeningHours | null;
  timezone: string;
  lat: number | null;
  lng: number | null;
  createdAt: number;
}

export interface FeaturedItem {
  name: string;
  price: string;
  description: string;
  isVeg: boolean;
}

/** Everything shown on a business page. */
export interface PublicBusiness {
  id: string;
  slug: string;
  name: string;
  nameNative: string;
  category: string;
  connections: string[];
  cuisines: string[];
  dietary: string[];
  services: string[];
  amenities: string[];
  tags: string[];
  languages: string[];
  description: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  website: string;
  menuUrl: string;
  orderingLinks: Partial<Record<'doordash' | 'ubereats' | 'grubhub' | 'direct', string>>;
  socialLinks: Partial<Record<'instagram' | 'facebook' | 'yelp' | 'googleMaps', string>>;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    timezone: string;
    lat: number | null;
    lng: number | null;
  };
  openingHours: OpeningHours | null;
  priceRange: string;
  paymentMethods: string[];
  featuredItems: FeaturedItem[];
  photos: string[];
  logo: string;
  licenseNumber: string;
  createdAt: number;
  updatedAt: number;
  cityKey: string;
}

export interface CitySummary {
  key: string;
  city: string;
  state: string;
  count: number;
}

export interface HomeData {
  generatedAt: string;
  sample: boolean;
  total: number;
  newest: DirectoryEntry[];
  cities: CitySummary[];
  cityCount: number;
  categoryCounts: Record<string, number>;
  languageCounts: Record<string, number>;
}

export interface BusinessData {
  business: PublicBusiness;
  similar: DirectoryEntry[];
  sample: boolean;
}

export interface CategoryData {
  id: string;
  entries: DirectoryEntry[];
  cities: CitySummary[];
  sample: boolean;
}

export interface CityData {
  city: string;
  state: string;
  key: string;
  categoryCounts: Record<string, number>;
  entries: DirectoryEntry[];
  sample: boolean;
}

export interface DirectoryData {
  generatedAt: string;
  sample: boolean;
  entries: DirectoryEntry[];
}

/** Admin-managed category list (categories/catalog). */
export interface CatalogItem {
  id: string;
  label: string;
  icon?: string;
  group: string;
  suggestedTags?: string[];
  requiresLicense?: boolean;
  active?: boolean;
}
