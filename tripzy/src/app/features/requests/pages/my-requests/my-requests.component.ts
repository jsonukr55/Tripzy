import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RequestService } from '../../../../core/services/request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { JoinRequest, RequestStatus } from '../../../../core/models/request.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

type FilterTab = 'all' | RequestStatus;

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, MatButtonModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="req-page">
      <div class="page-header">
        <div>
          <h1>My Join Requests</h1>
          <p>Track your trip join requests</p>
        </div>
        <a mat-stroked-button routerLink="/trips" class="browse-btn">
          <mat-icon>explore</mat-icon> Browse Trips
        </a>
      </div>

      <!-- Filter tabs -->
      <div class="tabs">
        @for (tab of tabs; track tab.value) {
          <button class="tab-btn" [class.tab-btn--active]="activeTab() === tab.value" (click)="activeTab.set(tab.value)">
            {{ tab.label }}
            @if (countFor(tab.value) > 0) {
              <span class="tab-count">{{ countFor(tab.value) }}</span>
            }
          </button>
        }
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading requests..." />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="inbox" title="No requests yet" message="You haven't sent any join requests." actionLabel="Explore Trips" actionLink="/trips" />
      } @else {
        <div class="req-list">
          @for (req of filtered(); track req.id) {
            <div class="req-card">
              <div class="req-cover">
                @if (req.tripCoverImageURL) {
                  <img [src]="req.tripCoverImageURL" [alt]="req.tripTitle" />
                } @else {
                  <div class="cover-placeholder"><mat-icon>flight_takeoff</mat-icon></div>
                }
              </div>
              <div class="req-body">
                <div class="req-top">
                  <a class="req-title" [routerLink]="['/trips', req.tripId]">{{ req.tripTitle }}</a>
                  <span class="status-badge" [class]="'status-' + req.status">{{ req.status }}</span>
                </div>
                @if (req.message) {
                  <p class="req-msg">{{ req.message }}</p>
                }
                <span class="req-date"><mat-icon>schedule</mat-icon> {{ req.createdAt | date:'d MMM yyyy' }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .req-page { display:flex; flex-direction:column; gap:24px; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .page-header h1 { margin:0; font-size:22px; font-weight:800; color:#0a0f28; }
    .page-header p { margin:2px 0 0; font-size:13px; color:#64748b; }
    .browse-btn { border-color:#e2e8f0 !important; color:#475569 !important; font-weight:600 !important; display:flex; align-items:center; gap:6px; }
    .tabs { display:flex; gap:8px; flex-wrap:wrap; }
    .tab-btn { display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:20px; border:1.5px solid #e2e8f0; background:#fff; font-size:13px; font-weight:600; color:#64748b; cursor:pointer; transition:all .15s; }
    .tab-btn:hover { border-color:#ff9f1c; color:#ff6b2b; }
    .tab-btn--active { border-color:#ff6b2b; background:linear-gradient(135deg,#fff4ee,#fff9f0); color:#ff6b2b; }
    .tab-count { background:#ff6b2b; color:#fff; border-radius:10px; padding:1px 7px; font-size:11px; font-weight:700; }
    .req-list { display:flex; flex-direction:column; gap:12px; }
    .req-card { display:flex; gap:16px; background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,.04); transition:box-shadow .15s; }
    .req-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); }
    .req-cover { width:80px; height:80px; border-radius:10px; overflow:hidden; flex-shrink:0; }
    .req-cover img { width:100%; height:100%; object-fit:cover; }
    .cover-placeholder { width:100%; height:100%; background:linear-gradient(135deg,#0a0f28,#1e2a6e); display:flex; align-items:center; justify-content:center; }
    .cover-placeholder mat-icon { color:rgba(255,255,255,.4); font-size:28px; }
    .req-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:6px; }
    .req-top { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .req-title { font-size:15px; font-weight:700; color:#0a0f28; text-decoration:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .req-title:hover { color:#ff6b2b; }
    .status-badge { padding:3px 12px; border-radius:20px; font-size:11.5px; font-weight:700; text-transform:capitalize; flex-shrink:0; }
    .status-pending { background:#fff7ed; color:#c2410c; }
    .status-approved { background:#f0fdf4; color:#15803d; }
    .status-rejected { background:#fef2f2; color:#b91c1c; }
    .req-msg { font-size:13px; color:#475569; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .req-date { display:flex; align-items:center; gap:4px; font-size:12px; color:#94a3b8; }
    .req-date mat-icon { font-size:14px; width:14px; height:14px; }
    @media (max-width:480px) { .req-cover { width:60px; height:60px; } }
  `],
})
export class MyRequestsComponent implements OnInit {
  private requestService = inject(RequestService);
  private auth           = inject(AuthService);

  readonly loading   = signal(true);
  readonly requests  = signal<JoinRequest[]>([]);
  readonly activeTab = signal<FilterTab>('all');

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
    const uid = this.auth.uid;
    if (!uid) { this.loading.set(false); return; }
    this.requestService.getMyRequests(uid).subscribe({
      next: (reqs) => { this.requests.set(reqs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
