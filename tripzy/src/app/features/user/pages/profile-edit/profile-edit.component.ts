import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { StorageService } from '../../../../core/services/storage.service';
import { UserProfile, TravelPreference } from '../../../../core/models/user.model';
import { AvatarUploadComponent } from '../../components/avatar-upload/avatar-upload.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

interface PrefOption { value: TravelPreference; icon: string; label: string; desc: string; }

const PREF_OPTIONS: PrefOption[] = [
  { value: 'budget',    icon: '💸', label: 'Budget',    desc: 'Stretch every rupee' },
  { value: 'luxury',    icon: '💎', label: 'Luxury',    desc: 'Only the finest' },
  { value: 'adventure', icon: '🏕️', label: 'Adventure', desc: 'Off the beaten path' },
  { value: 'workation', icon: '💻', label: 'Workation', desc: 'Work & travel blend' },
  { value: 'cultural',  icon: '🏛️', label: 'Cultural',  desc: 'History & local life' },
  { value: 'solo',      icon: '🧍', label: 'Solo',      desc: 'Independent explorer' },
  { value: 'group',     icon: '👥', label: 'Group',     desc: 'Strength in numbers' },
];

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    AvatarUploadComponent, LoadingSpinnerComponent,
  ],
  template: `
    @if (pageLoading()) {
      <app-loading-spinner message="Loading profile..." />
    } @else {
      <div class="edit-page">
        <div class="page-top">
          <a class="back-btn" routerLink="/profile">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <div>
            <h1>Edit Profile</h1>
            <p>Update your info and travel style</p>
          </div>
        </div>
        <div class="edit-grid">
          <div class="card avatar-card">
            <app-avatar-upload [photoURL]="photoURL" [initial]="initial" [uploading]="avatarUploading" (fileChosen)="onAvatarChosen($event)" />
            <div class="avatar-name">{{ form.get('displayName')?.value || 'Your Name' }}</div>
            <div class="avatar-email">{{ email }}</div>
            <p class="avatar-hint">Click photo to change · Max 5 MB</p>
          </div>
          <div class="card form-card">
            <form [formGroup]="form" (ngSubmit)="onSave()">
              <section class="form-section">
                <h3>Basic Info</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Display Name</mat-label>
                  <input matInput formControlName="displayName" />
                  @if (f['displayName'].hasError('required') && f['displayName'].touched) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Bio</mat-label>
                  <textarea matInput formControlName="bio" rows="3" placeholder="Tell fellow travellers about yourself..."></textarea>
                  <mat-hint align="end">{{ form.get('bio')?.value?.length ?? 0 }}/200</mat-hint>
                  @if (f['bio'].hasError('maxlength')) { <mat-error>Max 200 characters</mat-error> }
                </mat-form-field>
              </section>
              <section class="form-section">
                <h3>Travel Style</h3>
                <p class="section-hint">Select all that describe how you like to travel</p>
                <div class="prefs-grid">
                  @for (opt of prefOptions; track opt.value) {
                    <button type="button" class="pref-btn" [class.pref-btn--selected]="isPrefSelected(opt.value)" (click)="togglePref(opt.value)">
                      <span class="pref-icon">{{ opt.icon }}</span>
                      <span class="pref-label">{{ opt.label }}</span>
                      <span class="pref-desc">{{ opt.desc }}</span>
                      @if (isPrefSelected(opt.value)) { <span class="pref-check"><mat-icon>check_circle</mat-icon></span> }
                    </button>
                  }
                </div>
              </section>
              <div class="form-actions">
                <a mat-stroked-button routerLink="/profile" class="cancel-btn">Cancel</a>
                <button class="save-btn" type="submit" [disabled]="saving()">
                  @if (saving()) { <mat-spinner diameter="18" /> } @else { <mat-icon>check</mat-icon> }
                  {{ saving() ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .edit-page { display:flex; flex-direction:column; gap:24px; }
    .page-top { display:flex; align-items:center; gap:14px; }
    .page-top h1 { margin:0; font-size:22px; font-weight:800; color:#0a0f28; }
    .page-top p { margin:2px 0 0; font-size:13px; color:#64748b; }
    .back-btn { width:40px; height:40px; border-radius:10px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#475569; text-decoration:none; flex-shrink:0; }
    .back-btn mat-icon { font-size:20px; }
    .back-btn:hover { background:#f8fafc; }
    .edit-grid { display:grid; grid-template-columns:260px 1fr; gap:20px; align-items:start; }
    .card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .avatar-card { padding:28px 20px; display:flex; flex-direction:column; align-items:center; gap:10px; position:sticky; top:20px; }
    .avatar-name { font-size:16px; font-weight:700; color:#0a0f28; }
    .avatar-email { font-size:12.5px; color:#94a3b8; }
    .avatar-hint { font-size:11.5px; color:#cbd5e1; margin:0; text-align:center; }
    .form-card { padding:28px; }
    form { display:flex; flex-direction:column; gap:28px; }
    .form-section { display:flex; flex-direction:column; gap:14px; }
    .form-section h3 { margin:0; font-size:15px; font-weight:700; color:#0a0f28; }
    .section-hint { margin:-6px 0 0; font-size:12.5px; color:#94a3b8; }
    .prefs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:10px; }
    .pref-btn { position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:14px 14px 12px; border-radius:12px; background:#f8fafc; border:1.5px solid #e2e8f0; cursor:pointer; text-align:left; transition:border-color .15s,background .15s; }
    .pref-btn:hover { border-color:#ff9f1c; background:#fffaf5; }
    .pref-btn--selected { border-color:#ff6b2b !important; background:linear-gradient(135deg,#fff4ee,#fff9f0) !important; }
    .pref-icon { font-size:22px; margin-bottom:4px; }
    .pref-label { font-size:13px; font-weight:700; color:#1e293b; }
    .pref-desc { font-size:11px; color:#94a3b8; }
    .pref-check { position:absolute; top:8px; right:8px; }
    .pref-check mat-icon { font-size:18px; width:18px; height:18px; color:#ff6b2b; }
    .form-actions { display:flex; align-items:center; justify-content:flex-end; gap:12px; padding-top:8px; border-top:1px solid #f1f5f9; }
    .cancel-btn { border-color:#e2e8f0 !important; color:#475569 !important; font-weight:600 !important; }
    .save-btn { display:flex; align-items:center; gap:8px; padding:0 24px; height:44px; background:linear-gradient(135deg,#ff6b2b,#ff9f1c); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(255,107,43,.3); transition:opacity .15s,transform .1s; }
    .save-btn mat-icon { font-size:18px; width:18px; height:18px; }
    .save-btn:hover:not(:disabled) { opacity:.92; transform:translateY(-1px); }
    .save-btn:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; }
    @media (max-width:800px) { .edit-grid { grid-template-columns:1fr; } .avatar-card { position:static; } }
  `],
})
export class ProfileEditComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private auth        = inject(AuthService);
  private userService = inject(UserService);
  private storage     = inject(StorageService);
  private router      = inject(Router);
  private snackBar    = inject(MatSnackBar);

  readonly pageLoading     = signal(true);
  readonly saving          = signal(false);
  readonly avatarUploading = signal(false);
  readonly photoURL        = signal<string | null>(null);
  readonly selectedPrefs   = signal<TravelPreference[]>([]);

  prefOptions = PREF_OPTIONS;
  email = '';

  get initial(): string { return (this.form.get('displayName')?.value?.[0] ?? 'T').toUpperCase(); }

  form = this.fb.group({
    displayName: ['', Validators.required],
    bio:         ['', Validators.maxLength(200)],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    const uid = this.auth.uid;
    if (!uid) return;
    this.userService.getProfile(uid).subscribe((profile) => {
      if (profile) {
        this.form.patchValue({ displayName: profile.displayName, bio: profile.bio });
        this.photoURL.set(profile.photoURL);
        this.selectedPrefs.set(profile.travelPreferences ?? []);
        this.email = profile.email;
      }
      this.pageLoading.set(false);
    });
  }

  isPrefSelected(pref: TravelPreference): boolean { return this.selectedPrefs().includes(pref); }

  togglePref(pref: TravelPreference): void {
    const c = this.selectedPrefs();
    this.selectedPrefs.set(c.includes(pref) ? c.filter(p => p !== pref) : [...c, pref]);
  }

  onAvatarChosen(file: File): void {
    const uid = this.auth.uid!;
    this.avatarUploading.set(true);
    const reader = new FileReader();
    reader.onload = (e) => this.photoURL.set(e.target?.result as string);
    reader.readAsDataURL(file);
    const ext  = file.name.split('.').pop();
    const path = this.storage.getProfileImagePath(uid, 'avatar_' + Date.now() + '.' + ext);
    this.storage.uploadFile(path, file).subscribe({
      next: (p) => {
        if (p.downloadURL) {
          this.photoURL.set(p.downloadURL);
          this.userService.updateProfile(uid, { photoURL: p.downloadURL }).subscribe();
          this.avatarUploading.set(false);
          this.snackBar.open('Photo updated!', undefined, { duration: 2000 });
        }
      },
      error: () => {
        this.snackBar.open('Upload failed.', 'Dismiss', { duration: 3000 });
        this.avatarUploading.set(false);
      },
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const data: Partial<UserProfile> = {
      displayName:       this.form.value.displayName!,
      bio:               this.form.value.bio ?? '',
      travelPreferences: this.selectedPrefs(),
    };
    this.userService.updateProfile(this.auth.uid!, data).subscribe({
      next: () => {
        this.snackBar.open('Profile saved!', undefined, { duration: 2500 });
        this.saving.set(false);
        this.router.navigateByUrl('/profile');
      },
      error: () => {
        this.snackBar.open('Save failed.', 'Dismiss', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }
}
