import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../../core/services/user.service';
import { UserProfile, TravelPreference } from '../../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

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
  selector: 'app-public-profile',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatIconModule, MatButtonModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner message="Loading profile..." />
    } @else if (!profile()) {
      <app-empty-state icon="person_off" title="User not found" message="This profile doesn't exist or has been removed." actionLabel="Back to Discover" actionLink="/trips" />
    } @else {
      <div class="pub-profile">
        <div class="hero-banner">
          <div class="banner-bg"></div>
          <div class="hero-content">
            <div class="avatar-section">
              @if (profile()!.photoURL) {
                <img [src]="profile()!.photoURL" class="avatar" alt="profile" />
              } @else {
                <div class="avatar avatar-fallback">{{ profile()!.displayName[0].toUpperCase() }}</div>
              }
              @if (profile()!.isVerified) {
                <div class="verified-badge"><mat-icon>verified</mat-icon></div>
              }
            </div>
            <div class="hero-info">
              <h1>{{ profile()!.displayName }}</h1>
              @if (profile()!.bio) { <p class="bio">"{{ profile()!.bio }}"</p> }
              <div class="meta-row">
                <span class="meta-item"><mat-icon>calendar_today</mat-icon> Joined {{ profile()!.createdAt | date:'MMM yyyy' }}</span>
                @if (profile()!.reviewCount > 0) {
                  <span class="meta-item"><mat-icon>star</mat-icon> {{ profile()!.rating | number:'1.1-1' }} · {{ profile()!.reviewCount }} reviews</span>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="body-grid">
          <div class="card stats-card">
            <div class="stat-item"><strong>{{ profile()!.rating || '—' }}</strong><span>Rating</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><strong>{{ profile()!.reviewCount }}</strong><span>Reviews</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><strong>{{ profile()!.isVerified ? 'Yes' : 'No' }}</strong><span>Verified</span></div>
          </div>

          @if (profile()!.travelPreferences.length) {
            <div class="card">
              <div class="card-header"><mat-icon>luggage</mat-icon><h3>Travel Style</h3></div>
              <div class="prefs-grid">
                @for (pref of profile()!.travelPreferences; track pref) {
                  <div class="pref-chip" [style.background]="prefMeta(pref).color">
                    <span>{{ prefMeta(pref).icon }}</span>
                    <span>{{ prefMeta(pref).label }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .pub-profile { display:flex; flex-direction:column; gap:24px; }
    .hero-banner { border-radius:16px; overflow:hidden; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06); }
    .banner-bg { height:140px; background:linear-gradient(135deg,#0a0f28 0%,#1e2a6e 50%,#3a1f6e 100%); }
    .hero-content { display:flex; align-items:flex-end; gap:20px; padding:0 28px 24px; flex-wrap:wrap; }
    .avatar-section { position:relative; margin-top:-52px; flex-shrink:0; }
    .avatar { width:104px; height:104px; border-radius:50%; object-fit:cover; border:4px solid #fff; box-shadow:0 4px 16px rgba(0,0,0,.18); display:block; }
    .avatar-fallback { display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); font-size:40px; font-weight:700; color:#fff; }
    .verified-badge { position:absolute; bottom:4px; right:4px; width:26px; height:26px; border-radius:50%; background:#2563eb; border:2px solid #fff; display:flex; align-items:center; justify-content:center; }
    .verified-badge mat-icon { font-size:15px; width:15px; height:15px; color:#fff; }
    .hero-info { flex:1; min-width:200px; padding-top:12px; }
    .hero-info h1 { font-size:22px; font-weight:800; color:#0a0f28; margin:0 0 2px; }
    .bio { font-size:14px; color:#475569; font-style:italic; margin:0 0 10px; }
    .meta-row { display:flex; gap:16px; flex-wrap:wrap; }
    .meta-item { display:flex; align-items:center; gap:5px; font-size:12.5px; color:#64748b; }
    .meta-item mat-icon { font-size:15px; width:15px; height:15px; }
    .body-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .stats-card { grid-column:1/-1; display:flex; align-items:center; padding:20px 32px !important; }
    .card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:22px 24px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .card-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
    .card-header mat-icon { color:#ff6b2b; }
    .card-header h3 { margin:0; font-size:15px; font-weight:700; color:#0a0f28; }
    .stat-item { flex:1; text-align:center; }
    .stat-item strong { display:block; font-size:26px; font-weight:800; color:#0a0f28; }
    .stat-item span { font-size:12px; color:#94a3b8; }
    .stat-divider { width:1px; height:40px; background:#e2e8f0; }
    .prefs-grid { display:flex; flex-wrap:wrap; gap:8px; }
    .pref-chip { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; color:#374151; }
    @media (max-width:640px) { .body-grid { grid-template-columns:1fr; } .hero-content { padding:0 16px 20px; } }
  `],
})
export class PublicProfileComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private userService = inject(UserService);

  readonly loading = signal(true);
  readonly profile = signal<UserProfile | null>(null);

  prefMeta = (pref: TravelPreference) => PREF_META[pref];

  ngOnInit(): void {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (!uid) { this.loading.set(false); return; }
    this.userService.getProfile(uid).subscribe({
      next: (p) => { this.profile.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
