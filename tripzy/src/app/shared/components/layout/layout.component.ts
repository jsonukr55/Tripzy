import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatMenuModule, MatButtonModule, MatRippleModule,
  ],
  template: `
    <div class="shell" [class.mobile]="isMobile()">

      <!-- ── SIDEBAR ── -->
      @if (!isMobile() || drawerOpen()) {
        <aside class="sidebar" [class.overlay]="isMobile()">
          @if (isMobile()) {
            <div class="overlay-backdrop" (click)="drawerOpen.set(false)"></div>
          }
          <div class="sidebar-inner">

            <div class="sidebar-brand">
              <div class="brand-icon">✈</div>
              <span class="brand-name">Tripzy</span>
            </div>

            <nav class="nav">
              @for (item of navItems; track item.route) {
                <a
                  class="nav-item"
                  [routerLink]="item.route"
                  routerLinkActive="nav-item--active"
                  [routerLinkActiveOptions]="{ exact: item.route === '/trips' }"
                  (click)="isMobile() && drawerOpen.set(false)"
                  matRipple
                >
                  <div class="nav-icon-wrap">
                    <mat-icon>{{ item.icon }}</mat-icon>
                    @if (item.route === '/chat' && totalUnread() > 0) {
                      <span class="nav-badge">{{ totalUnread() > 99 ? '99+' : totalUnread() }}</span>
                    }
                  </div>
                  <span>{{ item.label }}</span>
                </a>
              }
            </nav>

            <div class="sidebar-footer">
              <a class="nav-item" routerLink="/profile" routerLinkActive="nav-item--active" matRipple
                (click)="isMobile() && drawerOpen.set(false)">
                @if (auth.currentUser()?.photoURL) {
                  <img class="avatar" [src]="auth.currentUser()!.photoURL!" alt="avatar" />
                } @else {
                  <div class="avatar">{{ initial }}</div>
                }
                <div class="user-info">
                  <span class="user-name">{{ userName }}</span>
                  <span class="user-sub">View profile</span>
                </div>
              </a>
              <button class="signout-btn" (click)="auth.signOut().subscribe()">
                <mat-icon>logout</mat-icon>
              </button>
            </div>

          </div>
        </aside>
      }

      <!-- ── MAIN ── -->
      <div class="main-area">

        <!-- Top bar (mobile only) -->
        @if (isMobile()) {
          <header class="topbar">
            <button class="icon-btn" (click)="drawerOpen.set(!drawerOpen())">
              <mat-icon>{{ drawerOpen() ? 'close' : 'menu' }}</mat-icon>
            </button>
            <div class="topbar-brand">
              <div class="brand-icon-sm">✈</div>
              <span>Tripzy</span>
            </div>
            <a class="icon-btn" routerLink="/profile">
              <mat-icon>account_circle</mat-icon>
            </a>
          </header>
        }

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ── Shell ── */
    .shell {
      display: flex; height: 100vh; overflow: hidden;
      background: #f1f5f9;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 252px; flex-shrink: 0;
      background: #0a0f28;
      display: flex; flex-direction: column;
      position: relative; z-index: 200;
    }
    .sidebar.overlay {
      position: fixed; inset: 0;
      background: transparent;
      width: 100%;
    }
    .overlay-backdrop {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.5);
    }
    .sidebar-inner {
      width: 252px; height: 100%;
      background: #0a0f28;
      display: flex; flex-direction: column;
      position: relative; z-index: 1;
    }

    .sidebar-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 22px 20px 18px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; flex-shrink: 0;
    }
    .brand-icon-sm {
      width: 28px; height: 28px; border-radius: 7px;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
    }
    .brand-name {
      font-size: 18px; font-weight: 800; color: #fff;
      letter-spacing: -0.3px;
    }

    /* ── Nav ── */
    .nav {
      flex: 1; padding: 12px 10px;
      display: flex; flex-direction: column; gap: 2px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 12px; border-radius: 10px;
      text-decoration: none; color: rgba(255,255,255,.6);
      font-size: 14px; font-weight: 500;
      transition: background .15s, color .15s;
      cursor: pointer;
      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    }
    .nav-item:hover { background: rgba(255,255,255,.07); color: #fff; }
    .nav-item--active {
      background: rgba(255,107,43,.15) !important;
      color: #ff9f1c !important;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 10px;
      border-top: 1px solid rgba(255,255,255,.06);
      display: flex; align-items: center; gap: 4px;
    }
    .sidebar-footer .nav-item { flex: 1; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; min-width: 0; }
    .user-name {
      font-size: 13px; font-weight: 600; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .user-sub { font-size: 11px; color: rgba(255,255,255,.4); }
    .signout-btn {
      width: 36px; height: 36px; border-radius: 8px;
      background: transparent; border: none;
      color: rgba(255,255,255,.4); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s; flex-shrink: 0;
      mat-icon { font-size: 20px; }
      &:hover { background: rgba(255,255,255,.07); color: #fff; }
    }

    /* ── Main area ── */
    .main-area {
      flex: 1; display: flex; flex-direction: column;
      overflow: hidden; min-width: 0;
    }

    /* ── Topbar (mobile) ── */
    .topbar {
      height: 56px; background: #fff; flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 12px;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .topbar-brand {
      display: flex; align-items: center; gap: 8px;
      font-size: 17px; font-weight: 800; color: #0a0f28;
    }
    .icon-btn {
      width: 38px; height: 38px; border-radius: 8px;
      background: transparent; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #475569; text-decoration: none;
      transition: background .15s;
      mat-icon { font-size: 22px; }
      &:hover { background: #f1f5f9; }
    }

    .nav-icon-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
    .nav-badge {
      position: absolute; top: -6px; right: -8px;
      min-width: 16px; height: 16px; border-radius: 8px;
      background: #ff6b2b; color: #fff;
      font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
    }

    /* ── Content ── */
    .content {
      flex: 1; overflow-y: auto;
      padding: 28px 32px;
    }

    @media (max-width: 900px) {
      .content { padding: 20px 16px; }
    }
  `],
})
export class LayoutComponent implements OnInit, OnDestroy {
  auth        = inject(AuthService);
  private chatService = inject(ChatService);
  drawerOpen  = signal(false);
  totalUnread = signal(0);

  private chatSub?: Subscription;
  private breakpoints = inject(BreakpointObserver);
  isMobile = toSignal(
    this.breakpoints.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  ngOnInit(): void {
    const uid = this.auth.uid;
    if (!uid) return;
    this.chatSub = this.chatService.getMyChats(uid).subscribe((chats) => {
      const total = chats.reduce((sum, c) => sum + (c.unreadCount?.[uid] ?? 0), 0);
      this.totalUnread.set(total);
    });
  }

  ngOnDestroy(): void { this.chatSub?.unsubscribe(); }

  get userName(): string {
    return this.auth.currentUser()?.displayName ?? 'Traveller';
  }
  get initial(): string {
    return (this.auth.currentUser()?.displayName ?? 'T')[0].toUpperCase();
  }

  navItems: NavItem[] = [
    { icon: 'explore',   label: 'Discover',     route: '/trips' },
    { icon: 'add_circle',label: 'Create Trip',   route: '/trips/create' },
    { icon: 'group_add', label: 'Requests',      route: '/requests' },
    { icon: 'chat',      label: 'Messages',      route: '/chat' },
  ];
}
