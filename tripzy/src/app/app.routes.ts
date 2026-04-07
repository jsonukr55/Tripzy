import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public auth routes (no layout shell)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // Protected app routes (with layout shell)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'trips',
        loadChildren: () =>
          import('./features/trips/trips.routes').then((m) => m.TRIPS_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/user/user.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'requests',
        loadChildren: () =>
          import('./features/requests/requests.routes').then((m) => m.REQUESTS_ROUTES),
      },
      {
        path: 'chat',
        loadChildren: () =>
          import('./features/chat/chat.routes').then((m) => m.CHAT_ROUTES),
      },
      { path: '', redirectTo: 'trips', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: 'trips' },
];
