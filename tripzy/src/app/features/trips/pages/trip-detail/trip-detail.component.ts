import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { TripService } from '../../../../core/services/trip.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RequestService } from '../../../../core/services/request.service';
import { ReviewService } from '../../../../core/services/review.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { Trip } from '../../../../core/models/trip.model';
import { JoinRequest } from '../../../../core/models/request.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { JoinRequestDialogComponent, JoinDialogData } from '../../components/join-request-dialog/join-request-dialog.component';
import { ReviewDialogComponent, ReviewDialogData } from '../../components/review-dialog/review-dialog.component';
import { PaymentSummaryComponent } from '../../components/payment-summary/payment-summary.component';
import { SetCostDialogComponent, SetCostDialogData } from '../../components/set-cost-dialog/set-cost-dialog.component';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, MatButtonModule, MatSnackBarModule, MatDialogModule, LoadingSpinnerComponent, EmptyStateComponent, PaymentSummaryComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading trip..." />
    } @else if (!trip()) {
      <app-empty-state icon="travel_explore" title="Trip not found" message="This trip may have been removed." actionLabel="Browse Trips" actionLink="/trips" />
    } @else {
      <div class="detail-page">

        <!-- Cover -->
        <div class="cover-section">
          @if (trip()!.coverImageURL) {
            <img [src]="trip()!.coverImageURL" class="cover-img" [alt]="trip()!.title" />
          } @else {
            <div class="cover-fallback">✈️</div>
          }
          <div class="cover-overlay">
            <a class="back-btn" routerLink="/trips"><mat-icon>arrow_back</mat-icon></a>
            <div class="cover-badges">
              <span class="badge type-{{ trip()!.tripType }}">{{ typeEmoji(trip()!.tripType) }} {{ trip()!.tripType }}</span>
              <span class="badge status-{{ trip()!.status }}">{{ trip()!.status }}</span>
            </div>
          </div>
        </div>

        <div class="detail-layout">

          <!-- Main content -->
          <div class="main-col">

            <div class="title-block">
              <h1>{{ trip()!.title }}</h1>
              <p class="dest"><mat-icon>location_on</mat-icon>{{ trip()!.destination }}</p>
            </div>

            <!-- Stats row -->
            <div class="stats-row">
              <div class="stat">
                <mat-icon>calendar_today</mat-icon>
                <div>
                  <strong>{{ trip()!.startDate | date:'d MMM' }} – {{ trip()!.endDate | date:'d MMM' }}</strong>
                  <span>{{ duration() }} days</span>
                </div>
              </div>
              <div class="stat">
                <mat-icon>currency_rupee</mat-icon>
                <div>
                  <strong>₹{{ trip()!.budget | number }}</strong>
                  <span>per person</span>
                </div>
              </div>
              <div class="stat">
                <mat-icon>group</mat-icon>
                <div>
                  <strong>{{ trip()!.currentParticipants }}/{{ trip()!.maxParticipants }}</strong>
                  <span>joined</span>
                </div>
              </div>
              <div class="stat">
                <mat-icon>directions_transit</mat-icon>
                <div>
                  <strong>{{ trip()!.transportMode }}</strong>
                  <span>transport</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="card">
              <div class="card-header"><mat-icon>description</mat-icon><h3>About this trip</h3></div>
              <p class="desc-text">{{ trip()!.description }}</p>
            </div>

            <!-- Payment summary -->
            @if (trip()!.paymentEnabled && trip()!.costPerPerson) {
              <app-payment-summary
                [tripId]="trip()!.id"
                [costPerPerson]="trip()!.costPerPerson!"
                [currency]="trip()!.currency"
                [isHost]="isHost()"
                [myUid]="auth.uid ?? ''"
                [myName]="auth.currentUser()?.displayName ?? ''"
                [myPhotoURL]="auth.currentUser()?.photoURL ?? null"
              />
            }

            <!-- Spots remaining -->
            <div class="spots-bar">
              <div class="spots-info">
                <span>{{ trip()!.maxParticipants - trip()!.currentParticipants }} spots remaining</span>
                <span>{{ trip()!.currentParticipants }}/{{ trip()!.maxParticipants }} joined</span>
              </div>
              <div class="spots-track">
                <div class="spots-fill" [style.width.%]="spotsPercent()"></div>
              </div>
            </div>

          </div>

          <!-- Sidebar -->
          <div class="side-col">

            <!-- Host card -->
            <div class="card host-card">
              <p class="card-label">Hosted by</p>
              <a [routerLink]="['/profile', trip()!.hostId]" class="host-row">
                @if (trip()!.hostPhotoURL) {
                  <img [src]="trip()!.hostPhotoURL" class="host-avatar" />
                } @else {
                  <div class="host-avatar host-initials">{{ trip()!.hostName[0] }}</div>
                }
                <div>
                  <strong>{{ trip()!.hostName }}</strong>
                  <span>View profile →</span>
                </div>
              </a>
            </div>

            <!-- Trip meta -->
            <div class="card meta-card">
              <div class="meta-row">
                <span><mat-icon>wc</mat-icon> Gender preference</span>
                <strong>{{ trip()!.genderPreference === 'any' ? 'Open to all' : trip()!.genderPreference + ' only' }}</strong>
              </div>
              <div class="meta-row">
                <span><mat-icon>category</mat-icon> Trip type</span>
                <strong>{{ trip()!.tripType }}</strong>
              </div>
              <div class="meta-row">
                <span><mat-icon>event_available</mat-icon> Posted</span>
                <strong>{{ trip()!.createdAt | date:'d MMM yyyy' }}</strong>
              </div>
            </div>

            <!-- CTA -->
            @if (!isHost()) {
              @if (myRequest()?.status === 'approved') {
                <div class="approved-banner">
                  <mat-icon>check_circle</mat-icon>
                  <div>
                    <strong>You're in!</strong>
                    <span>Your join request was approved</span>
                  </div>
                </div>
                @if (trip()!.paymentEnabled && trip()!.costPerPerson) {
                  <div class="pay-notice">
                    <mat-icon>payments</mat-icon>
                    <span>Payment of {{ trip()!.currency }} {{ trip()!.costPerPerson | number }} is due. See the payment tracker above.</span>
                  </div>
                }
              } @else if (myRequest()?.status === 'rejected') {
                <button class="join-btn join-btn--disabled" disabled>
                  <mat-icon>cancel</mat-icon>
                  Request Rejected
                </button>
              } @else if (myRequest()?.status === 'pending') {
                <button class="join-btn join-btn--disabled" disabled>
                  <mat-icon>hourglass_empty</mat-icon>
                  Request Sent — Pending
                </button>
              } @else if (trip()!.status === 'open') {
                <button class="join-btn" (click)="requestJoin()">
                  <mat-icon>group_add</mat-icon>
                  Request to Join
                </button>
              } @else {
                <button class="join-btn join-btn--disabled" disabled>
                  <mat-icon>block</mat-icon>
                  Trip is {{ trip()!.status }}
                </button>
              }
            } @else {
              <div class="host-actions">
                <a class="requests-btn" [routerLink]="['/trips', trip()!.id, 'requests']">
                  <mat-icon>people</mat-icon> View Requests
                  @if (pendingCount() > 0) {
                    <span class="pending-badge">{{ pendingCount() }}</span>
                  }
                </a>
                <a class="edit-btn" [routerLink]="['/trips', trip()!.id, 'edit']">
                  <mat-icon>edit</mat-icon> Edit Trip
                </a>
                <button class="cost-btn" (click)="openSetCost()">
                  <mat-icon>payments</mat-icon>
                  {{ trip()!.paymentEnabled ? 'Payment Settings' : 'Set Trip Cost' }}
                </button>
              </div>
            }

            <!-- Rate members -->
            @if (canReview()) {
              <div class="review-section">
                <h3 class="review-title"><mat-icon>star</mat-icon> Rate Members</h3>
                <div class="review-list">
                  @for (person of reviewTargets(); track person.id) {
                    <div class="review-row">
                      <div class="review-avatar">
                        @if (person.photoURL) {
                          <img [src]="person.photoURL" [alt]="person.name" />
                        } @else {
                          <span>{{ person.name[0].toUpperCase() }}</span>
                        }
                      </div>
                      <div class="review-info">
                        <span class="review-name">{{ person.name }}</span>
                        <span class="review-role">{{ person.role }}</span>
                      </div>
                      @if (reviewedIds().has(person.id)) {
                        <span class="reviewed-chip"><mat-icon>check_circle</mat-icon> Reviewed</span>
                      } @else {
                        <button class="rate-btn" (click)="openReview(person.id, person.name, person.photoURL, person.type)">
                          <mat-icon>star_border</mat-icon> Rate
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }

          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .detail-page { display:flex; flex-direction:column; gap:24px; }

    /* Cover */
    .cover-section {
      position:relative; height:300px; border-radius:16px; overflow:hidden;
      background:#0a0f28;
    }
    .cover-img { width:100%; height:100%; object-fit:cover; display:block; }
    .cover-fallback { width:100%; height:100%; display:flex; align-items:center; justify-content:center;
      font-size:80px; background:linear-gradient(135deg,#0a0f28,#1e2a6e); }
    .cover-overlay {
      position:absolute; inset:0;
      background:linear-gradient(to bottom, rgba(0,0,0,.4) 0%, transparent 40%, rgba(0,0,0,.3) 100%);
      display:flex; flex-direction:column; justify-content:space-between; padding:16px;
    }
    .back-btn {
      width:36px; height:36px; border-radius:9px;
      background:rgba(255,255,255,.15); backdrop-filter:blur(8px);
      display:flex; align-items:center; justify-content:center;
      color:#fff; text-decoration:none;
      mat-icon { font-size:20px; }
      &:hover { background:rgba(255,255,255,.25); }
    }
    .cover-badges { display:flex; gap:8px; }
    .badge {
      padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700;
      backdrop-filter:blur(8px);
    }
    .type-budget    { background:rgba(220,252,231,.9); color:#166534; }
    .type-luxury    { background:rgba(254,249,195,.9); color:#854d0e; }
    .type-adventure { background:rgba(255,237,213,.9); color:#9a3412; }
    .type-workation { background:rgba(219,234,254,.9); color:#1e40af; }
    .status-open      { background:rgba(240,253,244,.9); color:#166534; }
    .status-full      { background:rgba(254,242,242,.9); color:#991b1b; }
    .status-completed { background:rgba(241,245,249,.9); color:#475569; }

    /* Layout */
    .detail-layout { display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start; }

    .title-block { margin-bottom:4px; }
    .title-block h1 { margin:0 0 6px; font-size:26px; font-weight:800; color:#0a0f28; }
    .dest { display:flex; align-items:center; gap:4px; color:#64748b; font-size:14px; margin:0;
      mat-icon { font-size:16px; width:16px; height:16px; color:#ff6b2b; } }

    /* Stats row */
    .stats-row {
      display:grid; grid-template-columns:repeat(4,1fr); gap:0;
      background:#fff; border-radius:14px; border:1px solid #e2e8f0;
      overflow:hidden;
    }
    .stat {
      display:flex; align-items:center; gap:10px;
      padding:16px; border-right:1px solid #f1f5f9;
      &:last-child { border-right:none; }
      mat-icon { color:#ff6b2b; font-size:22px; flex-shrink:0; }
      div { display:flex; flex-direction:column; gap:1px; }
      strong { font-size:14px; font-weight:700; color:#0a0f28; }
      span   { font-size:11px; color:#94a3b8; }
    }

    /* Card */
    .card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:20px 22px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .card-header { display:flex; align-items:center; gap:8px; margin-bottom:12px;
      mat-icon { color:#ff6b2b; } h3 { margin:0; font-size:15px; font-weight:700; color:#0a0f28; } }
    .desc-text { margin:0; font-size:14px; color:#475569; line-height:1.7; }

    /* Spots bar */
    .spots-bar { background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:16px 20px; }
    .spots-info { display:flex; justify-content:space-between; font-size:12.5px; color:#64748b; margin-bottom:8px; }
    .spots-track { height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .spots-fill { height:100%; background:linear-gradient(90deg,#ff6b2b,#ff9f1c); border-radius:4px; transition:width .4s; }

    /* Sidebar cards */
    .host-card { display:flex; flex-direction:column; gap:12px; }
    .card-label { margin:0; font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
    .host-row {
      display:flex; align-items:center; gap:12px; text-decoration:none; color:inherit;
      strong { display:block; font-size:14px; font-weight:700; color:#0a0f28; }
      span   { font-size:12px; color:#ff6b2b; }
      &:hover strong { color:#ff6b2b; }
    }
    .host-avatar { width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; }
    .host-initials { background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; }

    .meta-card { display:flex; flex-direction:column; gap:12px; }
    .meta-row {
      display:flex; justify-content:space-between; align-items:center; font-size:13px;
      span { display:flex; align-items:center; gap:6px; color:#64748b; mat-icon { font-size:16px; width:16px; height:16px; } }
      strong { color:#0a0f28; font-weight:600; }
    }

    /* CTA buttons */
    .join-btn {
      width:100%; height:50px;
      display:flex; align-items:center; justify-content:center; gap:8px;
      background:linear-gradient(135deg,#ff6b2b,#ff9f1c);
      color:#fff; border:none; border-radius:12px;
      font-size:15px; font-weight:700; cursor:pointer;
      box-shadow:0 4px 14px rgba(255,107,43,.35);
      transition:opacity .15s, transform .1s;
      mat-icon { font-size:20px; }
      &:hover { opacity:.92; transform:translateY(-1px); }
    }
    .join-btn--disabled { background:#e2e8f0; color:#94a3b8; box-shadow:none; cursor:not-allowed; }
    .approved-banner {
      display:flex; align-items:center; gap:12px; padding:14px 16px;
      background:linear-gradient(135deg,#f0fdf4,#dcfce7); border:1.5px solid #86efac; border-radius:12px;
      mat-icon { color:#16a34a; font-size:24px; flex-shrink:0; }
      div { display:flex; flex-direction:column; gap:2px; }
      strong { font-size:14px; font-weight:700; color:#15803d; }
      span { font-size:12px; color:#166534; }
    }
    .pay-notice {
      display:flex; align-items:flex-start; gap:8px; padding:12px 14px;
      background:#fff7ed; border:1.5px solid #fed7aa; border-radius:10px; font-size:12.5px; color:#9a3412;
      mat-icon { font-size:16px; width:16px; height:16px; flex-shrink:0; margin-top:1px; color:#ea580c; }
    }
    .host-actions { display:flex; flex-direction:column; gap:10px; }
    .requests-btn {
      position:relative; width:100%; height:50px;
      display:flex; align-items:center; justify-content:center; gap:8px;
      background:linear-gradient(135deg,#ff6b2b,#ff9f1c); border-radius:12px;
      font-size:15px; font-weight:700; color:#fff; text-decoration:none;
      box-shadow:0 4px 12px rgba(255,107,43,.3);
      mat-icon { font-size:20px; }
      &:hover { opacity:.92; }
    }
    .pending-badge {
      position:absolute; top:-6px; right:-6px;
      background:#dc2626; color:#fff; border-radius:10px;
      padding:2px 7px; font-size:11px; font-weight:700;
    }
    .edit-btn {
      width:100%; height:50px;
      display:flex; align-items:center; justify-content:center; gap:8px;
      background:#fff; border:1.5px solid #e2e8f0; border-radius:12px;
      font-size:15px; font-weight:700; color:#0a0f28; text-decoration:none;
      transition:border-color .15s, background .15s;
      mat-icon { font-size:20px; }
      &:hover { border-color:#ff9f1c; background:#fffaf5; }
    }
    .cost-btn {
      width:100%; height:44px;
      display:flex; align-items:center; justify-content:center; gap:8px;
      background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px;
      font-size:13.5px; font-weight:700; color:#475569; cursor:pointer;
      transition:border-color .15s, background .15s;
      mat-icon { font-size:18px; }
      &:hover { border-color:#ff9f1c; color:#ff6b2b; background:#fffaf5; }
    }

    .side-col { display:flex; flex-direction:column; gap:16px; position:sticky; top:20px; }

    /* Review section */
    .review-section { background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:18px; }
    .review-title { display:flex; align-items:center; gap:6px; margin:0 0 14px; font-size:15px; font-weight:700; color:#0a0f28; mat-icon { font-size:18px; color:#ff9f1c; } }
    .review-list { display:flex; flex-direction:column; gap:10px; }
    .review-row { display:flex; align-items:center; gap:10px; }
    .review-avatar { width:36px; height:36px; border-radius:50%; overflow:hidden; flex-shrink:0; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; }
    .review-avatar img { width:100%; height:100%; object-fit:cover; }
    .review-info { flex:1; min-width:0; }
    .review-name { display:block; font-size:13px; font-weight:600; color:#0a0f28; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .review-role { display:block; font-size:11px; color:#94a3b8; }
    .rate-btn { display:flex; align-items:center; gap:4px; padding:5px 12px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; mat-icon { font-size:14px; width:14px; height:14px; } }
    .reviewed-chip { display:flex; align-items:center; gap:4px; padding:5px 10px; background:#f0fdf4; color:#16a34a; border-radius:8px; font-size:12px; font-weight:600; white-space:nowrap; mat-icon { font-size:14px; width:14px; height:14px; } }

    @media (max-width:900px) {
      .detail-layout { grid-template-columns:1fr; }
      .side-col { position:static; }
      .stats-row { grid-template-columns:repeat(2,1fr); }
      .stat:nth-child(2) { border-right:none; }
      .stat:nth-child(1), .stat:nth-child(2) { border-bottom:1px solid #f1f5f9; }
    }
    @media (max-width:600px) {
      .cover-section { height:220px; }
    }
  `],
})
export class TripDetailComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private tripSvc        = inject(TripService);
  readonly auth          = inject(AuthService);
  private snackBar       = inject(MatSnackBar);
  private dialog         = inject(MatDialog);
  private requestService = inject(RequestService);
  private reviewService  = inject(ReviewService);
  private paymentSvc     = inject(PaymentService);

  readonly loading      = signal(true);
  readonly trip         = signal<Trip | null>(null);
  readonly myRequest    = signal<JoinRequest | null>(null);
  readonly pendingCount = signal(0);
  readonly reviewedIds  = signal<Set<string>>(new Set());
  readonly canReview    = signal(false);
  readonly reviewTargets = signal<Array<{id: string; name: string; photoURL: string | null; role: string; type: 'host' | 'participant'}>>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.tripSvc.getTripDoc(id).subscribe({
      next: (t) => {
        this.trip.set(t);
        this.loading.set(false);
        const uid = this.auth.uid;
        if (uid && t) {
          this.requestService.getMyRequestForTrip(t.id, uid).subscribe((req) => this.myRequest.set(req));
          if (t.hostId === uid) {
            this.requestService.getRequestsForTrip(t.id).subscribe((reqs) =>
              this.pendingCount.set(reqs.filter(r => r.status === 'pending').length)
            );
          }

          // Load already-reviewed IDs for this trip
          const peopleToCheck = t.hostId === uid
            ? t.participantIds.filter(id => id !== uid)
            : [t.hostId];
          peopleToCheck.forEach(targetId => {
            this.reviewService.hasReviewed(uid, targetId, t.id).subscribe(has => {
              if (has) this.reviewedIds.update(s => new Set([...s, targetId]));
            });
          });

          // Set up review targets
          const isHost = t.hostId === uid;
          const isParticipant = t.participantIds.includes(uid);
          if (isHost || isParticipant) {
            this.canReview.set(true);
            if (isHost) {
              // Host rates each participant (excluding self)
              this.reviewTargets.set(
                t.participantIds
                  .filter(pid => pid !== uid)
                  .map(pid => ({ id: pid, name: 'Participant', photoURL: null, role: 'Participant', type: 'participant' as const }))
              );
            } else {
              // Participant rates the host
              this.reviewTargets.set([{
                id: t.hostId,
                name: t.hostName,
                photoURL: t.hostPhotoURL,
                role: 'Trip Host',
                type: 'host' as const,
              }]);
            }
          }
        }
      },
      error: () => this.loading.set(false),
    });
  }

  get isHost(): () => boolean { return () => this.trip()?.hostId === this.auth.uid; }
  get duration(): () => number {
    return () => {
      const t = this.trip();
      if (!t) return 0;
      return Math.ceil((t.endDate.getTime() - t.startDate.getTime()) / 86400000);
    };
  }
  get spotsPercent(): () => number {
    return () => {
      const t = this.trip();
      if (!t) return 0;
      return (t.currentParticipants / t.maxParticipants) * 100;
    };
  }

  typeEmoji(type: string): string {
    const map: Record<string, string> = { budget:'💸', luxury:'💎', adventure:'🏕️', workation:'💻' };
    return map[type] ?? '✈️';
  }

  requestJoin(): void {
    const trip = this.trip();
    if (!trip) return;
    const ref = this.dialog.open<JoinRequestDialogComponent, JoinDialogData, string>(
      JoinRequestDialogComponent,
      { data: { trip }, width: '480px', maxWidth: '95vw' },
    );
    ref.afterClosed().subscribe((result) => {
      if (result === 'sent') {
        // Re-fetch the actual request so status reflects correctly
        const uid = this.auth.uid;
        if (uid) this.requestService.getMyRequestForTrip(trip.id, uid).subscribe(req => this.myRequest.set(req));
        this.snackBar.open('Join request sent!', undefined, { duration: 3000 });
      }
    });
  }

  openSetCost(): void {
    const trip = this.trip();
    if (!trip) return;
    const ref = this.dialog.open<SetCostDialogComponent, SetCostDialogData, string>(
      SetCostDialogComponent,
      {
        data: {
          tripId: trip.id,
          currentCost: trip.costPerPerson ?? null,
          currency: trip.currency,
          paymentEnabled: trip.paymentEnabled ?? false,
        },
        width: '460px', maxWidth: '95vw',
      }
    );
    ref.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.snackBar.open('Payment settings saved!', undefined, { duration: 2500 });
        // Re-fetch trip, then backfill payment records for already-approved participants
        this.tripSvc.getTripDoc(trip.id).subscribe(t => {
          this.trip.set(t);
          if (t?.paymentEnabled && t.costPerPerson) {
            this.requestService.getRequestsForTrip(trip.id).subscribe(reqs => {
              reqs.filter(r => r.status === 'approved').forEach(req => {
                this.paymentSvc.createPaymentRecord(
                  trip.id,
                  { uid: req.requesterId, displayName: req.requesterName, photoURL: req.requesterPhotoURL ?? null },
                  t.costPerPerson!,
                  t.currency,
                ).subscribe();
              });
            });
          }
        });
      }
    });
  }

  openReview(targetId: string, targetName: string, targetPhotoURL: string | null, targetType: 'host' | 'participant'): void {
    const trip = this.trip();
    if (!trip) return;
    const ref = this.dialog.open(ReviewDialogComponent, {
      data: { tripId: trip.id, targetId, targetName, targetPhotoURL, targetType } as ReviewDialogData,
      width: '480px', maxWidth: '95vw',
    });
    ref.afterClosed().subscribe(result => {
      if (result === 'submitted') {
        this.reviewedIds.update(s => new Set([...s, targetId]));
      }
    });
  }
}
