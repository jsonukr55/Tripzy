export type PaymentStatus = 'unpaid' | 'paid';

export interface TripPayment {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  amountDue: number;
  currency: string;
  status: PaymentStatus;
  markedByHost: boolean;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
