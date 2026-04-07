import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'edit',
        loadComponent: () =>
          import('./pages/profile-edit/profile-edit.component').then((m) => m.ProfileEditComponent),
      },
      {
        path: ':uid',
        loadComponent: () =>
          import('./pages/public-profile/public-profile.component').then((m) => m.PublicProfileComponent),
      },
    ],
  },
];
