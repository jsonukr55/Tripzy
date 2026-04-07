import { Routes } from '@angular/router';

export const REQUESTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/my-requests/my-requests.component').then(m => m.MyRequestsComponent),
  },
];
