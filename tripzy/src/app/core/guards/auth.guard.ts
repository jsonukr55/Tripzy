import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Firebase restores session async — wait until isLoading is false
  if (!auth.isLoading()) {
    return auth.isLoggedIn ? true : router.createUrlTree(['/auth/login']);
  }

  return toObservable(auth.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => (auth.isLoggedIn ? true : router.createUrlTree(['/auth/login']))),
  );
};
