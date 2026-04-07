export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface JoinRequest {
  id: string;
  tripId: string;
  tripTitle: string;
  tripCoverImageURL?: string;
  requesterId: string;
  requesterName: string;
  requesterPhotoURL?: string;
  hostId: string;
  message: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}
