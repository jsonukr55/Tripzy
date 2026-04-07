import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore, Timestamp, collection, addDoc, updateDoc, getDocs,
  doc, query, where, orderBy, serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { JoinRequest, RequestStatus } from '../models/request.model';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function normalize(data: Record<string, unknown>, id: string): JoinRequest {
  return { ...data, id, createdAt: toDate(data['createdAt']), updatedAt: toDate(data['updatedAt']) } as JoinRequest;
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  private firestore = inject(Firestore);
  private injector  = inject(Injector);

  private col() { return collection(this.firestore, 'joinRequests'); }

  private run<T>(fn: () => Promise<T>): Observable<T> {
    return from(runInInjectionContext(this.injector, fn));
  }

  /** Send a join request */
  sendRequest(data: Omit<JoinRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Observable<string> {
    return this.run(() =>
      addDoc(this.col(), {
        ...data, status: 'pending',
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    ).pipe(map((ref) => ref.id));
  }

  /** Get all requests for a trip (host view) */
  getRequestsForTrip(tripId: string): Observable<JoinRequest[]> {
    const q = query(this.col(), where('tripId', '==', tripId), orderBy('createdAt', 'desc'));
    return this.run(() => getDocs(q)).pipe(
      map((snap) => snap.docs.map((d) => normalize(d.data() as Record<string, unknown>, d.id)))
    );
  }

  /** Get all requests sent by a user */
  getMyRequests(uid: string): Observable<JoinRequest[]> {
    const q = query(this.col(), where('requesterId', '==', uid), orderBy('createdAt', 'desc'));
    return this.run(() => getDocs(q)).pipe(
      map((snap) => snap.docs.map((d) => normalize(d.data() as Record<string, unknown>, d.id)))
    );
  }

  /** Check if user already sent a request for a trip */
  hasRequested(tripId: string, uid: string): Observable<boolean> {
    const q = query(this.col(), where('tripId', '==', tripId), where('requesterId', '==', uid));
    return this.run(() => getDocs(q)).pipe(map((snap) => !snap.empty));
  }

  /** Approve or reject a request */
  updateStatus(requestId: string, status: RequestStatus): Observable<void> {
    const ref = doc(this.firestore, `joinRequests/${requestId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.run(() => updateDoc(ref, { status, updatedAt: serverTimestamp() } as any));
  }
}
