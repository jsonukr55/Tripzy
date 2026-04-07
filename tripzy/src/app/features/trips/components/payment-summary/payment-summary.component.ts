import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentService } from '../../../../core/services/payment.service';
import { TripPayment } from '../../../../core/models/payment.model';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="pay-card">
      <div class="pay-header">
        <mat-icon>payments</mat-icon>
        <h3>Payment Tracking</h3>
      </div>

      @if (loading()) {
        <div class="pay-loading">Loading payments...</div>
      } @else {
        <!-- Progress bar -->
        <div class="pay-progress">
          <div class="pay-amounts">
            <span class="pay-collected">{{ currency }} {{ collected() | number }} collected</span>
            <span class="pay-total">of {{ currency }} {{ expected() | number }}</span>
          </div>
          <div class="pay-track">
            <div class="pay-fill" [style.width.%]="progressPct()"></div>
          </div>
          <div class="pay-counts">
            <span class="chip chip-paid"><mat-icon>check_circle</mat-icon> {{ paidCount() }} paid</span>
            <span class="chip chip-unpaid"><mat-icon>schedule</mat-icon> {{ unpaidCount() }} pending</span>
          </div>
        </div>

        <!-- Participant rows -->
        @if (payments().length === 0) {
          <p class="no-pay">No participants with payment records yet.</p>
        } @else {
          <div class="pay-list">
            @for (p of payments(); track p.userId) {
              <div class="pay-row">
                <div class="pay-avatar">
                  @if (p.userPhotoURL) {
                    <img [src]="p.userPhotoURL" [alt]="p.userName" />
                  } @else {
                    <span>{{ p.userName[0].toUpperCase() }}</span>
                  }
                </div>
                <div class="pay-info">
                  <span class="pay-name">{{ p.userName }}</span>
                  <span class="pay-amount">{{ currency }} {{ p.amountDue | number }}</span>
                </div>
                <div class="pay-right">
                  @if (p.status === 'paid') {
                    <span class="status-paid"><mat-icon>check_circle</mat-icon> Paid</span>
                    @if (isHost) {
                      <button class="undo-btn" (click)="undoPaid(p)" [disabled]="processingId() === p.userId">
                        <mat-icon>undo</mat-icon>
                      </button>
                    }
                  } @else {
                    @if (isHost) {
                      <button class="mark-btn" (click)="markPaid(p, true)" [disabled]="processingId() === p.userId">
                        <mat-icon>check</mat-icon> Mark Paid
                      </button>
                    } @else if (p.userId === myUid) {
                      <button class="mark-btn" (click)="markPaid(p, false)" [disabled]="processingId() === p.userId">
                        <mat-icon>payment</mat-icon> I Paid
                      </button>
                    } @else {
                      <span class="status-unpaid"><mat-icon>schedule</mat-icon> Pending</span>
                    }
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pay-card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:20px 22px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .pay-header { display:flex; align-items:center; gap:8px; margin-bottom:16px; mat-icon { color:#ff6b2b; } h3 { margin:0; font-size:15px; font-weight:700; color:#0a0f28; } }
    .pay-loading { font-size:13px; color:#94a3b8; padding:8px 0; }

    .pay-progress { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .pay-amounts { display:flex; justify-content:space-between; align-items:baseline; }
    .pay-collected { font-size:16px; font-weight:800; color:#0a0f28; }
    .pay-total { font-size:12px; color:#94a3b8; }
    .pay-track { height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .pay-fill { height:100%; background:linear-gradient(90deg,#22c55e,#16a34a); border-radius:4px; transition:width .4s; }
    .pay-counts { display:flex; gap:8px; flex-wrap:wrap; }

    .chip { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:600; mat-icon { font-size:13px; width:13px; height:13px; } }
    .chip-paid   { background:#f0fdf4; color:#15803d; }
    .chip-unpaid { background:#fff7ed; color:#c2410c; }

    .no-pay { font-size:13px; color:#94a3b8; margin:0; }
    .pay-list { display:flex; flex-direction:column; gap:10px; }
    .pay-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-top:1px solid #f1f5f9; }
    .pay-avatar { width:36px; height:36px; border-radius:50%; overflow:hidden; flex-shrink:0; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; img { width:100%; height:100%; object-fit:cover; } }
    .pay-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
    .pay-name   { font-size:13px; font-weight:700; color:#0a0f28; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pay-amount { font-size:11.5px; color:#64748b; }
    .pay-right { display:flex; align-items:center; gap:6px; flex-shrink:0; }

    .status-paid   { display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:#15803d; mat-icon { font-size:14px; width:14px; height:14px; } }
    .status-unpaid { display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:#c2410c; mat-icon { font-size:14px; width:14px; height:14px; } }

    .mark-btn { display:flex; align-items:center; gap:4px; padding:5px 12px; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; mat-icon { font-size:14px; width:14px; height:14px; } &:disabled { opacity:.5; cursor:not-allowed; } }
    .undo-btn  { display:flex; align-items:center; justify-content:center; width:28px; height:28px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; color:#64748b; mat-icon { font-size:16px; } &:hover { background:#e2e8f0; } &:disabled { opacity:.5; cursor:not-allowed; } }
  `],
})
export class PaymentSummaryComponent implements OnInit {
  @Input() tripId!: string;
  @Input() costPerPerson!: number;
  @Input() currency!: string;
  @Input() isHost!: boolean;
  @Input() myUid!: string;

  private paymentSvc = inject(PaymentService);
  private snackBar   = inject(MatSnackBar);

  readonly loading      = signal(true);
  readonly payments     = signal<TripPayment[]>([]);
  readonly processingId = signal<string | null>(null);

  readonly paidCount   = computed(() => this.payments().filter(p => p.status === 'paid').length);
  readonly unpaidCount = computed(() => this.payments().filter(p => p.status !== 'paid').length);
  readonly collected   = computed(() => this.paidCount() * this.costPerPerson);
  readonly expected    = computed(() => this.payments().length * this.costPerPerson);
  readonly progressPct = computed(() => {
    const exp = this.expected();
    return exp > 0 ? Math.round((this.collected() / exp) * 100) : 0;
  });

  ngOnInit(): void {
    this.paymentSvc.getPaymentsForTrip(this.tripId).subscribe({
      next: (list) => { this.payments.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markPaid(p: TripPayment, byHost: boolean): void {
    this.processingId.set(p.userId);
    this.paymentSvc.markAsPaid(this.tripId, p.userId, byHost).subscribe({
      next: () => {
        this.payments.update(list => list.map(x => x.userId === p.userId ? { ...x, status: 'paid' as const, markedByHost: byHost } : x));
        this.processingId.set(null);
        this.snackBar.open('Payment marked as paid!', undefined, { duration: 2500 });
      },
      error: () => { this.processingId.set(null); this.snackBar.open('Failed to update.', 'Dismiss', { duration: 3000 }); },
    });
  }

  undoPaid(p: TripPayment): void {
    this.processingId.set(p.userId);
    this.paymentSvc.markAsUnpaid(this.tripId, p.userId).subscribe({
      next: () => {
        this.payments.update(list => list.map(x => x.userId === p.userId ? { ...x, status: 'unpaid' as const, markedByHost: false } : x));
        this.processingId.set(null);
        this.snackBar.open('Payment reversed.', undefined, { duration: 2500 });
      },
      error: () => { this.processingId.set(null); this.snackBar.open('Failed to update.', 'Dismiss', { duration: 3000 }); },
    });
  }
}
