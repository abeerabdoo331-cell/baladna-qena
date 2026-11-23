import { Timestamp } from 'firebase/firestore';

export type IconKey =
  | 'medical'
  | 'education'
  | 'crafts'
  | 'market'
  | 'shop'
  | 'transport'
  | 'home'
  | 'jobs'
  | 'ads'
  | 'delivery'
  | 'aid'
  | 'services'
  | 'health'
  | 'general';

export type ListingStatus = 'pending' | 'approved' | 'rejected';
export type ListingKind = 'ad' | 'service' | 'job' | 'aid';
export type AnnouncementPriority = 'normal' | 'important';

export interface Category {
  id: string;
  parentId: string;
  name: string;
  description: string;
  iconKey: IconKey;
  accentColor: string;
  order: number;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Center {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Village {
  id: string;
  centerId: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Listing {
  id: string;
  title: string;
  serviceType: string;
  listingKind: ListingKind;
  contactPhone: string;
  hideContactInfo: boolean;
  centerId: string;
  centerName: string;
  villageId: string;
  villageName: string;
  area: string;
  notes: string;
  price: string;
  images: string[];
  categoryId: string;
  subcategoryId: string;
  submittedByName: string;
  authorUid: string;
  status: ListingStatus;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface AidContact {
  listingId: string;
  authorUid: string;
  contactPhone: string;
  requesterName: string;
  createdAt?: Timestamp | Date;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  centerName: string;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  centerId: string;
  villageId: string;
  favorites: string[];
  isBlocked: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface AppUpdate {
  id: string;
  versionName: string;
  versionCode: number;
  releaseNotes: string;
  apkUrl: string;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

/**
 * Validation constants strictly synchronized with firebase-blueprint.json and firestore.rules
 */
export const BLUEPRINT_CONSTRAINTS = {
  category: {
    idPattern: /^[a-zA-Z0-9_\-]+$/,
    idMinLength: 2,
    idMaxLength: 64,
    nameMinLength: 2,
    nameMaxLength: 60,
    descriptionMaxLength: 160,
    colorPattern: /^#[0-9a-fA-F]{6}$/,
  },
  location: {
    nameMinLength: 2,
    nameMaxLength: 60,
  },
  listing: {
    titleMinLength: 2,
    titleMaxLength: 80,
    serviceTypeMinLength: 2,
    serviceTypeMaxLength: 80,
    phoneMinLength: 6,
    phoneMaxLength: 20,
    phonePattern: /^[0-9+\-\s()]{6,20}$/,
    areaMaxLength: 80,
    notesMaxLength: 600,
    priceMaxLength: 60,
    maxImages: 3,
    maxImageDataLength: 140000,
    submittedByNameMinLength: 2,
    submittedByNameMaxLength: 60,
  },
  announcement: {
    titleMinLength: 2,
    titleMaxLength: 100,
    bodyMinLength: 2,
    bodyMaxLength: 600,
    centerNameMaxLength: 60,
  },
  userProfile: {
    maxFavorites: 50,
  },
  appUpdate: {
    versionNameMinLength: 1,
    versionNameMaxLength: 30,
    releaseNotesMinLength: 2,
    releaseNotesMaxLength: 1000,
    apkUrlMaxLength: 500,
  },
} as const;

export const ADMIN_EMAIL = 'abeerabdoo331@gmail.com';
export const CURRENT_APP_VERSION = '2.0.0';
export const GOVERNORATE_NAME = 'محافظة قنا';
