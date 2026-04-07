import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TripService } from '../../../../core/services/trip.service';

export interface SetCostDialogData {
  tripId: string;
  currentCost: number | null;
  currency: string;
  paymentEnabled: boolean;
}

@Component({
  selector: 'app-set-cost-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="dialog-wrap">
      <div class="dialog-header">
        <div class="dialog-icon"><mat-icon>payments</mat-icon></div>
        <div>
          <h2>Trip Cost Settings</h2>
          <p>Set per-person cost &amp; enable payment tracking</p>
        </div>
        <button mat-icon-button class="close-btn" (click)="cancel()"><mat-icon>close</mat-icon></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">

        <div class="toggle-row" (click)="togglePayment()">
          <div class="toggle-label">
            <mat-icon>track_changes</mat-icon>
            <div>
              <strong>Enable payment tracking</strong>
              <span>Show payment status to host and participants</span>
            </div>
          </div>
          <div class="custom-toggle" [class.custom-toggle--on]="form.get('paymentEnabled')?.value">
            <div class="toggle-knob"></div>
          </div>
        </div>

        @if (form.get('paymentEnabled')?.value) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cost per person ({{ data.currency }})</mat-label>
            <mat-icon matPrefix>currency_rupee</mat-icon>
            <input matInput type="number" formControlName="costPerPerson" min="0" step="1" />
            @if (form.get('costPerPerson')?.hasError('required') && form.get('costPerPerson')?.touched) {
              <mat-error>Enter the amount each person owes</mat-error>
            }
            @if (form.get('costPerPerson')?.hasError('min')) {
              <mat-error>Amount must be 0 or more</mat-error>
            }
          </mat-form-field>
        }

        <div class="dialog-actions">
          <button type="button" mat-stroked-button (click)="cancel()" class="cancel-btn">Cancel</button>
          <button type="submit" class="save-btn" [disabled]="saving()">
            @if (saving()) { <mat-spinner diameter="18" /> } @else { <mat-icon>save</mat-icon> }
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-wrap { padding:28px; width:420px; max-width:100%; }
    .dialog-header { display:flex; align-items:center; gap:14px; margin-bottom:24px; position:relative; }
    .dialog-icon { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); display:flex; align-items:center; justify-content:center; flex-shrink:0; mat-icon { color:#fff; } }
    .dialog-header h2 { margin:0; font-size:18px; font-weight:800; color:#0a0f28; }
    .dialog-header p  { margin:2px 0 0; font-size:13px; color:#64748b; }
    .close-btn { position:absolute; right:-8px; top:-8px; color:#94a3b8; }

    .toggle-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px; cursor:pointer; user-select:none; }
    .toggle-row:hover { background:#f1f5f9; }
    .toggle-label { display:flex; align-items:center; gap:10px; mat-icon { color:#ff6b2b; flex-shrink:0; } }
    .toggle-label div { display:flex; flex-direction:column; }
    .toggle-label strong { font-size:13.5px; font-weight:700; color:#0a0f28; }
    .toggle-label span   { font-size:12px; color:#64748b; }

    .custom-toggle { width:44px; height:24px; border-radius:12px; background:#cbd5e1; position:relative; transition:background .2s; flex-shrink:0; }
    .custom-toggle--on { background:linear-gradient(135deg,#ff6b2b,#ff9f1c); }
    .toggle-knob { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2); transition:transform .2s; }
    .custom-toggle--on .toggle-knob { transform:translateX(20px); }

    .full-width { width:100%; margin-bottom:4px; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
    .cancel-btn { border-color:#e2e8f0 !important; color:#475569 !important; }
    .save-btn { display:flex; align-items:center; gap:8px; padding:0 22px; height:42px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(255,107,43,.3); }
    .save-btn:disabled { opacity:.6; cursor:not-allowed; }
  `],
})
export class SetCostDialogComponent {
  private fb         = inject(FormBuilder);
  private tripSvc    = inject(TripService);
  private dialogRef  = inject(MatDialogRef<SetCostDialogComponent>);
  readonly data: SetCostDialogData = inject(MAT_DIALOG_DATA);

  readonly saving = signal(false);

  form = this.fb.group({
    paymentEnabled: [this.data.paymentEnabled],
    costPerPerson:  [this.data.currentCost ?? null, [Validators.min(0)]],
  });

  togglePayment(): void {
    const ctrl = this.form.get('paymentEnabled');
    ctrl?.setValue(!ctrl.value);
  }

  cancel() { this.dialogRef.close(); }

  save(): void {
    if (this.form.get('paymentEnabled')?.value && !this.form.get('costPerPerson')?.value) {
      this.form.get('costPerPerson')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const paymentEnabled = !!this.form.value.paymentEnabled;
    const costPerPerson  = this.form.value.costPerPerson ?? 0;
    this.tripSvc.updateTrip(this.data.tripId, { paymentEnabled, costPerPerson } as Record<string, unknown>).subscribe({
      next: () => { this.saving.set(false); this.dialogRef.close('saved'); },
      error: () => this.saving.set(false),
    });
  }
}
