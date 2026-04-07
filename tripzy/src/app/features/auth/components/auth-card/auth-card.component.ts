import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="auth-shell">

      <!-- ── LEFT HERO PANEL ── -->
      <div class="hero-panel">
        <div class="hero-inner">

          <a routerLink="/" class="brand">
            <div class="brand-icon">✈</div>
            <span>Tripzy</span>
          </a>

          <div class="hero-copy">
            <h1>Find your people.<br>Explore together.</h1>
            <p>
              Join thousands of travellers who plan smarter,
              spend less, and experience more — together.
            </p>
          </div>

          <ul class="feature-list">
            <li>
              <span class="feat-icon">🗺️</span>
              <div>
                <strong>Discover trips</strong>
                <span>Browse curated trips that match your vibe</span>
              </div>
            </li>
            <li>
              <span class="feat-icon">🤝</span>
              <div>
                <strong>Meet co-travellers</strong>
                <span>Connect with verified, like-minded travellers</span>
              </div>
            </li>
            <li>
              <span class="feat-icon">💰</span>
              <div>
                <strong>Split everything</strong>
                <span>Fair cost-sharing built right in</span>
              </div>
            </li>
          </ul>

          <div class="hero-stat">
            <div class="stat">
              <strong>12K+</strong>
              <span>Trips created</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <strong>48K+</strong>
              <span>Travellers joined</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <strong>90+</strong>
              <span>Countries</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ── RIGHT FORM PANEL ── -->
      <div class="form-panel">
        <div class="form-inner">

          <!-- mobile logo -->
          <a routerLink="/" class="mobile-brand">
            <div class="brand-icon-sm">✈</div>
            <span>Tripzy</span>
          </a>

          <div class="form-header">
            <h2>{{ title }}</h2>
            <p>{{ subtitle }}</p>
          </div>

          <ng-content />

        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Shell ── */
    .auth-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }

    /* ── Hero Panel ── */
    .hero-panel {
      background:
        linear-gradient(160deg, rgba(10,15,40,.97) 0%, rgba(20,30,80,.95) 60%, rgba(30,10,60,.97) 100%),
        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="400" height="400" filter="url(%23n)" opacity=".05"/></svg>');
      color: #fff;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    /* animated orbs */
    .hero-panel::before {
      content: '';
      position: absolute;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,107,43,.18) 0%, transparent 70%);
      top: -100px; right: -80px;
      animation: float 8s ease-in-out infinite;
    }
    .hero-panel::after {
      content: '';
      position: absolute;
      width: 350px; height: 350px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 70%);
      bottom: -80px; left: -60px;
      animation: float 10s ease-in-out infinite reverse;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50%       { transform: translateY(-30px) scale(1.05); }
    }

    .hero-inner {
      position: relative; z-index: 1;
      padding: 48px;
      display: flex; flex-direction: column; gap: 36px;
      width: 100%;
    }

    /* Brand */
    .brand {
      display: inline-flex; align-items: center; gap: 10px;
      text-decoration: none; color: inherit;
    }
    .brand-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .brand span {
      font-size: 22px; font-weight: 800;
      letter-spacing: -0.5px;
    }

    /* Hero copy */
    .hero-copy h1 {
      font-size: clamp(28px, 3vw, 40px);
      font-weight: 800; line-height: 1.2;
      margin: 0 0 14px;
      letter-spacing: -1px;
    }
    .hero-copy p {
      font-size: 15px; color: rgba(255,255,255,.65);
      margin: 0; line-height: 1.6;
    }

    /* Features */
    .feature-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: 18px;
    }
    .feature-list li {
      display: flex; align-items: flex-start; gap: 14px;
    }
    .feat-icon {
      font-size: 22px; flex-shrink: 0; margin-top: 1px;
    }
    .feature-list li div { display: flex; flex-direction: column; gap: 2px; }
    .feature-list li strong { font-size: 14px; font-weight: 600; }
    .feature-list li span { font-size: 13px; color: rgba(255,255,255,.55); }

    /* Stats */
    .hero-stat {
      display: flex; align-items: center; gap: 0;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 14px; padding: 16px 20px;
      backdrop-filter: blur(10px);
    }
    .stat { flex: 1; text-align: center; }
    .stat strong { display: block; font-size: 22px; font-weight: 800; color: #ff9f1c; }
    .stat span { font-size: 12px; color: rgba(255,255,255,.5); }
    .stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,.1); }

    /* ── Form Panel ── */
    .form-panel {
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      padding: 40px 24px;
      overflow-y: auto;
    }

    .form-inner {
      width: 100%; max-width: 420px;
      display: flex; flex-direction: column; gap: 0;
    }

    .mobile-brand {
      display: none;
      align-items: center; gap: 10px;
      text-decoration: none; color: #0a0f28;
      margin-bottom: 28px;
    }
    .brand-icon-sm {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .mobile-brand span { font-size: 20px; font-weight: 800; }

    .form-header { margin-bottom: 28px; }
    .form-header h2 {
      font-size: 26px; font-weight: 800;
      color: #0a0f28; margin: 0 0 6px;
      letter-spacing: -0.5px;
    }
    .form-header p {
      font-size: 14px; color: #64748b; margin: 0;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .auth-shell { grid-template-columns: 1fr; }
      .hero-panel { display: none; }
      .mobile-brand { display: flex; }
      .form-panel { padding: 32px 20px; align-items: flex-start; padding-top: 40px; }
    }
  `],
})
export class AuthCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
