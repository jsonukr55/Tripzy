import { Injectable, inject, signal, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth        = inject(Auth);
  private router      = inject(Router);
  private userService = inject(UserService);
  private injector    = inject(Injector);

  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal(true);

  constructor() {
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser.set(user);
        this.isLoading.set(false);
      });
    });
  }

  get uid(): string | null {
    return this.currentUser()?.uid ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  signUpWithEmail(email: string, password: string, displayName: string): Observable<void> {
    return from(
      runInInjectionContext(this.injector, () =>
        createUserWithEmailAndPassword(this.auth, email, password)
      ).then(async (cred) => {
        await updateProfile(cred.user, { displayName });
        await this.userService.createProfile(cred.user.uid, {
          uid: cred.user.uid,
          email: cred.user.email!,
          displayName,
          photoURL: null,
        }).toPromise();
      })
    );
  }

  signInWithEmail(email: string, password: string): Observable<void> {
    return from(
      runInInjectionContext(this.injector, () =>
        signInWithEmailAndPassword(this.auth, email, password)
      ).then(() => undefined)
    );
  }

  signInWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(
      runInInjectionContext(this.injector, () =>
        signInWithPopup(this.auth, provider)
      ).then(async (cred) => {
        // Only create profile on first Google sign-in
        const exists = await this.userService.doesProfileExist(cred.user.uid).toPromise();
        if (!exists) {
          await this.userService.createProfile(cred.user.uid, {
            uid: cred.user.uid,
            email: cred.user.email!,
            displayName: cred.user.displayName ?? 'Traveller',
            photoURL: cred.user.photoURL,
          }).toPromise();
        }
      })
    );
  }

  signOut(): Observable<void> {
    return from(runInInjectionContext(this.injector, () => signOut(this.auth))).pipe(
      tap(() => this.router.navigateByUrl('/auth/login'))
    );
  }
}
