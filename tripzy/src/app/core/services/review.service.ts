import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore, Timestamp, collection, addDoc, getDocs,
  query, where, serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Review } from '../models/review.model';
import { UserService } from './user.service';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function normalize(data: Record<string, unknown>, id: string): Review {
  return { ...data, id, createdAt: toDate(data['createdAt']) } as Review;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private firestore = inject(Firestore);
  private injector  = inject(Injector);
  private userSvc   = inject(UserService);

  private col() { return collection(this.firestore, 'reviews'); }

  private run<T>(fn: () => Promise<T>): Observable<T> {
    return from(runInInjectionContext(this.injector, fn));
  }

  submitReview(data: Omit<Review, 'id' | 'createdAt'>): Observable<string> {
    return this.run(() =>
      addDoc(this.col(), { ...data, createdAt: serverTimestamp() })
    ).pipe(
      map(ref => ref.id),
      switchMap(id =>
        this.getReviewsForUser(data.targetId).pipe(
          switchMap(reviews => {
            const avg = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
            return this.userSvc.updateProfile(data.targetId, {
              rating: Math.round(avg * 10) / 10,
              reviewCount: reviews.length,
            }).pipe(map(() => id));
          })
        )
      )
    );
  }

  getReviewsForUser(targetId: string): Observable<Review[]> {
    const q = query(this.col(), where('targetId', '==', targetId));
    return this.run(() => getDocs(q)).pipe(
      map(snap => snap.docs
        .map(d => normalize(d.data() as Record<string, unknown>, d.id))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      )
    );
  }

  hasReviewed(reviewerId: string, targetId: string, tripId: string): Observable<boolean> {
    const q = query(
      this.col(),
      where('reviewerId', '==', reviewerId),
      where('targetId', '==', targetId),
      where('tripId', '==', tripId),
    );
    return this.run(() => getDocs(q)).pipe(map(snap => !snap.empty));
  }
}
