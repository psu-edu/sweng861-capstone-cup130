import {
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  AuthService,
} from '@auth0/auth0-angular';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import {
  CurrentUserService,
} from '../../core/services/current-user.service';

@Component({
  selector: 'app-app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell implements OnInit {
  private readonly auth =
    inject(AuthService);

  protected readonly currentUserService =
    inject(CurrentUserService);

  ngOnInit(): void {
    this.currentUserService.load();
  }

  protected logout(): void {
    this.currentUserService.clear();

    this.auth.logout({
      logoutParams: {
        returnTo:
          `${window.location.origin}/login`,
      },
    });
  }
}