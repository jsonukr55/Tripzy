export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentProvider = 'razorpay' | 'stripe';

export interface Payment {
  id: string;
  tripId: string;
  userId: string;
  hostId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider | null;
  providerPaymentId: string | null; // external provider reference
  createdAt: Date;
  updatedAt: Date;
}
