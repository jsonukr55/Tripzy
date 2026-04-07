export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface JoinRequest {
  id: string;
  tripId: string;
  tripTitle: string;
  requesterId: string;
  requesterName: string;
  requesterPhotoURL: string | null;
  hostId: string;
  message: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}
