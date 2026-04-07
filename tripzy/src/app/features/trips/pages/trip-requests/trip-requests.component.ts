import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestService } from '../../../../core/services/request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TripService } from '../../../../core/services/trip.service';
import { JoinRequest, RequestStatus } from '../../../../core/models/request.model';
import { Trip } from '../../../../core/models/trip.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

type FilterTab = 'all' | RequestStatus;

@Component({
  selector: 'app-trip-requests',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, MatButtonModule, MatSnackBarModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="req-page">
      @if (loading()) {
        <app-loading-spinner message="Loading requests..." />
      } @else {
        <div class="page-header">
          <a class="back-btn" [routerLink]="['/trips', tripId]"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <h1>Join Requests</h1>
            <p>{{ trip()?.title }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          @for (tab of tabs; track tab.value) {
            <button class="tab-btn" [class.tab-btn--active]="activeTab() === tab.value" (click)="activeTab.set(tab.value)">
              {{ tab.label }}
              @if (countFor(tab.value) > 0) { <span class="tab-count">{{ countFor(tab.value) }}</span> }
            </button>
          }
        </div>

        @if (filtered().length === 0) {
          <app-empty-state icon="people" title="No requests" message="No join requests in this category yet." />
        } @else {
          <div class="req-list">
            @for (req of filtered(); track req.id) {
              <div class="req-card">
                <div class="req-avatar">
                  @if (req.requesterPhotoURL) {
                    <img [src]="req.requesterPhotoURL" [alt]="req.requesterName" />
                  } @else {
                    <div class="avatar-fallback">{{ req.requesterName[0].toUpperCase() }}</div>
                  }
                </div>
                <div class="req-body">
                  <div class="req-top">
                    <span class="req-name">{{ req.requesterName }}</span>
                    <span class="status-badge" [class]="'status-' + req.status">{{ req.status }}</span>
                  </div>
                  @if (req.message) { <p class="req-msg">{{ req.message }}</p> }
                  <span class="req-date"><mat-icon>schedule</mat-icon> {{ req.createdAt | date:'d MMM yyyy, h:mm a' }}</span>
                </div>
                @if (req.status === 'pending') {
                  <div class="req-actions">
                    <button class="approve-btn" (click)="updateStatus(req, 'approved')" [disabled]="processingId() === req.id">
                      <mat-icon>check</mat-icon> Approve
                    </button>
                    <button class="reject-btn" (click)="updateStatus(req, 'rejected')" [disabled]="processingId() === req.id">
                      <mat-icon>close</mat-icon> Reject
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .req-page { display:flex; flex-direction:column; gap:24px; }
    .page-header { display:flex; align-items:center; gap:14px; }
    .back-btn { width:40px; height:40px; border-radius:10px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#475569; text-decoration:none; flex-shrink:0; }
    .back-btn:hover { background:#f8fafc; }
    .page-header h1 { margin:0; font-size:22px; font-weight:800; color:#0a0f28; }
    .page-header p { margin:2px 0 0; font-size:13px; color:#64748b; }
    .tabs { display:flex; gap:8px; flex-wrap:wrap; }
    .tab-btn { display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:20px; border:1.5px solid #e2e8f0; background:#fff; font-size:13px; font-weight:600; color:#64748b; cursor:pointer; transition:all .15s; }
    .tab-btn:hover { border-color:#ff9f1c; color:#ff6b2b; }
    .tab-btn--active { border-color:#ff6b2b; background:linear-gradient(135deg,#fff4ee,#fff9f0); color:#ff6b2b; }
    .tab-count { background:#ff6b2b; color:#fff; border-radius:10px; padding:1px 7px; font-size:11px; font-weight:700; }
    .req-list { display:flex; flex-direction:column; gap:12px; }
    .req-card { display:flex; gap:16px; align-items:flex-start; background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:18px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .req-avatar { width:52px; height:52px; border-radius:50%; overflow:hidden; flex-shrink:0; }
    .req-avatar img { width:100%; height:100%; object-fit:cover; }
    .avatar-fallback { width:100%; height:100%; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; color:#fff; }
    .req-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:6px; }
    .req-top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .req-name { font-size:15px; font-weight:700; color:#0a0f28; }
    .status-badge { padding:3px 12px; border-radius:20px; font-size:11.5px; font-weight:700; text-transform:capitalize; }
    .status-pending { background:#fff7ed; color:#c2410c; }
    .status-approved { background:#f0fdf4; color:#15803d; }
    .status-rejected { background:#fef2f2; color:#b91c1c; }
    .req-msg { font-size:13px; color:#475569; margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .req-date { display:flex; align-items:center; gap:4px; font-size:12px; color:#94a3b8; }
    .req-date mat-icon { font-size:14px; width:14px; height:14px; }
    .req-actions { display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
    .approve-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
    .approve-btn:disabled { opacity:.5; cursor:not-allowed; }
    .reject-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:#fff; color:#dc2626; border:1.5px solid #fca5a5; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
    .reject-btn:disabled { opacity:.5; cursor:not-allowed; }
    @media (max-width:600px) { .req-card { flex-wrap:wrap; } .req-actions { flex-direction:row; width:100%; } }
  `],
})
export class TripRequestsComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private requestService = inject(RequestService);
  private tripService    = inject(TripService);
  private auth           = inject(AuthService);
  private snackBar       = inject(MatSnackBar);

  readonly loading     = signal(true);
  readonly requests    = signal<JoinRequest[]>([]);
  readonly trip        = signal<Trip | null>(null);
  readonly activeTab   = signal<FilterTab>('all');
  readonly processingId = signal<string | null>(null);

  tripId = '';

  readonly tabs: { value: FilterTab; label: string }[] = [
    { value: 'all',      label: 'All' },
    { value: 'pending',  label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    return tab === 'all' ? this.requests() : this.requests().filter(r => r.status === tab);
  });

  countFor(tab: FilterTab): number {
    return tab === 'all' ? this.requests().length : this.requests().filter(r => r.status === tab).length;
  }

  ngOnInit(): void {
    this.tripId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.tripId) { this.loading.set(false); return; }
    this.tripService.getTripDoc(this.tripId).subscribe((t) => this.trip.set(t));
    this.requestService.getRequestsForTrip(this.tripId).subscribe({
      next: (reqs) => { this.requests.set(reqs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(req: JoinRequest, status: RequestStatus): void {
    this.processingId.set(req.id);
    this.requestService.updateStatus(req.id, status).subscribe({
      next: () => {
        this.requests.update(list => list.map(r => r.id === req.id ? { ...r, status } : r));
        this.processingId.set(null);
        this.snackBar.open(status === 'approved' ? 'Request approved!' : 'Request rejected.', undefined, { duration: 2500 });
      },
      error: () => {
        this.processingId.set(null);
        this.snackBar.open('Failed to update.', 'Dismiss', { duration: 3000 });
      },
    });
  }
}
