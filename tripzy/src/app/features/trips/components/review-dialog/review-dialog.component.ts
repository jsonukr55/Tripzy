import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ReviewTarget } from '../../../../core/models/review.model';

export interface ReviewDialogData {
  tripId: string;
  targetId: string;
  targetName: string;
  targetPhotoURL: string | null;
  targetType: ReviewTarget;
}

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="dialog-wrap">
      <div class="dialog-header">
        <div class="target-avatar">
          @if (data.targetPhotoURL) {
            <img [src]="data.targetPhotoURL" [alt]="data.targetName" />
          } @else {
            <span>{{ data.targetName[0].toUpperCase() }}</span>
          }
        </div>
        <div>
          <h2>Rate {{ data.targetName }}</h2>
          <p>{{ data.targetType === 'host' ? 'Trip host' : 'Fellow traveller' }}</p>
        </div>
        <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Star rating -->
      <div class="stars-row">
        @for (star of [1,2,3,4,5]; track star) {
          <button class="star-btn" (click)="setRating(star)" type="button">
            <mat-icon [class.filled]="star <= selectedRating()">
              {{ star <= selectedRating() ? 'star' : 'star_border' }}
            </mat-icon>
          </button>
        }
      </div>
      <p class="rating-label">{{ ratingLabel() }}</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Your review</mat-label>
          <textarea matInput formControlName="comment" rows="4"
            placeholder="Share your experience..."></textarea>
          @if (form.get('comment')?.hasError('required') && form.get('comment')?.touched) {
            <mat-error>Please write a short review</mat-error>
          }
          @if (form.get('comment')?.hasError('maxlength')) {
            <mat-error>Max 400 characters</mat-error>
          }
        </mat-form-field>

        <div class="dialog-actions">
          <button type="button" mat-stroked-button (click)="dialogRef.close()">Cancel</button>
          <button type="submit" class="submit-btn" [disabled]="submitting() || selectedRating() === 0">
            @if (submitting()) { <mat-spinner diameter="18" /> } @else { <mat-icon>send</mat-icon> }
            {{ submitting() ? 'Submitting...' : 'Submit Review' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-wrap { padding:28px; width:420px; max-width:100%; }
    .dialog-header { display:flex; align-items:center; gap:14px; margin-bottom:20px; position:relative; }
    .target-avatar { width:52px; height:52px; border-radius:50%; overflow:hidden; flex-shrink:0; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; color:#fff; }
    .target-avatar img { width:100%; height:100%; object-fit:cover; }
    .dialog-header h2 { margin:0; font-size:18px; font-weight:800; color:#0a0f28; }
    .dialog-header p { margin:2px 0 0; font-size:13px; color:#64748b; }
    .close-btn { position:absolute; right:-8px; top:-8px; color:#94a3b8; }
    .stars-row { display:flex; justify-content:center; gap:8px; margin:4px 0 8px; }
    .star-btn { background:none; border:none; cursor:pointer; padding:4px; }
    .star-btn mat-icon { font-size:36px; width:36px; height:36px; color:#e2e8f0; transition:color .15s; }
    .star-btn mat-icon.filled { color:#ff9f1c; }
    .star-btn:hover mat-icon { color:#ff9f1c; }
    .rating-label { text-align:center; font-size:13px; font-weight:600; color:#64748b; margin:0 0 16px; min-height:20px; }
    .full-width { width:100%; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
    .submit-btn { display:flex; align-items:center; gap:8px; padding:0 22px; height:42px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(255,107,43,.3); }
    .submit-btn:disabled { opacity:.6; cursor:not-allowed; }
  `],
})
export class ReviewDialogComponent {
  private fb            = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  private auth          = inject(AuthService);
  readonly dialogRef    = inject(MatDialogRef<ReviewDialogComponent>);
  readonly data: ReviewDialogData = inject(MAT_DIALOG_DATA);

  readonly submitting    = signal(false);
  readonly selectedRating = signal(0);

  form = this.fb.group({
    comment: ['', [Validators.required, Validators.maxLength(400)]],
  });

  setRating(r: number): void { this.selectedRating.set(r); }

  ratingLabel(): string {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    return labels[this.selectedRating()] ?? '';
  }

  submit(): void {
    if (this.form.invalid || this.selectedRating() === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const me = this.auth.currentUser();
    if (!me) return;
    this.submitting.set(true);
    this.reviewService.submitReview({
      tripId:           this.data.tripId,
      reviewerId:       me.uid,
      reviewerName:     me.displayName ?? 'Traveller',
      reviewerPhotoURL: me.photoURL ?? null,
      targetId:         this.data.targetId,
      targetType:       this.data.targetType,
      rating:           this.selectedRating(),
      comment:          this.form.value.comment!,
    }).subscribe({
      next: () => { this.submitting.set(false); this.dialogRef.close('submitted'); },
      error: () => { this.submitting.set(false); },
    });
  }
}
