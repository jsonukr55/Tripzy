import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../../core/services/auth.service';
import { AuthCardComponent } from '../../components/auth-card/auth-card.component';
import { getAuthErrorMessage } from '../../utils/auth-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    AuthCardComponent,
  ],
  template: `
    <app-auth-card title="Welcome back" subtitle="Sign in to continue your journey">

      @if (errorMessage()) {
        <div class="err-box">
          <mat-icon>error_outline</mat-icon>
          {{ errorMessage() }}
        </div>
      }

      <!-- Google first (primary social action) -->
      <button class="google-btn" [disabled]="loading()" (click)="onGoogleSignIn()">
        @if (googleLoading()) {
          <mat-spinner diameter="18" />
        } @else {
          <img src="assets/google-logo.svg" alt="" />
        }
        Continue with Google
      </button>

      <div class="or-divider"><span>or sign in with email</span></div>

      <form [formGroup]="form" (ngSubmit)="onEmailSignIn()">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email address</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (f['email'].hasError('required') && f['email'].touched) {
            <mat-error>Email is required</mat-error>
          } @else if (f['email'].hasError('email') && f['email'].touched) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input
            matInput
            [type]="showPwd() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password"
          />
          <button mat-icon-button matSuffix type="button"
            (click)="showPwd.set(!showPwd())">
            <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (f['password'].hasError('required') && f['password'].touched) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>

        <button class="primary-btn" type="submit" [disabled]="loading()">
          @if (emailLoading()) {
            <mat-spinner diameter="20" />
          } @else {
            Sign In
          }
        </button>
      </form>

      <p class="switch-link">
        New to Tripzy? <a routerLink="/auth/register">Create a free account →</a>
      </p>

    </app-auth-card>
  `,
  styles: [`
    .err-box {
      display: flex; align-items: center; gap: 8px;
      background: #fff0f0; color: #c0392b;
      border: 1px solid #f5c6cb;
      border-radius: 8px; padding: 11px 14px;
      font-size: 13.5px; margin-bottom: 20px;
      mat-icon { font-size: 17px; width:17px; height:17px; flex-shrink:0; }
    }

    /* Google button */
    .google-btn {
      width: 100%; height: 48px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: #fff; border: 1.5px solid #e2e8f0;
      border-radius: 10px; cursor: pointer;
      font-size: 14.5px; font-weight: 600; color: #1e293b;
      transition: border-color .15s, box-shadow .15s, background .15s;
      img { width: 20px; height: 20px; }
      &:hover:not(:disabled) {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0,0,0,.08);
        background: #fafafa;
      }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }

    /* Divider */
    .or-divider {
      display: flex; align-items: center; gap: 10px;
      margin: 22px 0 20px; color: #94a3b8; font-size: 12.5px;
      &::before, &::after {
        content: ''; flex: 1; height: 1px; background: #e2e8f0;
      }
    }

    /* Form spacing */
    form { display: flex; flex-direction: column; gap: 2px; }

    /* Primary CTA */
    .primary-btn {
      width: 100%; height: 50px; margin-top: 6px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: linear-gradient(135deg, #ff6b2b 0%, #ff9f1c 100%);
      color: #fff; border: none; border-radius: 10px;
      font-size: 15px; font-weight: 700; cursor: pointer;
      letter-spacing: 0.2px;
      transition: opacity .15s, transform .1s, box-shadow .15s;
      box-shadow: 0 4px 14px rgba(255,107,43,.35);
      &:hover:not(:disabled) {
        opacity: .93;
        box-shadow: 0 6px 20px rgba(255,107,43,.45);
        transform: translateY(-1px);
      }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
    }

    /* Footer link */
    .switch-link {
      text-align: center; font-size: 13.5px;
      color: #64748b; margin: 22px 0 0;
      a { color: #ff6b2b; font-weight: 600; text-decoration: none; }
      a:hover { text-decoration: underline; }
    }
  `],
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  readonly loading      = signal(false);
  readonly emailLoading = signal(false);
  readonly googleLoading= signal(false);
  readonly errorMessage = signal('');
  readonly showPwd      = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get f() { return this.form.controls; }

  onEmailSignIn(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.emailLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.value;
    this.auth.signInWithEmail(email!, password!).subscribe({
      next: () => this.router.navigateByUrl('/trips'),
      error: (err) => {
        this.errorMessage.set(getAuthErrorMessage(err.code));
        this.loading.set(false);
        this.emailLoading.set(false);
      },
    });
  }

  onGoogleSignIn(): void {
    this.loading.set(true);
    this.googleLoading.set(true);
    this.errorMessage.set('');

    this.auth.signInWithGoogle().subscribe({
      next: () => this.router.navigateByUrl('/trips'),
      error: (err) => {
        this.errorMessage.set(getAuthErrorMessage(err.code));
        this.loading.set(false);
        this.googleLoading.set(false);
      },
    });
  }
}
