import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TripService } from '../../../../core/services/trip.service';
import { Trip, TripType } from '../../../../core/models/trip.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [
    RouterLink, DatePipe, DecimalPipe, ReactiveFormsModule,
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="list-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Discover Trips</h1>
          <p>Find your next adventure</p>
        </div>
        <a class="create-btn" routerLink="/trips/create">
          <mat-icon>add</mat-icon> Create Trip
        </a>
      </div>

      <!-- Filters bar -->
      <div class="filters-bar">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input [formControl]="searchCtrl" placeholder="Search destination..." />
          @if (searchCtrl.value) {
            <button class="clear-btn" (click)="searchCtrl.setValue('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <div class="filter-chips">
          @for (type of tripTypes; track type.value) {
            <button
              class="chip"
              [class.chip--active]="activeFilter() === type.value"
              (click)="setFilter(type.value)"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          }
          @if (activeFilter()) {
            <button class="chip chip--clear" (click)="activeFilter.set(null); loadTrips()">
              <mat-icon>close</mat-icon> Clear
            </button>
          }
        </div>
      </div>

      <!-- Content -->
      @if (loading()) {
        <app-loading-spinner message="Finding trips for you..." />
      } @else if (filteredTrips().length === 0) {
        <app-empty-state
          icon="explore"
          title="No trips found"
          message="Be the first to create a trip for this destination!"
          actionLabel="Create a Trip"
          actionLink="/trips/create"
        />
      } @else {
        <div class="trips-grid">
          @for (trip of filteredTrips(); track trip.id) {
            <a class="trip-card" [routerLink]="['/trips', trip.id]">

              <div class="card-cover">
                @if (trip.coverImageURL) {
                  <img [src]="trip.coverImageURL" [alt]="trip.title" />
                } @else {
                  <div class="cover-placeholder">
                    <span>{{ destinationEmoji(trip.destination) }}</span>
                  </div>
                }
                <span class="type-badge type-{{ trip.tripType }}">{{ typeLabel(trip.tripType) }}</span>
                <span class="status-badge" [class.full]="trip.status === 'full'">
                  {{ trip.status === 'full' ? 'Full' : trip.currentParticipants + '/' + trip.maxParticipants }}
                </span>
              </div>

              <div class="card-body">
                <h3 class="card-title">{{ trip.title }}</h3>
                <p class="card-dest">
                  <mat-icon>location_on</mat-icon>{{ trip.destination }}
                </p>
                <p class="card-dates">
                  <mat-icon>calendar_today</mat-icon>
                  {{ trip.startDate | date:'d MMM' }} – {{ trip.endDate | date:'d MMM yyyy' }}
                </p>
                <div class="card-footer">
                  <span class="card-budget">₹{{ trip.budget | number }}</span>
                  <div class="card-host">
                    @if (trip.hostPhotoURL) {
                      <img [src]="trip.hostPhotoURL" class="host-avatar" />
                    } @else {
                      <div class="host-avatar host-initials">{{ trip.hostName[0] }}</div>
                    }
                    <span>{{ trip.hostName }}</span>
                  </div>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .list-page { display:flex; flex-direction:column; gap:24px; }

    .page-header {
      display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
      h1 { margin:0; font-size:24px; font-weight:800; color:#0a0f28; }
      p  { margin:3px 0 0; font-size:13px; color:#64748b; }
    }
    .create-btn {
      display:flex; align-items:center; gap:6px;
      padding:0 20px; height:44px;
      background:linear-gradient(135deg,#ff6b2b,#ff9f1c);
      color:#fff; border-radius:10px; text-decoration:none;
      font-size:14px; font-weight:700;
      box-shadow:0 4px 12px rgba(255,107,43,.3);
      white-space:nowrap; flex-shrink:0;
      mat-icon { font-size:20px; width:20px; height:20px; }
      &:hover { opacity:.92; }
    }

    /* Filters */
    .filters-bar { display:flex; flex-direction:column; gap:12px; }

    .search-box {
      display:flex; align-items:center; gap:10px;
      background:#fff; border:1.5px solid #e2e8f0;
      border-radius:12px; padding:0 14px; height:48px;
      mat-icon { color:#94a3b8; font-size:20px; flex-shrink:0; }
      input {
        flex:1; border:none; outline:none;
        font-size:14px; color:#0a0f28; background:transparent;
        &::placeholder { color:#94a3b8; }
      }
      &:focus-within { border-color:#ff9f1c; }
    }
    .clear-btn {
      background:none; border:none; cursor:pointer; color:#94a3b8; padding:0;
      display:flex; align-items:center;
      mat-icon { font-size:18px; width:18px; height:18px; }
    }

    .filter-chips { display:flex; gap:8px; flex-wrap:wrap; }
    .chip {
      display:flex; align-items:center; gap:5px;
      padding:6px 14px; border-radius:20px;
      background:#f1f5f9; border:1.5px solid #e2e8f0;
      font-size:13px; font-weight:600; color:#475569;
      cursor:pointer; transition:all .15s;
      &:hover { border-color:#ff9f1c; }
    }
    .chip--active { background:#fff4ee; border-color:#ff6b2b; color:#ff6b2b; }
    .chip--clear {
      background:#fef2f2; border-color:#fecaca; color:#b91c1c;
      mat-icon { font-size:14px; width:14px; height:14px; }
    }

    /* Trips grid */
    .trips-grid {
      display:grid;
      grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));
      gap:20px;
    }

    /* Trip card */
    .trip-card {
      background:#fff; border-radius:14px;
      border:1px solid #e2e8f0;
      box-shadow:0 1px 3px rgba(0,0,0,.05);
      text-decoration:none; color:inherit;
      overflow:hidden; display:flex; flex-direction:column;
      transition:transform .2s, box-shadow .2s;
      &:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,.1); }
    }

    .card-cover {
      position:relative; height:180px; overflow:hidden;
      background:#f1f5f9;
      img { width:100%; height:100%; object-fit:cover; display:block; }
    }
    .cover-placeholder {
      width:100%; height:100%;
      background:linear-gradient(135deg,#0a0f28,#1e2a6e);
      display:flex; align-items:center; justify-content:center;
      font-size:64px;
    }

    .type-badge {
      position:absolute; top:12px; left:12px;
      padding:4px 10px; border-radius:20px;
      font-size:11px; font-weight:700; backdrop-filter:blur(8px);
    }
    .type-budget    { background:rgba(220,252,231,.9); color:#166534; }
    .type-luxury    { background:rgba(254,249,195,.9); color:#854d0e; }
    .type-adventure { background:rgba(255,237,213,.9); color:#9a3412; }
    .type-workation { background:rgba(219,234,254,.9); color:#1e40af; }

    .status-badge {
      position:absolute; top:12px; right:12px;
      padding:4px 10px; border-radius:20px;
      background:rgba(240,253,244,.9); color:#166534;
      font-size:11px; font-weight:700;
      &.full { background:rgba(254,242,242,.9); color:#991b1b; }
    }

    .card-body { padding:16px; display:flex; flex-direction:column; gap:6px; flex:1; }
    .card-title { margin:0; font-size:15px; font-weight:700; color:#0a0f28; line-height:1.3;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .card-dest, .card-dates {
      display:flex; align-items:center; gap:4px;
      font-size:12.5px; color:#64748b; margin:0;
      mat-icon { font-size:14px; width:14px; height:14px; color:#94a3b8; }
    }
    .card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:8px; border-top:1px solid #f1f5f9; }
    .card-budget { font-size:15px; font-weight:800; color:#ff6b2b; }
    .card-host { display:flex; align-items:center; gap:6px; font-size:12px; color:#64748b; font-weight:500; }
    .host-avatar { width:24px; height:24px; border-radius:50%; object-fit:cover; }
    .host-initials { background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }

    @media (max-width:640px) {
      .trips-grid { grid-template-columns:1fr; }
      .filter-chips { overflow-x:auto; flex-wrap:nowrap; padding-bottom:4px; }
    }
  `],
})
export class TripListComponent implements OnInit {
  private tripSvc = inject(TripService);

  readonly loading      = signal(true);
  readonly trips        = signal<Trip[]>([]);
  readonly activeFilter = signal<TripType | null>(null);

  searchCtrl = new FormControl('');

  tripTypes = [
    { value: 'budget' as TripType,    icon: '💸', label: 'Budget' },
    { value: 'luxury' as TripType,    icon: '💎', label: 'Luxury' },
    { value: 'adventure' as TripType, icon: '🏕️', label: 'Adventure' },
    { value: 'workation' as TripType, icon: '💻', label: 'Workation' },
  ];

  get filteredTrips(): () => Trip[] {
    return () => {
      let list = this.trips();
      const q = this.searchCtrl.value?.toLowerCase().trim() ?? '';
      if (q) list = list.filter(t => t.destination.toLowerCase().includes(q) || t.title.toLowerCase().includes(q));
      if (this.activeFilter()) list = list.filter(t => t.tripType === this.activeFilter());
      return list;
    };
  }

  ngOnInit(): void { this.loadTrips(); }

  loadTrips(): void {
    this.loading.set(true);
    this.tripSvc.getTrips().subscribe({
      next: (trips) => { this.trips.set(trips); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setFilter(type: TripType): void {
    this.activeFilter.set(this.activeFilter() === type ? null : type);
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = { budget:'💸 Budget', luxury:'💎 Luxury', adventure:'🏕️ Adventure', workation:'💻 Workation' };
    return map[type] ?? type;
  }

  destinationEmoji(dest: string): string {
    const d = dest.toLowerCase();
    if (d.includes('beach') || d.includes('goa') || d.includes('maldive')) return '🏖️';
    if (d.includes('mountain') || d.includes('himalaya') || d.includes('manali')) return '🏔️';
    if (d.includes('paris') || d.includes('rome') || d.includes('europe')) return '🗼';
    if (d.includes('forest') || d.includes('jungle') || d.includes('kerala')) return '🌿';
    return '✈️';
  }
}
