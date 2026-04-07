import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/** Redirects authenticated users away from auth pages */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for Firebase to restore session before deciding
  if (!auth.isLoading()) {
    return auth.isLoggedIn ? router.createUrlTree(['/trips']) : true;
  }

  return toObservable(auth.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => (auth.isLoggedIn ? router.createUrlTree(['/trips']) : true)),
  );
};
