export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  travelPreferences: TravelPreference[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  reviewCount: number;
  isBlocked: boolean;
  reportCount: number;
}

export type TravelPreference =
  | 'budget'
  | 'luxury'
  | 'adventure'
  | 'workation'
  | 'cultural'
  | 'solo'
  | 'group';
