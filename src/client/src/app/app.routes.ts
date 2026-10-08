import { Routes } from '@angular/router';

import { authGuardFn } from '@auth0/auth0-angular';
import { Login } from './pages/login/login';
import { AppShell } from './layout/app-shell/app-shell';
import { Dashboard } from './pages/dashboard/dashboard';
import { Placeholder } from './pages/placeholder/placeholder';
import {StudentProfilePage} from './pages/student-profile/student-profile';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: AppShell,
    canActivate: [
      authGuardFn,
    ],
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
      {
        path: 'inventory',
        component: Placeholder,
        data: {
          title: 'Housing Inventory',
          description:
            'Manage residence halls, rooms, and beds.',
        },
      },
      {
        path: 'applications',
        component: Placeholder,
        data: {
          title: 'Applications',
          description:
            'Review student housing applications.',
        },
      },
      {
        path: 'assignments',
        component: Placeholder,
        data: {
          title: 'Assignments',
          description:
            'Manage student housing assignments.',
        },
      },
      {
        path: 'profile',
        component: StudentProfilePage,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];