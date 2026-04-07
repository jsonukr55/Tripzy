export type TripType = 'budget' | 'luxury' | 'adventure' | 'workation';
export type TransportMode = 'flight' | 'train' | 'bus' | 'car' | 'cruise' | 'mixed';
export type GenderPreference = 'any' | 'male' | 'female';
export type TripStatus = 'open' | 'full' | 'completed' | 'cancelled';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
}

export interface Trip {
  id: string;
  hostId: string;
  hostName: string;
  hostPhotoURL: string | null;

  title: string;
  description: string;
  destination: string;
  destinationKeywords: string[]; // for search

  startDate: Date;
  endDate: Date;

  budget: number;
  currency: string;

  transportMode: TransportMode;
  tripType: TripType;
  genderPreference: GenderPreference;

  maxParticipants: number;
  currentParticipants: number;
  participantIds: string[];

  coverImageURL: string | null;
  imageURLs: string[];

  itinerary: ItineraryDay[];

  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;

  // Payment tracking (optional)
  paymentEnabled?: boolean;
  costPerPerson?: number;
}
