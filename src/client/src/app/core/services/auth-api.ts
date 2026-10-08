import {
  HttpClient,
} from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

export type UserRole =
  | 'STUDENT'
  | 'HOUSING_OFFICER';

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}

interface CurrentUserResponse {
  authenticated: true;
  user: CurrentUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly http =
    inject(HttpClient);

  getCurrentUser() {
    return this.http.get<CurrentUserResponse>(
      '/api/auth/me',
    );
  }
}