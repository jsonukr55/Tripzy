import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';

import { AuthService } from '../../../../core/services/auth.service';
import { TripService } from '../../../../core/services/trip.service';
import { StorageService } from '../../../../core/services/storage.service';
import { Trip, TripType, TransportMode, GenderPreference } from '../../../../core/models/trip.model';

@Component({
  selector: 'app-trip-create',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    DatePipe, DecimalPipe,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatStepperModule,
  ],
  template: `
    <div class="create-page">

      <div class="page-top">
        <a class="back-btn" routerLink="/trips">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <div>
          <h1>Create a Trip</h1>
          <p>Share your adventure — find the right travel companions</p>
        </div>
      </div>

      <div class="create-layout">

        <!-- ── Stepper Form ── -->
        <mat-stepper [linear]="false" orientation="vertical" #stepper class="stepper">

          <!-- Step 1: Basic Info -->
          <mat-step [stepControl]="basicForm" label="Basic Info">
            <form [formGroup]="basicForm" class="step-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Trip Title</mat-label>
                <input matInput formControlName="title" placeholder="e.g. Goa Beach Weekend with Vibes" />
                @if (basicForm.get('title')?.hasError('required') && basicForm.get('title')?.touched) {
                  <mat-error>Title is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="4"
                  placeholder="What's the plan? Who are you looking for?"></textarea>
                <mat-hint align="end">{{ basicForm.get('description')?.value?.length ?? 0 }}/500</mat-hint>
                @if (basicForm.get('description')?.hasError('required') && basicForm.get('description')?.touched) {
                  <mat-error>Description is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Destination</mat-label>
                <input matInput formControlName="destination" placeholder="e.g. Goa, India" />
                <mat-icon matSuffix>location_on</mat-icon>
                @if (basicForm.get('destination')?.hasError('required') && basicForm.get('destination')?.touched) {
                  <mat-error>Destination is required</mat-error>
                }
              </mat-form-field>

              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Trip Type</mat-label>
                  <mat-select formControlName="tripType">
                    <mat-option value="budget">💸 Budget</mat-option>
                    <mat-option value="luxury">💎 Luxury</mat-option>
                    <mat-option value="adventure">🏕️ Adventure</mat-option>
                    <mat-option value="workation">💻 Workation</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Transport</mat-label>
                  <mat-select formControlName="transportMode">
                    <mat-option value="flight">✈️ Flight</mat-option>
                    <mat-option value="train">🚂 Train</mat-option>
                    <mat-option value="bus">🚌 Bus</mat-option>
                    <mat-option value="car">🚗 Car</mat-option>
                    <mat-option value="cruise">🚢 Cruise</mat-option>
                    <mat-option value="mixed">🔀 Mixed</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button class="next-btn" matStepperNext type="button" (click)="basicForm.markAllAsTouched()">
                  Next: Dates & Budget <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Dates & Budget -->
          <mat-step [stepControl]="detailsForm" label="Dates & Budget">
            <form [formGroup]="detailsForm" class="step-form">
              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Start Date</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
                  <mat-datepicker-toggle matSuffix [for]="startPicker" />
                  <mat-datepicker #startPicker />
                  @if (detailsForm.get('startDate')?.hasError('required') && detailsForm.get('startDate')?.touched) {
                    <mat-error>Start date is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
                  <mat-datepicker-toggle matSuffix [for]="endPicker" />
                  <mat-datepicker #endPicker />
                  @if (detailsForm.get('endDate')?.hasError('required') && detailsForm.get('endDate')?.touched) {
                    <mat-error>End date is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Budget per person (₹)</mat-label>
                  <input matInput type="number" formControlName="budget" min="0" />
                  <mat-icon matSuffix>currency_rupee</mat-icon>
                  @if (detailsForm.get('budget')?.hasError('required') && detailsForm.get('budget')?.touched) {
                    <mat-error>Budget is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Max Participants</mat-label>
                  <input matInput type="number" formControlName="maxParticipants" min="2" max="50" />
                  <mat-icon matSuffix>group</mat-icon>
                  @if (detailsForm.get('maxParticipants')?.hasError('required') && detailsForm.get('maxParticipants')?.touched) {
                    <mat-error>Max participants is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Gender Preference</mat-label>
                <mat-select formControlName="genderPreference">
                  <mat-option value="any">👥 Any gender</mat-option>
                  <mat-option value="male">👨 Males only</mat-option>
                  <mat-option value="female">👩 Females only</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="step-actions">
                <button class="back-step-btn" matStepperPrevious type="button">
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button class="next-btn" matStepperNext type="button" (click)="detailsForm.markAllAsTouched()">
                  Next: Cover Image <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Cover Image -->
          <mat-step label="Cover Image (Optional)">
            <div class="step-form">

              <div class="cover-upload-zone" (click)="coverInput.click()" [class.has-image]="coverPreview()">
                @if (coverPreview()) {
                  <img [src]="coverPreview()" class="cover-preview" alt="cover" />
                  <div class="cover-change-overlay">
                    <mat-icon>photo_camera</mat-icon>
                    <span>Change photo</span>
                  </div>
                } @else {
                  <mat-icon class="upload-icon">add_photo_alternate</mat-icon>
                  <p>Click to add a cover photo</p>
                  <span>JPG, PNG · Max 5MB</span>
                }
                <input #coverInput type="file" accept="image/*" class="hidden" (change)="onCoverSelected($event)" />
              </div>

              @if (coverUploading()) {
                <div class="upload-progress">
                  <mat-spinner diameter="20" />
                  <span>Uploading... {{ uploadProgress() }}%</span>
                </div>
              }

              <div class="step-actions">
                <button class="back-step-btn" matStepperPrevious type="button">
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button class="next-btn" matStepperNext type="button">
                  Next: Review <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <!-- Step 4: Review & Submit -->
          <mat-step label="Review & Publish">
            <div class="step-form review-step">

              <div class="review-card">
                @if (coverPreview()) {
                  <img [src]="coverPreview()" class="review-cover" alt="cover" />
                }
                <div class="review-body">
                  <div class="review-row">
                    <span class="review-label">Title</span>
                    <span class="review-val">{{ basicForm.get('title')?.value || '—' }}</span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">Destination</span>
                    <span class="review-val">📍 {{ basicForm.get('destination')?.value || '—' }}</span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">Dates</span>
                    <span class="review-val">
                      {{ detailsForm.get('startDate')?.value | date:'d MMM' }} →
                      {{ detailsForm.get('endDate')?.value | date:'d MMM yyyy' }}
                    </span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">Budget</span>
                    <span class="review-val">₹{{ detailsForm.get('budget')?.value | number }}</span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">Max Group</span>
                    <span class="review-val">{{ detailsForm.get('maxParticipants')?.value }} people</span>
                  </div>
                  <div class="review-row">
                    <span class="review-label">Type</span>
                    <span class="review-val">{{ basicForm.get('tripType')?.value }}</span>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button class="back-step-btn" matStepperPrevious type="button">
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button class="publish-btn" type="button" [disabled]="saving() || coverUploading()" (click)="onSubmit()">
                  @if (saving()) { <mat-spinner diameter="20" /> }
                  @else { <mat-icon>rocket_launch</mat-icon> }
                  {{ saving() ? 'Publishing...' : 'Publish Trip' }}
                </button>
              </div>
            </div>
          </mat-step>

        </mat-stepper>

        <!-- ── Tips sidebar ── -->
        <div class="tips-panel">
          <h3>✨ Tips for a great post</h3>
          <ul>
            <li>Be specific about what kind of co-traveller you're looking for</li>
            <li>Mention accommodation type in the description</li>
            <li>Set a realistic budget — it builds trust</li>
            <li>Add a cover photo to get 3× more requests</li>
            <li>Use a clear, exciting title</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-page { display:flex; flex-direction:column; gap:24px; }

    .page-top { display:flex; align-items:center; gap:14px; }
    .page-top h1 { margin:0; font-size:22px; font-weight:800; color:#0a0f28; }
    .page-top p  { margin:2px 0 0; font-size:13px; color:#64748b; }
    .back-btn {
      width:40px; height:40px; border-radius:10px;
      background:#fff; border:1px solid #e2e8f0;
      display:flex; align-items:center; justify-content:center;
      color:#475569; text-decoration:none; flex-shrink:0;
      mat-icon { font-size:20px; }
      &:hover { background:#f8fafc; }
    }

    .create-layout { display:grid; grid-template-columns:1fr 280px; gap:24px; align-items:start; }

    .stepper {
      background:#fff; border-radius:14px;
      border:1px solid #e2e8f0;
      box-shadow:0 1px 3px rgba(0,0,0,.04);
      padding:8px 0;
    }

    .step-form { display:flex; flex-direction:column; gap:16px; padding:20px 0 8px; }

    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

    /* Step actions */
    .step-actions { display:flex; align-items:center; gap:12px; margin-top:4px; }
    .next-btn {
      display:flex; align-items:center; gap:6px;
      padding:0 20px; height:42px;
      background:linear-gradient(135deg,#ff6b2b,#ff9f1c);
      color:#fff; border:none; border-radius:9px;
      font-size:13.5px; font-weight:700; cursor:pointer;
      box-shadow:0 3px 10px rgba(255,107,43,.3);
      transition:opacity .15s, transform .1s;
      mat-icon { font-size:18px; width:18px; height:18px; }
      &:hover { opacity:.92; transform:translateY(-1px); }
    }
    .back-step-btn {
      display:flex; align-items:center; gap:4px;
      padding:0 14px; height:42px;
      background:#f8fafc; border:1px solid #e2e8f0;
      border-radius:9px; font-size:13.5px; font-weight:600;
      color:#475569; cursor:pointer;
      mat-icon { font-size:18px; width:18px; height:18px; }
      &:hover { background:#f1f5f9; }
    }

    /* Cover upload */
    .cover-upload-zone {
      position:relative; width:100%; height:200px;
      border:2px dashed #e2e8f0; border-radius:12px;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:8px; cursor:pointer; overflow:hidden;
      background:#f8fafc; color:#94a3b8;
      transition:border-color .15s, background .15s;
      .upload-icon { font-size:48px; width:48px; height:48px; color:#cbd5e1; }
      p { font-size:14px; font-weight:600; color:#64748b; margin:0; }
      span { font-size:12px; }
      &:hover { border-color:#ff9f1c; background:#fffaf5; }
      &.has-image { border-style:solid; border-color:#e2e8f0; }
    }
    .cover-preview { width:100%; height:100%; object-fit:cover; display:block; }
    .cover-change-overlay {
      position:absolute; inset:0;
      background:rgba(0,0,0,.4);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:8px; opacity:0; transition:opacity .2s;
      mat-icon { color:#fff; font-size:32px; }
      span { color:#fff; font-size:13px; font-weight:600; }
    }
    .cover-upload-zone.has-image:hover .cover-change-overlay { opacity:1; }
    .hidden { display:none; }
    .upload-progress { display:flex; align-items:center; gap:10px; font-size:13px; color:#64748b; }

    /* Review step */
    .review-card {
      border:1px solid #e2e8f0; border-radius:12px;
      overflow:hidden; background:#f8fafc;
    }
    .review-cover { width:100%; height:160px; object-fit:cover; display:block; }
    .review-body { padding:16px; display:flex; flex-direction:column; gap:10px; }
    .review-row { display:flex; justify-content:space-between; align-items:center; font-size:13.5px; }
    .review-label { color:#94a3b8; font-weight:500; }
    .review-val   { color:#1e293b; font-weight:600; }

    .publish-btn {
      display:flex; align-items:center; gap:8px;
      padding:0 28px; height:46px;
      background:linear-gradient(135deg,#ff6b2b,#ff9f1c);
      color:#fff; border:none; border-radius:10px;
      font-size:15px; font-weight:700; cursor:pointer;
      box-shadow:0 4px 14px rgba(255,107,43,.35);
      transition:opacity .15s, transform .1s;
      mat-icon { font-size:20px; width:20px; height:20px; }
      &:hover:not(:disabled) { opacity:.92; transform:translateY(-1px); }
      &:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; }
    }

    /* Tips sidebar */
    .tips-panel {
      background:#0a0f28; color:rgba(255,255,255,.85);
      border-radius:14px; padding:24px;
      position:sticky; top:20px;
      h3 { margin:0 0 16px; font-size:15px; font-weight:700; color:#fff; }
      ul { margin:0; padding-left:16px; display:flex; flex-direction:column; gap:10px; }
      li { font-size:13px; line-height:1.5; }
    }

    @media (max-width:900px) {
      .create-layout { grid-template-columns:1fr; }
      .tips-panel { position:static; }
      .row-2 { grid-template-columns:1fr; }
    }
  `],
})
export class TripCreateComponent {
  private fb       = inject(FormBuilder);
  private auth     = inject(AuthService);
  private tripSvc  = inject(TripService);
  private storage  = inject(StorageService);
  private router   = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly saving        = signal(false);
  readonly coverUploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly coverPreview  = signal<string | null>(null);
  readonly coverURL      = signal<string | null>(null);

