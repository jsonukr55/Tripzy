export type ReviewTarget = 'host' | 'participant';

export interface Review {
  id: string;
  tripId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoURL: string | null;
  targetId: string;
  targetType: ReviewTarget;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}
