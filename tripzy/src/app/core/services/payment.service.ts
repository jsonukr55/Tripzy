import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore, Timestamp, collection, doc,
  setDoc, updateDoc, getDoc, getDocs,
  query, where, serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { TripPayment } from '../models/payment.model';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function normalize(data: Record<string, unknown>, id: string): TripPayment {
  return {
    ...data,
    id,
    paidAt: data['paidAt'] ? toDate(data['paidAt']) : null,
    createdAt: toDate(data['createdAt']),
    updatedAt: toDate(data['updatedAt']),
  } as TripPayment;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private firestore = inject(Firestore);
  private injector  = inject(Injector);

  private col() { return collection(this.firestore, 'tripPayments'); }

  private run<T>(fn: () => Promise<T>): Observable<T> {
    return from(runInInjectionContext(this.injector, fn));
  }

  /** Deterministic doc ID so we can upsert idempotently */
  private docId(tripId: string, userId: string): string {
    return `${tripId}_${userId}`;
  }

  /** Called when a join request is approved */
  createPaymentRecord(
    tripId: string,
    user: { uid: string; displayName: string; photoURL: string | null },
    amountDue: number,
    currency: string,
  ): Observable<void> {
    const id = this.docId(tripId, user.uid);
    const ref = doc(this.firestore, `tripPayments/${id}`);
    return this.run(() =>
      setDoc(ref, {
        tripId,
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        amountDue,
        currency,
        status: 'unpaid',
        markedByHost: false,
        paidAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as Record<string, unknown>, { merge: true })
    );
  }

  /** Get all payment records for a trip (host view) */
  getPaymentsForTrip(tripId: string): Observable<TripPayment[]> {
    const q = query(this.col(), where('tripId', '==', tripId));
    return this.run(() => getDocs(q)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => normalize(d.data() as Record<string, unknown>, d.id))
          .sort((a, b) => a.userName.localeCompare(b.userName))
      )
    );
  }

  /** Get a single participant's payment record */
  getMyPayment(tripId: string, userId: string): Observable<TripPayment | null> {
    const ref = doc(this.firestore, `tripPayments/${this.docId(tripId, userId)}`);
    return this.run(() => getDoc(ref)).pipe(
      map((snap) => snap.exists() ? normalize(snap.data() as Record<string, unknown>, snap.id) : null)
    );
  }

  /** Mark as paid (host or participant) */
  markAsPaid(tripId: string, userId: string, markedByHost: boolean): Observable<void> {
    const ref = doc(this.firestore, `tripPayments/${this.docId(tripId, userId)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.run(() => updateDoc(ref, { status: 'paid', paidAt: serverTimestamp(), markedByHost, updatedAt: serverTimestamp() } as any));
  }

  /** Reverse a payment (host only) */
  markAsUnpaid(tripId: string, userId: string): Observable<void> {
    const ref = doc(this.firestore, `tripPayments/${this.docId(tripId, userId)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.run(() => updateDoc(ref, { status: 'unpaid', paidAt: null, markedByHost: false, updatedAt: serverTimestamp() } as any));
  }
}
