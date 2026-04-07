import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RequestService } from '../../../../core/services/request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { Trip } from '../../../../core/models/trip.model';

export interface JoinDialogData { trip: Trip; }

@Component({
  selector: 'app-join-request-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="dialog-wrap">
      <div class="dialog-header">
        <div class="dialog-icon"><mat-icon>flight_takeoff</mat-icon></div>
        <div>
          <h2>Request to Join</h2>
          <p>{{ data.trip.title }}</p>
        </div>
        <button mat-icon-button class="close-btn" (click)="cancel()"><mat-icon>close</mat-icon></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Message to host</mat-label>
          <textarea matInput formControlName="message" rows="4" placeholder="Introduce yourself and why you'd like to join..."></textarea>
          <mat-hint align="end">{{ form.get('message')?.value?.length ?? 0 }}/300</mat-hint>
          @if (form.get('message')?.hasError('required') && form.get('message')?.touched) {
            <mat-error>Please write a short message</mat-error>
          }
          @if (form.get('message')?.hasError('maxlength')) {
            <mat-error>Max 300 characters</mat-error>
          }
        </mat-form-field>
        <div class="dialog-actions">
          <button type="button" mat-stroked-button (click)="cancel()" class="cancel-btn">Cancel</button>
          <button type="submit" class="send-btn" [disabled]="submitting()">
            @if (submitting()) { <mat-spinner diameter="18" /> } @else { <mat-icon>send</mat-icon> }
            {{ submitting() ? 'Sending...' : 'Send Request' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-wrap { padding:28px; width:420px; max-width:100%; }
    .dialog-header { display:flex; align-items:center; gap:14px; margin-bottom:24px; position:relative; }
    .dialog-icon { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .dialog-icon mat-icon { color:#fff; }
    .dialog-header h2 { margin:0; font-size:18px; font-weight:800; color:#0a0f28; }
    .dialog-header p { margin:2px 0 0; font-size:13px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px; }
    .close-btn { position:absolute; right:-8px; top:-8px; color:#94a3b8; }
    .full-width { width:100%; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
    .cancel-btn { border-color:#e2e8f0 !important; color:#475569 !important; }
    .send-btn { display:flex; align-items:center; gap:8px; padding:0 22px; height:42px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(255,107,43,.3); }
    .send-btn:disabled { opacity:.6; cursor:not-allowed; }
  `],
})
export class JoinRequestDialogComponent {
  private fb             = inject(FormBuilder);
  private requestService = inject(RequestService);
  private auth           = inject(AuthService);
  private userService    = inject(UserService);
  private dialogRef      = inject(MatDialogRef<JoinRequestDialogComponent>);
  readonly data: JoinDialogData = inject(MAT_DIALOG_DATA);

  readonly submitting = signal(false);

  form = this.fb.group({
    message: ['', [Validators.required, Validators.maxLength(300)]],
  });

  cancel() { this.dialogRef.close(); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const uid = this.auth.uid!;
    this.submitting.set(true);
    this.userService.getProfile(uid).subscribe((profile) => {
      const trip = this.data.trip;
      this.requestService.sendRequest({
        tripId:            trip.id,
        tripTitle:         trip.title,
        tripCoverImageURL: trip.coverImageURL ?? undefined,
        requesterId:       uid,
        requesterName:     profile?.displayName ?? this.auth.currentUser()?.displayName ?? 'Traveller',
        requesterPhotoURL: profile?.photoURL ?? this.auth.currentUser()?.photoURL ?? undefined,
        hostId:            trip.hostId,
        message:           this.form.value.message!,
      }).subscribe({
        next: () => { this.submitting.set(false); this.dialogRef.close('sent'); },
        error: () => this.submitting.set(false),
      });
    });
  }
}
