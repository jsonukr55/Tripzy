import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { AuthCardComponent } from '../../components/auth-card/auth-card.component';
import { getAuthErrorMessage } from '../../utils/auth-error.util';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const pw = control.get('password');
  const cf = control.get('confirmPassword');
  if (!pw || !cf) return null;
  return pw.value !== cf.value ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthCardComponent,
  ],
  template: `
    <app-auth-card title="Create your account" subtitle="Start your journey with Tripzy — it's free">

      @if (errorMessage()) {
        <div class="err-box">
          <mat-icon>error_outline</mat-icon>
          {{ errorMessage() }}
        </div>
      }

      <!-- Google first -->
      <button class="google-btn" [disabled]="loading()" (click)="onGoogleSignIn()">
        @if (googleLoading()) {
          <mat-spinner diameter="18" />
        } @else {
          <img src="assets/google-logo.svg" alt="" />
        }
        Sign up with Google
      </button>

      <div class="or-divider"><span>or use your email</span></div>

      <form [formGroup]="form" (ngSubmit)="onRegister()">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Full name</mat-label>
          <input matInput formControlName="displayName" autocomplete="name" />
          @if (f['displayName'].hasError('required') && f['displayName'].touched) {
            <mat-error>Name is required</mat-error>
          } @else if (f['displayName'].hasError('minlength') && f['displayName'].touched) {
            <mat-error>At least 2 characters</mat-error>
          }
        </mat-form-field>

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
            autocomplete="new-password"
          />
          <button mat-icon-button matSuffix type="button"
            (click)="showPwd.set(!showPwd())">
            <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (f['password'].hasError('required') && f['password'].touched) {
            <mat-error>Password is required</mat-error>
          } @else if (f['password'].hasError('minlength') && f['password'].touched) {
            <mat-error>Minimum 6 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm password</mat-label>
          <input
            matInput
            [type]="showPwd() ? 'text' : 'password'"
            formControlName="confirmPassword"
            autocomplete="new-password"
          />
          <mat-icon matSuffix>lock</mat-icon>
          @if (f['confirmPassword'].touched && form.hasError('passwordMismatch')) {
            <mat-error>Passwords don't match</mat-error>
          }
        </mat-form-field>

        <!-- Strength meter -->
        <div class="strength-row">
          <div class="strength-bar">
            <div class="bar" [class.active]="pwLen >= 1"></div>
            <div class="bar" [class.active]="pwLen >= 4"></div>
            <div class="bar" [class.active]="pwLen >= 6"></div>
            <div class="bar" [class.active]="pwLen >= 8"></div>
          </div>
          <span class="strength-label">{{ strengthLabel }}</span>
        </div>

        <button class="primary-btn" type="submit" [disabled]="loading()">
          @if (emailLoading()) {
            <mat-spinner diameter="20" />
          } @else {
            Create Account
          }
        </button>
      </form>

      <p class="terms">
        By creating an account you agree to our
        <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
      </p>

      <p class="switch-link">
        Already on Tripzy? <a routerLink="/auth/login">Sign in →</a>
      </p>

    </app-auth-card>
  `,
  styles: [`
    .err-box {
      display: flex; align-items: center; gap: 8px;
      background: #fff0f0; color: #c0392b;
      border: 1px solid #f5c6cb; border-radius: 8px;
      padding: 11px 14px; font-size: 13.5px; margin-bottom: 20px;
      mat-icon { font-size: 17px; width:17px; height:17px; flex-shrink:0; }
    }

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

    .or-divider {
      display: flex; align-items: center; gap: 10px;
      margin: 22px 0 20px; color: #94a3b8; font-size: 12.5px;
      &::before, &::after {
        content: ''; flex: 1; height: 1px; background: #e2e8f0;
      }
    }

    form { display: flex; flex-direction: column; gap: 2px; }

    /* Strength meter */
    .strength-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; margin: 2px 0 10px;
    }
    .strength-bar { display: flex; gap: 4px; flex: 1; }
    .bar {
      flex: 1; height: 4px; border-radius: 2px;
      background: #e2e8f0; transition: background .2s;
      &.active { background: #ff6b2b; }
    }
    .strength-label { font-size: 11px; color: #94a3b8; white-space: nowrap; }

    .primary-btn {
      width: 100%; height: 50px; margin-top: 4px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: linear-gradient(135deg, #ff6b2b 0%, #ff9f1c 100%);
      color: #fff; border: none; border-radius: 10px;
      font-size: 15px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 14px rgba(255,107,43,.35);
      transition: opacity .15s, transform .1s, box-shadow .15s;
      &:hover:not(:disabled) {
        opacity: .93;
        box-shadow: 0 6px 20px rgba(255,107,43,.45);
        transform: translateY(-1px);
      }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
    }

    .terms {
      text-align: center; font-size: 11.5px;
      color: #94a3b8; margin: 14px 0 0; line-height: 1.5;
      a { color: #64748b; }
    }

    .switch-link {
      text-align: center; font-size: 13.5px;
      color: #64748b; margin: 14px 0 0;
      a { color: #ff6b2b; font-weight: 600; text-decoration: none; }
      a:hover { text-decoration: underline; }
    }
  `],
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  readonly loading       = signal(false);
  readonly emailLoading  = signal(false);
  readonly googleLoading = signal(false);
  readonly errorMessage  = signal('');
  readonly showPwd       = signal(false);

  form = this.fb.group(
    {
      displayName:     ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  get f() { return this.form.controls; }
  get pwLen(): number { return this.form.get('password')?.value?.length ?? 0; }
  get strengthLabel(): string {
    if (this.pwLen === 0) return '';
    if (this.pwLen < 4)  return 'Weak';
    if (this.pwLen < 6)  return 'Fair';
    if (this.pwLen < 8)  return 'Good';
    return 'Strong';
  }

  onRegister(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.emailLoading.set(true);
    this.errorMessage.set('');

    const { email, password, displayName } = this.form.value;
    this.auth.signUpWithEmail(email!, password!, displayName!).subscribe({
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
