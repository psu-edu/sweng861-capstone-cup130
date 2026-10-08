import { Routes } from '@angular/router';

import { AppShell } from './layout/app-shell/app-shell';
import { Dashboard } from './pages/dashboard/dashboard';
import { Placeholder } from './pages/placeholder/placeholder';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'housing-preferences',
        component: Placeholder,
        data: {
          title: 'Housing Preferences',
          description:
            'Choose your preferred residence hall and room style.',
        },
      },
      {
        path: 'application',
        component: Placeholder,
        data: {
          title: 'My Application',
          description:
            'Review and manage your Campus Rental housing application.',
        },
      },
      {
        path: 'housing',
        component: Placeholder,
        data: {
          title: 'My Housing',
          description:
            'View your assigned university housing.',
        },
      },
      {
        path: 'roommates',
        component: Placeholder,
        data: {
          title: 'Roommates',
          description:
            'Manage direct roommate requests and roommate matching.',
        },
      },
      {
        path: 'lease',
        component: Placeholder,
        data: {
          title: 'My Lease',
          description:
            'Review your housing lease and signature status.',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];