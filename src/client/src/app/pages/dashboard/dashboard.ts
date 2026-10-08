import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  CurrentUserService,
} from '../../core/services/current-user.service';

import {
  HealthApi,
} from '../../core/services/health-api';

type BackendState =
  | 'checking'
  | 'connected'
  | 'unavailable';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly healthApi =
    inject(HealthApi);

  protected readonly currentUserService =
    inject(CurrentUserService);

  protected readonly backendState =
    signal<BackendState>('checking');

  protected readonly backendMessage =
    signal('Checking backend connection...');

  ngOnInit(): void {
    this.healthApi
      .getHealth()
      .subscribe({
        next: (health) => {
          this.backendState.set(
            'connected',
          );

          this.backendMessage.set(
            `${health.service} is connected to PostgreSQL.`,
          );
        },

        error: () => {
          this.backendState.set(
            'unavailable',
          );

          this.backendMessage.set(
            'The Campus Rental backend is currently unavailable.',
          );
        },
      });
  }
}