import {
  Component,
  inject,
} from '@angular/core';

import {
  AuthService,
} from '@auth0/auth0-angular';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth =
    inject(AuthService);

  protected login(): void {
    this.auth.loginWithRedirect();
  }
}