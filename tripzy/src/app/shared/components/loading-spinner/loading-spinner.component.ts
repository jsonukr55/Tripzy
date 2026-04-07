import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="spinner-wrapper">
      <mat-spinner [diameter]="diameter" />
      @if (message) {
        <p class="message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-wrapper {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 40px; gap: 16px;
    }
    .message { color: #666; margin: 0; }
  `],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 48;
  @Input() message = '';
}
