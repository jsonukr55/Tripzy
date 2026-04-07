import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  increment,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Trip } from '../models/trip.model';

export interface TripFilter {
  destination?: string;
  tripType?: string;
  minBudget?: number;
  maxBudget?: number;
  startAfterDate?: Date;
}

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function normalizeTrip(data: Record<string, unknown>, id: string): Trip {
  return {
    ...data,
    id,
    startDate:  toDate(data['startDate']),
    endDate:    toDate(data['endDate']),
    createdAt:  toDate(data['createdAt']),
    updatedAt:  toDate(data['updatedAt']),
  } as Trip;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private firestore = inject(Firestore);
  private injector  = inject(Injector);

  private tripsCol() {
    return collection(this.firestore, 'trips');
  }

  private run<T>(fn: () => Promise<T>): Observable<T> {
    return from(runInInjectionContext(this.injector, fn));
  }

  /**
   * Get open trips ordered by createdAt desc.
   * Note: status filter is applied client-side to avoid requiring a Firestore composite index.
   */
  getTrips(pageSize = 20): Observable<Trip[]> {
    const q = query(
      this.tripsCol(),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    return this.run(() => getDocs(q)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => normalizeTrip(d.data() as Record<string, unknown>, d.id))
          .filter((t) => t.status === 'open')
      )
    );
  }

  /** Get trips created by a specific host */
  getTripsByHost(hostId: string): Observable<Trip[]> {
    // Single-field where — no composite index needed; sort client-side
    const q = query(this.tripsCol(), where('hostId', '==', hostId));
    return this.run(() => getDocs(q)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => normalizeTrip(d.data() as Record<string, unknown>, d.id))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      )
    );
  }

  /** Get trips a user has joined */
  getJoinedTrips(uid: string): Observable<Trip[]> {
    // Single-field array-contains — no composite index needed; sort client-side
    const q = query(this.tripsCol(), where('participantIds', 'array-contains', uid));
    return this.run(() => getDocs(q)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => normalizeTrip(d.data() as Record<string, unknown>, d.id))
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      )
    );
  }

  /** Get a single trip by ID */
  getTripDoc(id: string): Observable<Trip | null> {
    const ref = doc(this.firestore, `trips/${id}`);
    return this.run(() => getDoc(ref)).pipe(
      map((snap) => snap.exists() ? normalizeTrip(snap.data() as Record<string, unknown>, snap.id) : null)
    );
  }

  /** Create a new trip */
  createTrip(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    return this.run(() =>
      addDoc(this.tripsCol(), {
        ...data,
        startDate:  Timestamp.fromDate(data.startDate),
        endDate:    Timestamp.fromDate(data.endDate),
        createdAt:  serverTimestamp(),
        updatedAt:  serverTimestamp(),
      })
    ).pipe(map((ref) => ref.id));
  }

  /** Update an existing trip */
  updateTrip(id: string, data: Partial<Trip>): Observable<void> {
    const ref = doc(this.firestore, `trips/${id}`);
    const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
    if (data.startDate) payload['startDate'] = Timestamp.fromDate(data.startDate);
    if (data.endDate)   payload['endDate']   = Timestamp.fromDate(data.endDate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.run(() => updateDoc(ref, payload as any));
  }

  /** Add an approved participant atomically */
  addParticipant(tripId: string, userId: string): Observable<void> {
    const ref = doc(this.firestore, `trips/${tripId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.run(() => updateDoc(ref, { participantIds: arrayUnion(userId), currentParticipants: increment(1), updatedAt: serverTimestamp() } as any));
  }

  /** Delete a trip */
  deleteTrip(id: string): Observable<void> {
    return this.run(() => deleteDoc(doc(this.firestore, `trips/${id}`)));
  }

  /**
   * Search trips by destination keyword.
   * Uses a single array-contains query (no composite index) + client-side status filter.
   */
  searchByDestination(keyword: string): Observable<Trip[]> {
    const kw = keyword.toLowerCase().trim();
    const q  = query(
      this.tripsCol(),
      where('destinationKeywords', 'array-contains', kw),
      limit(20)
    );
    return this.run(() => getDocs(q)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => normalizeTrip(d.data() as Record<string, unknown>, d.id))
          .filter((t) => t.status === 'open')
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      )
    );
  }
}
