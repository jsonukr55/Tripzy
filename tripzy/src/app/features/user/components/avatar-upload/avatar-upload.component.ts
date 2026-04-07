import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="avatar-wrap" (click)="fileInput.click()">
      @if (photoURL()) {
        <img [src]="photoURL()" class="avatar-img" alt="Profile photo" />
      } @else {
        <div class="avatar-placeholder">
          <span>{{ initial }}</span>
        </div>
      }

      <div class="avatar-overlay">
        @if (uploading()) {
          <mat-spinner diameter="24" />
        } @else {
          <mat-icon>photo_camera</mat-icon>
          <span>Change</span>
        }
      </div>

      <input
        #fileInput
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden-input"
        (change)="onFileSelected($event)"
      />
    </div>
  `,
  styles: [`
    .avatar-wrap {
      position: relative; width: 100px; height: 100px;
      border-radius: 50%; cursor: pointer;
      flex-shrink: 0;
    }

    .avatar-img {
      width: 100%; height: 100%; border-radius: 50%;
      object-fit: cover; display: block;
      border: 3px solid #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,.15);
    }

    .avatar-placeholder {
      width: 100%; height: 100%; border-radius: 50%;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      display: flex; align-items: center; justify-content: center;
      border: 3px solid #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,.15);
      span { font-size: 36px; font-weight: 700; color: #fff; }
    }

    .avatar-overlay {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(0,0,0,.45);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 2px;
      opacity: 0; transition: opacity .2s;
      mat-icon { color: #fff; font-size: 22px; }
      span { color: #fff; font-size: 11px; font-weight: 600; }
    }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }

    .hidden-input { display: none; }
  `],
})
export class AvatarUploadComponent {
  @Input() photoURL    = signal<string | null>(null);
  @Input() initial     = 'T';
  @Input() uploading   = signal(false);
  @Output() fileChosen = new EventEmitter<File>();

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB');
      return;
    }
    this.fileChosen.emit(file);
  }
}
