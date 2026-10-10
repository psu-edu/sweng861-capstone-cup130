import { Routes } from '@angular/router';
import { authGuardFn } from '@auth0/auth0-angular';

import { AppShell } from './layout/app-shell/app-shell';
import { Dashboard } from './pages/dashboard/dashboard';
import { HousingApplicationsPage } from './pages/housing-applications/housing-applications';
import { HousingAssignmentsPage } from './pages/housing-assignments/housing-assignments';
import { HousingInventoryPage } from './pages/housing-inventory/housing-inventory';
import { HousingOptionsPage } from './pages/housing-options/housing-options';
import { Login } from './pages/login/login';
import { MyHousingPage } from './pages/my-housing/my-housing';
import { Placeholder } from './pages/placeholder/placeholder';
import {RoommateMatchingPage} from './pages/roommate-matching/roommate-matching';
import {RoommateProfilePage} from './pages/roommate-profile/roommate-profile';
import {RoommateRequestsPage} from './pages/roommate-requests/roommate-requests';
import { StudentApplicationPage } from './pages/student-application/student-application';
import { StudentProfilePage } from './pages/student-profile/student-profile';


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
        component: HousingOptionsPage,
      },
      {
        path: 'application',
        component: StudentApplicationPage,
      },
      {
        path: 'housing',
        component: MyHousingPage,
      },
      {
        path: 'roommates/profile',
        component: RoommateProfilePage,
      },
      {
        path:'roommates/requests',
        component: RoommateRequestsPage,
      },
      {
        path:'roommates',
        component: RoommateMatchingPage,
      },
      {
        path: 'lease',
        component: Placeholder,
        data: {
          title: 'My Lease',
          description: 'Review your housing lease and signature status.',
        },
      },
      {
        path: 'inventory',
        component: HousingInventoryPage,
      },
      {
        path: 'applications',
        component: HousingApplicationsPage,
      },
      {
        path: 'assignments',
        component: HousingAssignmentsPage,
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