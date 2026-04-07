import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TripService } from '../../../../core/services/trip.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Trip } from '../../../../core/models/trip.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-trip-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    LoadingSpinnerComponent,
  ],
  template: `
    @if (pageLoading()) {
      <app-loading-spinner message="Loading trip..." />
    } @else {
      <div class="edit-page">
        <div class="page-top">
          <a class="back-btn" [routerLink]="['/trips', tripId]">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <div>
            <h1>Edit Trip</h1>
            <p>Update your trip details</p>
          </div>
        </div>

        <div class="card form-card">
          <form [formGroup]="form" (ngSubmit)="onSave()">

            <section class="form-section">
              <h3>Basic Info</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Trip Title</mat-label>
                <input matInput formControlName="title" />
                @if (f['title'].hasError('required') && f['title'].touched) { <mat-error>Required</mat-error> }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="4"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Destination</mat-label>
                <input matInput formControlName="destination" />
                <mat-icon matSuffix>location_on</mat-icon>
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
            </section>

            <section class="form-section">
              <h3>Dates & Budget</h3>
              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Start Date</mat-label>
                  <input matInput [matDatepicker]="sp" formControlName="startDate" />
                  <mat-datepicker-toggle matSuffix [for]="sp" /><mat-datepicker #sp />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="ep" formControlName="endDate" />
                  <mat-datepicker-toggle matSuffix [for]="ep" /><mat-datepicker #ep />
                </mat-form-field>
              </div>
              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Budget per person (₹)</mat-label>
                  <input matInput type="number" formControlName="budget" />
                  <mat-icon matSuffix>currency_rupee</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Max Participants</mat-label>
                  <input matInput type="number" formControlName="maxParticipants" />
                  <mat-icon matSuffix>group</mat-icon>
                </mat-form-field>
              </div>
              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Gender Preference</mat-label>
                  <mat-select formControlName="genderPreference">
                    <mat-option value="any">👥 Any gender</mat-option>
                    <mat-option value="male">👨 Males only</mat-option>
                    <mat-option value="female">👩 Females only</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Trip Status</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="open">Open</mat-option>
                    <mat-option value="full">Full</mat-option>
                    <mat-option value="completed">Completed</mat-option>
                    <mat-option value="cancelled">Cancelled</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </section>

            <div class="form-actions">
              <a mat-stroked-button [routerLink]="['/trips', tripId]" class="cancel-btn">Cancel</a>
              <button class="save-btn" type="submit" [disabled]="saving()">
                @if (saving()) { <mat-spinner diameter="18" /> } @else { <mat-icon>check</mat-icon> }
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .edit-page { display:flex; flex-direction:column; gap:24px; }
    .page-top { display:flex; align-items:center; gap:14px; }
    .page-top h1 { margin:0; font-size:22px; font-weight:800; color:#0a0f28; }
    .page-top p  { margin:2px 0 0; font-size:13px; color:#64748b; }
    .back-btn { width:40px; height:40px; border-radius:10px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#475569; text-decoration:none; flex-shrink:0; mat-icon{font-size:20px;} &:hover{background:#f8fafc;} }
    .card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .form-card { padding:28px; }
    form { display:flex; flex-direction:column; gap:28px; }
    .form-section { display:flex; flex-direction:column; gap:14px; h3{margin:0;font-size:15px;font-weight:700;color:#0a0f28;} }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .form-actions { display:flex; align-items:center; justify-content:flex-end; gap:12px; padding-top:8px; border-top:1px solid #f1f5f9; }
    .cancel-btn { border-color:#e2e8f0 !important; color:#475569 !important; font-weight:600 !important; }
    .save-btn { display:flex; align-items:center; gap:8px; padding:0 24px; height:44px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(255,107,43,.3); transition:opacity .15s; mat-icon{font-size:18px;width:18px;height:18px;} &:hover:not(:disabled){opacity:.92;} &:disabled{opacity:.6;cursor:not-allowed;box-shadow:none;} }
    @media (max-width:640px) { .row-2 { grid-template-columns:1fr; } }
  `],
})
export class TripEditComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private route    = inject(ActivatedRoute);
  private tripSvc  = inject(TripService);
  private auth     = inject(AuthService);
  private router   = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly pageLoading = signal(true);
  readonly saving      = signal(false);
  tripId = '';

  form = this.fb.group({
    title:           ['', Validators.required],
    description:     ['', Validators.required],
    destination:     ['', Validators.required],
    tripType:        ['adventure'],
    transportMode:   ['mixed'],
    startDate:       [null as Date | null, Validators.required],
    endDate:         [null as Date | null, Validators.required],
    budget:          [null as number | null, Validators.required],
    maxParticipants: [4],
    genderPreference:['any'],
    status:          ['open'],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    this.tripSvc.getTripDoc(this.tripId).subscribe((trip) => {
      if (trip) {
        this.form.patchValue({
          title: trip.title, description: trip.description,
          destination: trip.destination, tripType: trip.tripType,
          transportMode: trip.transportMode, startDate: trip.startDate,
          endDate: trip.endDate, budget: trip.budget,
          maxParticipants: trip.maxParticipants,
          genderPreference: trip.genderPreference, status: trip.status,
        });
      }
      this.pageLoading.set(false);
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const dest = v.destination!;
    const keywords = dest.toLowerCase().split(/[\s,]+/).filter(Boolean);
    this.tripSvc.updateTrip(this.tripId, {
      title: v.title!, description: v.description!,
      destination: dest, destinationKeywords: keywords,
      tripType: v.tripType as any, transportMode: v.transportMode as any,
      startDate: v.startDate!, endDate: v.endDate!,
      budget: v.budget!, maxParticipants: v.maxParticipants!,
      genderPreference: v.genderPreference as any, status: v.status as any,
    }).subscribe({
      next: () => { this.snackBar.open('Trip updated!', undefined, { duration: 2500 }); this.saving.set(false); this.router.navigateByUrl('/trips/' + this.tripId); },
      error: () => { this.snackBar.open('Update failed.', 'Dismiss', { duration: 3000 }); this.saving.set(false); },
    });
  }
}
