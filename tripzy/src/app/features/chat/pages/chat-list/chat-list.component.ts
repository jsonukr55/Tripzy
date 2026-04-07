import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../../../core/services/chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Chat } from '../../../../core/models/chat.model';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Messages</h1>
      </div>

      @if (loading()) {
        <div class="skeleton-list">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-row">
              <div class="skeleton avatar"></div>
              <div class="skeleton-body">
                <div class="skeleton line short"></div>
                <div class="skeleton line long"></div>
              </div>
            </div>
          }
        </div>
      } @else if (chats().length === 0) {
        <div class="empty">
          <mat-icon class="empty-icon">chat_bubble_outline</mat-icon>
          <h3>No conversations yet</h3>
          <p>Join a trip and start chatting with fellow travellers.</p>
          <a class="btn-primary" routerLink="/trips">Browse Trips</a>
        </div>
      } @else {
        <ul class="chat-list">
          @for (chat of chats(); track chat.id) {
            <li class="chat-row" [routerLink]="['/chat', chat.id]">
              <div class="chat-avatar" [class.group]="chat.type === 'group'">
                <mat-icon>{{ chat.type === 'group' ? 'groups' : 'person' }}</mat-icon>
              </div>

              <div class="chat-body">
                <div class="chat-header-row">
                  <span class="chat-name">{{ chatName(chat) }}</span>
                  <span class="chat-time">{{ chat.lastMessageAt | date:'shortTime' }}</span>
                </div>
                <div class="chat-preview-row">
                  <span class="chat-preview">{{ chat.lastMessage || 'No messages yet' }}</span>
                  @if (unread(chat) > 0) {
                    <span class="badge">{{ unread(chat) }}</span>
                  }
                </div>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 680px; margin: 0 auto; }

    .page-header {
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 24px; font-weight: 800; color: #0a0f28; margin: 0;
    }

    /* ── Empty ── */
    .empty {
      text-align: center; padding: 64px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; color: #cbd5e1; }
    .empty h3 { font-size: 18px; font-weight: 700; color: #0a0f28; margin: 0; }
    .empty p  { color: #64748b; margin: 0; }
    .btn-primary {
      margin-top: 8px; padding: 10px 24px; border-radius: 10px;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      color: #fff; font-weight: 700; font-size: 14px;
      text-decoration: none; display: inline-block;
    }

    /* ── Chat list ── */
    .chat-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: 2px;
    }
    .chat-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; border-radius: 14px;
      background: #fff; cursor: pointer;
      transition: background .15s;
      text-decoration: none; color: inherit;
      border: 1px solid #f1f5f9;
    }
    .chat-row:hover { background: #f8fafc; }

    .chat-avatar {
      width: 46px; height: 46px; border-radius: 50%;
      background: #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: #64748b;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .chat-avatar.group {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }

    .chat-body { flex: 1; min-width: 0; }
    .chat-header-row {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 8px; margin-bottom: 4px;
    }
    .chat-name {
      font-size: 15px; font-weight: 700; color: #0a0f28;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .chat-time { font-size: 12px; color: #94a3b8; flex-shrink: 0; }

    .chat-preview-row {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .chat-preview {
      font-size: 13px; color: #64748b;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .badge {
      min-width: 20px; height: 20px; border-radius: 10px;
      background: #ff6b2b; color: #fff;
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      padding: 0 6px; flex-shrink: 0;
    }

    /* ── Skeleton ── */
    .skeleton-list { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; background: #fff; border-radius: 14px;
    }
    .skeleton { background: #f1f5f9; border-radius: 8px; animation: pulse 1.5s ease-in-out infinite; }
    .skeleton.avatar { width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0; }
    .skeleton-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .skeleton.line { height: 12px; }
    .skeleton.short { width: 40%; }
    .skeleton.long  { width: 75%; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .45; }
    }
  `],
})
export class ChatListComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private auth        = inject(AuthService);
  private router      = inject(Router);

  chats   = signal<Chat[]>([]);
  loading = signal(true);

  private sub?: Subscription;

  ngOnInit(): void {
    const uid = this.auth.uid;
    if (!uid) { this.router.navigateByUrl('/auth/login'); return; }

    this.sub = this.chatService.getMyChats(uid).subscribe({
      next: (c) => { this.chats.set(c); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  chatName(chat: Chat): string {
    if (chat.type === 'group') return (chat as unknown as Record<string,unknown>)['tripTitle'] as string ?? 'Group Chat';
    const uid = this.auth.uid ?? '';
    const other = chat.participantIds.find((id) => id !== uid);
    return other ? (chat.participantNames[other] ?? 'Unknown') : 'Unknown';
  }

  unread(chat: Chat): number {
    const uid = this.auth.uid ?? '';
    return chat.unreadCount?.[uid] ?? 0;
  }
}
