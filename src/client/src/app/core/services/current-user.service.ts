import {
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  AuthApi,
  type CurrentUser,
} from './auth-api';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  private readonly authApi =
    inject(AuthApi);

  readonly user =
    signal<CurrentUser | null>(null);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  load(): void {
    if (
      this.user() !== null
      || this.loading()
    ) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authApi
      .getCurrentUser()
      .subscribe({
        next: (response) => {
          this.user.set(response.user);
          this.loading.set(false);
        },

        error: () => {
          this.error.set(
            'Unable to load the Campus Rental user.',
          );

          this.loading.set(false);
        },
      });
  }

  clear(): void {
    this.user.set(null);
    this.error.set(null);
    this.loading.set(false);
  }
}