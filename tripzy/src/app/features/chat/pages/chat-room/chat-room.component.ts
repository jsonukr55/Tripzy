import {
  Component, inject, signal, OnInit, OnDestroy,
  AfterViewChecked, ViewChild, ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../../../core/services/chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Message, Chat } from '../../../../core/models/chat.model';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [FormsModule, DatePipe, MatIconModule],
  template: `
    <div class="room-shell">

      <!-- ── Header ── -->
      <div class="room-header">
        <button class="back-btn" (click)="router.navigateByUrl('/chat')">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <span class="header-name">{{ chatName() }}</span>
          @if (chat()?.type === 'group') {
            <span class="header-sub">{{ chat()?.participantIds?.length }} members</span>
          }
        </div>
      </div>

      <!-- ── Messages ── -->
      <div class="messages-area" #scrollArea>
        @if (loading()) {
          <div class="loading-hint">Loading messages…</div>
        } @else if (messages().length === 0) {
          <div class="empty-hint">
            <mat-icon>chat</mat-icon>
            <p>No messages yet. Say hello!</p>
          </div>
        } @else {
          @for (msg of messages(); track msg.id) {
            <div class="msg-row" [class.mine]="msg.senderId === myUid">
              @if (msg.senderId !== myUid) {
                <div class="avatar-sm">{{ msg.senderName[0]?.toUpperCase() }}</div>
              }
              <div class="bubble-wrap">
                @if (msg.senderId !== myUid) {
                  <span class="sender-name">{{ msg.senderName }}</span>
                }
                <div class="bubble" [class.mine]="msg.senderId === myUid">
                  @if (msg.type === 'system') {
                    <em>{{ msg.content }}</em>
                  } @else {
                    {{ msg.content }}
                  }
                </div>
                <span class="msg-time">{{ msg.createdAt | date:'shortTime' }}</span>
              </div>
            </div>
          }
        }
      </div>

      <!-- ── Input ── -->
      <div class="input-bar">
        <input
          class="msg-input"
          type="text"
          placeholder="Type a message…"
          [(ngModel)]="draft"
          (keydown.enter)="send()"
          [disabled]="sending()"
          maxlength="1000"
        />
        <button
          class="send-btn"
          (click)="send()"
          [disabled]="!draft.trim() || sending()"
        >
          <mat-icon>send</mat-icon>
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .room-shell {
      display: flex; flex-direction: column;
      height: calc(100vh - 56px);  /* subtract layout content padding */
      margin: -28px -32px;         /* bleed to edges of .content */
      background: #f8fafc;
    }

    /* ── Header ── */
    .room-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .back-btn {
      width: 36px; height: 36px; border-radius: 8px;
      background: transparent; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #475569;
      transition: background .15s;
      mat-icon { font-size: 20px; }
      &:hover { background: #f1f5f9; }
    }
    .header-info { display: flex; flex-direction: column; }
    .header-name { font-size: 16px; font-weight: 700; color: #0a0f28; }
    .header-sub  { font-size: 12px; color: #64748b; }

    /* ── Messages ── */
    .messages-area {
      flex: 1; overflow-y: auto;
      padding: 20px 20px 12px;
      display: flex; flex-direction: column; gap: 12px;
    }

    .loading-hint, .empty-hint {
      text-align: center; color: #94a3b8;
      margin: auto; display: flex; flex-direction: column; align-items: center; gap: 8px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; }
      p { font-size: 14px; margin: 0; }
    }

    .msg-row {
      display: flex; align-items: flex-end; gap: 8px;
      &.mine { flex-direction: row-reverse; }
    }

    .avatar-sm {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .bubble-wrap {
      display: flex; flex-direction: column; gap: 3px;
      max-width: 68%;
      .mine & { align-items: flex-end; }
    }

    .sender-name { font-size: 11px; color: #94a3b8; padding-left: 2px; }

    .bubble {
      padding: 10px 14px; border-radius: 18px;
      font-size: 14px; line-height: 1.5;
      background: #fff; color: #0a0f28;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      word-break: break-word;

      &.mine {
        background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
        color: #fff; border: none;
        border-bottom-right-radius: 4px;
        border-bottom-left-radius: 18px;
      }
    }

    .msg-time { font-size: 10px; color: #cbd5e1; padding: 0 2px; }

    /* ── Input ── */
    .input-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      background: #fff; border-top: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .msg-input {
      flex: 1; padding: 10px 16px; border-radius: 24px;
      border: 1.5px solid #e2e8f0; font-size: 14px;
      outline: none; background: #f8fafc;
      transition: border-color .15s;
      &:focus { border-color: #ff6b2b; background: #fff; }
    }
    .send-btn {
      width: 42px; height: 42px; border-radius: 50%;
      background: linear-gradient(135deg, #ff6b2b, #ff9f1c);
      border: none; cursor: pointer; color: #fff;
      display: flex; align-items: center; justify-content: center;
      transition: opacity .15s;
      mat-icon { font-size: 20px; }
      &:disabled { opacity: .4; cursor: default; }
    }

    @media (max-width: 900px) {
      .room-shell { margin: -20px -16px; }
    }
  `],
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  private chatService = inject(ChatService);
  readonly auth       = inject(AuthService);
  readonly router     = inject(Router);
  private route       = inject(ActivatedRoute);

  @ViewChild('scrollArea') private scrollArea!: ElementRef<HTMLDivElement>;

  messages = signal<Message[]>([]);
  chat     = signal<Chat | null>(null);
  loading  = signal(true);
  sending  = signal(false);

  draft = '';
  private shouldScroll = true;
  private chatId = '';
  private subs: Subscription[] = [];

  get myUid(): string { return this.auth.uid ?? ''; }

  ngOnInit(): void {
    this.chatId = this.route.snapshot.paramMap.get('chatId') ?? '';
    if (!this.chatId) { this.router.navigateByUrl('/chat'); return; }

    // Listen for real-time messages
    const msgSub = this.chatService.getMessages(this.chatId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.loading.set(false);
        this.shouldScroll = true;
      },
      error: () => this.loading.set(false),
    });

    // Mark as read
    this.chatService.markAsRead(this.chatId, this.myUid).subscribe();

    // Load chat meta via the chat list stream (reuse existing subscription)
    const chatSub = this.chatService.getMyChats(this.myUid).subscribe((chats) => {
      const found = chats.find((c) => c.id === this.chatId);
      if (found) this.chat.set(found);
    });

    this.subs.push(msgSub, chatSub);
  }

  ngOnDestroy(): void { this.subs.forEach((s) => s.unsubscribe()); }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  chatName(): string {
    const c = this.chat();
    if (!c) return 'Chat';
    if (c.type === 'group') return (c as unknown as Record<string,unknown>)['tripTitle'] as string ?? 'Group Chat';
    const other = c.participantIds.find((id) => id !== this.myUid);
    return other ? (c.participantNames[other] ?? 'Unknown') : 'Unknown';
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.sending()) return;

    const user = this.auth.currentUser();
    if (!user) return;

    this.sending.set(true);
    this.draft = '';

    this.chatService.sendMessage(
      this.chatId,
      user.uid,
      user.displayName ?? 'Anonymous',
      user.photoURL,
      text,
    ).subscribe({
      next: () => { this.sending.set(false); this.shouldScroll = true; },
      error: () => { this.sending.set(false); this.draft = text; },
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.scrollArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { /* noop */ }
  }
}
