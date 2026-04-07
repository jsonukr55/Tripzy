import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function normalizeProfile(data: Record<string, unknown>): UserProfile {
  return {
    ...data,
    createdAt: toDate(data['createdAt']),
    updatedAt: toDate(data['updatedAt']),
  } as UserProfile;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private injector  = inject(Injector);

  private userRef(uid: string) {
    return doc(this.firestore, `users/${uid}`);
  }

  private run<T>(fn: () => Promise<T>): Observable<T> {
    return from(runInInjectionContext(this.injector, fn));
  }

  createProfile(uid: string, data: Partial<UserProfile>): Observable<void> {
    const profile: Partial<UserProfile> = {
      uid,
      bio: '',
      travelPreferences: [],
      isVerified: false,
      rating: 0,
      reviewCount: 0,
      isBlocked: false,
      reportCount: 0,
      ...data,
    };
    return this.run(() =>
      setDoc(this.userRef(uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  }

  getProfile(uid: string): Observable<UserProfile | null> {
    return this.run(() => getDoc(this.userRef(uid))).pipe(
      map((snap) => snap.exists() ? normalizeProfile(snap.data() as Record<string, unknown>) : null)
    );
  }

  updateProfile(uid: string, data: Partial<UserProfile>): Observable<void> {
    return this.run(() =>
      updateDoc(this.userRef(uid), { ...data, updatedAt: serverTimestamp() })
    );
  }

  doesProfileExist(uid: string): Observable<boolean> {
    return this.run(() => getDoc(this.userRef(uid))).pipe(map((snap) => snap.exists()));
  }
}
