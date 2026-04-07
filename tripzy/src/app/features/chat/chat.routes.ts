import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CHAT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/chat-list/chat-list.component').then((m) => m.ChatListComponent),
      },
      {
        path: ':chatId',
        loadComponent: () =>
          import('./pages/chat-room/chat-room.component').then((m) => m.ChatRoomComponent),
      },
    ],
  },
];