  basicForm = this.fb.group({
    title:         ['', [Validators.required, Validators.minLength(6)]],
    description:   ['', [Validators.required, Validators.maxLength(500)]],
    destination:   ['', Validators.required],
    tripType:      ['adventure', Validators.required],
    transportMode: ['mixed', Validators.required],
  });

  detailsForm = this.fb.group({
    startDate:       [null as Date | null, Validators.required],
    endDate:         [null as Date | null, Validators.required],
    budget:          [null as number | null, [Validators.required, Validators.min(0)]],
    maxParticipants: [4, [Validators.required, Validators.min(2), Validators.max(50)]],
    genderPreference:['any', Validators.required],
  });

  onCoverSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.snackBar.open('Max 5MB', 'OK', { duration: 2000 }); return; }

    const reader = new FileReader();
    reader.onload = (e) => this.coverPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    const uid  = this.auth.uid!;
    const path = this.storage.getTripImagePath('temp_' + uid, 'cover_' + Date.now() + '.' + file.name.split('.').pop());
    this.coverUploading.set(true);

    this.storage.uploadFile(path, file).subscribe({
      next: (p) => {
        this.uploadProgress.set(Math.round(p.progress));
        if (p.downloadURL) { this.coverURL.set(p.downloadURL); this.coverUploading.set(false); }
      },
      error: () => { this.snackBar.open('Upload failed', 'Dismiss', { duration: 3000 }); this.coverUploading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.basicForm.invalid || this.detailsForm.invalid) {
      this.basicForm.markAllAsTouched();
      this.detailsForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields', 'OK', { duration: 3000 });
      return;
    }

    const user = this.auth.currentUser()!;
    const b    = this.basicForm.value;
    const d    = this.detailsForm.value;

    const destination = b.destination!;
    const keywords    = destination.toLowerCase().split(/[\s,]+/).filter(Boolean);

    this.saving.set(true);

    const tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
      hostId:      user.uid,
      hostName:    user.displayName ?? 'Traveller',
      hostPhotoURL:user.photoURL,
      title:       b.title!,
      description: b.description!,
      destination,
      destinationKeywords: keywords,
      startDate:   d.startDate!,
      endDate:     d.endDate!,
      budget:      d.budget!,
      currency:    'INR',
      transportMode: b.transportMode as any,
      tripType:    b.tripType as any,
      genderPreference: d.genderPreference as any,
      maxParticipants:  d.maxParticipants!,
      currentParticipants: 1,
      participantIds: [user.uid],
      coverImageURL: this.coverURL(),
      imageURLs:   [],
      itinerary:   [],
      status:      'open',
    };

    this.tripSvc.createTrip(tripData).subscribe({
      next: (id) => {
        this.snackBar.open('Trip published!', undefined, { duration: 2500 });
        this.router.navigateByUrl('/trips/' + id);
      },
      error: () => { this.snackBar.open('Failed to publish. Try again.', 'Dismiss', { duration: 3000 }); this.saving.set(false); },
    });
  }
}
