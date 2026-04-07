import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TRIPS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/trip-list/trip-list.component').then((m) => m.TripListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/trip-create/trip-create.component').then((m) => m.TripCreateComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/trip-detail/trip-detail.component').then((m) => m.TripDetailComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./pages/trip-edit/trip-edit.component').then((m) => m.TripEditComponent),
      },
      {
        path: ':id/requests',
        loadComponent: () =>
          import('./pages/trip-requests/trip-requests.component').then((m) => m.TripRequestsComponent),
      },
    ],
  },
];
