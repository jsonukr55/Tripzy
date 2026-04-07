import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="empty-state">
      <mat-icon class="icon">{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      @if (actionLabel && actionLink) {
        <a mat-raised-button color="primary" [routerLink]="actionLink">
          {{ actionLabel }}
        </a>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 60px 20px; text-align: center; gap: 12px;
    }
    .icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
    h3 { margin: 0; color: #333; }
    p { margin: 0; color: #666; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() actionLink = '';
}
