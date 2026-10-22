/** members/{uid}: a shopper's own profile. Staff profiles live in users/{uid}. */
export interface Member {
  displayName: string;
  email: string;
  photoURL: string;
  savedIds: string[];
  homeCity: string;
}

/** reviews/{businessId}_{uid} */
export interface Review {
  id: string;
  businessId: string;
  uid: string;
  displayName: string;
  rating: number;
  text: string;
  status: 'published' | 'hidden';
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ReportReason = 'wrong_info' | 'closed' | 'duplicate' | 'not_south_asian' | 'other';

export const REPORT_REASONS: readonly { id: ReportReason; label: string }[] = [
  { id: 'wrong_info', label: 'Wrong phone, address or hours' },
  { id: 'closed', label: 'Permanently closed' },
  { id: 'duplicate', label: 'Listed twice' },
  { id: 'not_south_asian', label: 'No South Asian connection' },
  { id: 'other', label: 'Something else' },
];
