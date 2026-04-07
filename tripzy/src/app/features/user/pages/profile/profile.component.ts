import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { UserProfile, TravelPreference } from '../../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

const PREF_META: Record<TravelPreference, { icon: string; label: string; color: string }> = {
  budget:    { icon: '💸', label: 'Budget',    color: '#dcfce7' },
  luxury:    { icon: '💎', label: 'Luxury',    color: '#fef9c3' },
  adventure: { icon: '🏕️', label: 'Adventure', color: '#ffedd5' },
  workation: { icon: '💻', label: 'Workation', color: '#dbeafe' },
  cultural:  { icon: '🏛️', label: 'Cultural',  color: '#fae8ff' },
  solo:      { icon: '🧍', label: 'Solo',      color: '#f1f5f9' },
  group:     { icon: '👥', label: 'Group',     color: '#ecfdf5' },
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, MatButtonModule, MatChipsModule, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading profile..." />
    } @else if (profile()) {
      <div class="profile-page">

        <!-- ── Hero Banner ── -->
        <div class="hero-banner">
          <div class="banner-bg"></div>
          <div class="hero-content">

            <div class="avatar-section">
              @if (profile()!.photoURL) {
                <img [src]="profile()!.photoURL" class="avatar" alt="profile" />
              } @else {
                <div class="avatar avatar-fallback">
                  {{ profile()!.displayName[0].toUpperCase() }}
                </div>
              }

              @if (profile()!.isVerified) {
                <div class="verified-badge" title="Verified traveller">
                  <mat-icon>verified</mat-icon>
                </div>
              }
            </div>

            <div class="hero-info">
              <h1>{{ profile()!.displayName }}</h1>
              <p class="email">{{ profile()!.email }}</p>

              @if (profile()!.bio) {
                <p class="bio">"{{ profile()!.bio }}"</p>
              }

              <div class="meta-row">
                <span class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  Joined {{ profile()!.createdAt | date:'MMM yyyy' }}
                </span>
                @if (profile()!.reviewCount > 0) {
                  <span class="meta-item">
                    <mat-icon>star</mat-icon>
                    {{ profile()!.rating | number:'1.1-1' }} · {{ profile()!.reviewCount }} reviews
                  </span>
                }
              </div>
            </div>

            <a mat-stroked-button class="edit-btn" routerLink="/profile/edit">
              <mat-icon>edit</mat-icon> Edit Profile
            </a>

          </div>
        </div>

        <!-- ── Body ── -->
        <div class="body-grid">

          <!-- Stats card -->
          <div class="card stats-card">
            <div class="stat-item">
              <strong>{{ profile()!.rating || '—' }}</strong>
              <span>Rating</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <strong>{{ profile()!.reviewCount }}</strong>
              <span>Reviews</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <strong>{{ profile()!.isVerified ? 'Yes' : 'No' }}</strong>
              <span>Verified</span>
            </div>
          </div>

          <!-- Travel Preferences -->
          <div class="card">
            <div class="card-header">
              <mat-icon>luggage</mat-icon>
              <h3>Travel Style</h3>
            </div>
            @if (profile()!.travelPreferences.length) {
              <div class="prefs-grid">
                @for (pref of profile()!.travelPreferences; track pref) {
                  <div class="pref-chip" [style.background]="prefMeta(pref).color">
                    <span>{{ prefMeta(pref).icon }}</span>
                    <span>{{ prefMeta(pref).label }}</span>
                  </div>
                }
              </div>
            } @else {
              <p class="empty-hint">
                No travel preferences set yet.
                <a routerLink="/profile/edit">Add some →</a>
              </p>
            }
          </div>

          <!-- Account info -->
          <div class="card">
            <div class="card-header">
              <mat-icon>shield</mat-icon>
              <h3>Account</h3>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-val">{{ profile()!.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-val">
                  @if (profile()!.isVerified) {
                    <span class="badge badge-approved">Verified</span>
                  } @else {
                    <span class="badge badge-pending">Unverified</span>
                  }
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Member since</span>
                <span class="info-val">{{ profile()!.createdAt | date:'d MMMM yyyy' }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .profile-page { display: flex; flex-direction: column; gap: 24px; }

    /* Hero banner */
    .hero-banner {
      border-radius: 16px; overflow: hidden;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06);
      position: relative;
    }

    .banner-bg {
      height: 140px;
      background: linear-gradient(135deg, #0a0f28 0%, #1e2a6e 50%, #3a1f6e 100%);
      position: relative;
      &::after {
        content: '';
        position: absolute; inset: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,.15)"/><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,.1)"/><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,.1)"/></svg>') repeat;
      }
    }

    .hero-content {
      display: flex; align-items: flex-end; gap: 20px;
      padding: 0 28px 24px;
      position: relative;
      flex-wrap: wrap;
    }

    .avatar-section {
      position: relative;
      margin-top: -52px; flex-shrink: 0;
    }
    .avatar {
      width: 104px; height: 104px; border-radius: 50%;
      object-fit: cover;
      border: 4px solid #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,.18);
    }
    .avatar-fallback {
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      font-size: 40px; font-weight: 700; color: #fff;
    }
    .verified-badge {
      position: absolute; bottom: 4px; right: 4px;
      width: 26px; height: 26px; border-radius: 50%;
      background: #2563eb; border: 2px solid #fff;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 15px; width:15px; height:15px; color:#fff; }
    }

    .hero-info { flex: 1; min-width: 200px; padding-top: 12px; }
    .hero-info h1 {
      font-size: 22px; font-weight: 800;
      color: #0a0f28; margin: 0 0 2px;
    }
    .email { font-size: 13px; color: #64748b; margin: 0 0 6px; }
    .bio { font-size: 14px; color: #475569; font-style: italic; margin: 0 0 10px; }

    .meta-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item {
      display: flex; align-items: center; gap: 5px;
      font-size: 12.5px; color: #64748b;
      mat-icon { font-size: 15px; width:15px; height:15px; }
    }

    .edit-btn {
      margin-left: auto; align-self: center;
      border-color: #e2e8f0 !important;
      font-weight: 600 !important; color: #0a0f28 !important;
    }

    /* Body grid */
    .body-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .stats-card {
      grid-column: 1 / -1;
      display: flex; align-items: center;
      padding: 20px 32px !important;
    }

    /* Cards */
    .card {
      background: #fff; border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 22px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.04);
    }
    .card-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 16px;
      mat-icon { color: #ff6b2b; }
      h3 { margin: 0; font-size: 15px; font-weight: 700; color: #0a0f28; }
    }

    /* Stats */
    .stat-item { flex: 1; text-align: center; }
    .stat-item strong { display: block; font-size: 26px; font-weight: 800; color: #0a0f28; }
    .stat-item span   { font-size: 12px; color: #94a3b8; }
    .stat-divider { width: 1px; height: 40px; background: #e2e8f0; }

    /* Preferences */
    .prefs-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .pref-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px;
      font-size: 13px; font-weight: 600; color: #374151;
    }

    /* Info list */
    .info-list { display: flex; flex-direction: column; gap: 12px; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;
      &:last-child { border-bottom: none; padding-bottom: 0; }
    }
    .info-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .info-val   { font-size: 13.5px; color: #1e293b; font-weight: 500; }

    .badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .badge-approved { background: #f0fdf4; color: #15803d; }
    .badge-pending  { background: #fff7ed; color: #c2410c; }

    .empty-hint { font-size: 13px; color: #94a3b8; margin: 0; a { color: #ff6b2b; } }

    @media (max-width: 640px) {
      .body-grid { grid-template-columns: 1fr; }
      .stats-card { padding: 16px 20px !important; }
      .hero-content { padding: 0 16px 20px; }
    }
  `],
})
export class ProfileComponent implements OnInit {
  private auth        = inject(AuthService);
  private userService = inject(UserService);

  readonly loading = signal(true);
  readonly profile = signal<UserProfile | null>(null);

  prefMeta = (pref: TravelPreference) => PREF_META[pref];

  ngOnInit(): void {
    const uid = this.auth.uid;
    if (!uid) return;

    this.userService.getProfile(uid).subscribe({
      next: (p) => { this.profile.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
