import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  HousingApplicationApi,
  type HousingApplicationStatus,
  type StudentHousingApplication,
} from '../../core/services/housing-application-api';

import type {
  RoomStyle,
} from '../../core/services/housing-options-api';

@Component({
  selector: 'app-student-application',
  imports: [
    RouterLink,
  ],
  templateUrl: './student-application.html',
  styleUrl: './student-application.css',
})
export class StudentApplicationPage
implements OnInit {
  private readonly applicationApi =
    inject(HousingApplicationApi);

  protected readonly applications =
    signal<StudentHousingApplication[]>([]);

  protected readonly loading =
    signal(true);

  protected readonly acting =
    signal(false);

  protected readonly loadError =
    signal<string | null>(null);

  protected readonly error =
    signal<string | null>(null);

  protected readonly message =
    signal<string | null>(null);

  protected readonly currentApplication =
    computed(() => {
      const applications =
        this.applications();

      const unsecured =
        applications.find(
          (application) =>
            application.status === 'DRAFT'
            || application.status
              === 'SUBMITTED'
            || application.status
              === 'APPROVED',
        );

      return (
        unsecured
        ?? applications[0]
        ?? null
      );
    });

  protected readonly previousApplications =
    computed(() => {
      const current =
        this.currentApplication();

      if (current === null) {
        return [];
      }

      return this.applications()
        .filter(
          (application) =>
            application.id !== current.id,
        );
    });

  ngOnInit(): void {
    this.loadApplications();
  }

  protected canCancel(
    application:
      StudentHousingApplication,
  ): boolean {
    return (
      application.status === 'DRAFT'
      || application.status
        === 'SUBMITTED'
      || application.status
        === 'APPROVED'
    );
  }

  protected cancelApplication(
    application:
      StudentHousingApplication,
  ): void {
    if (
      !this.canCancel(application)
    ) {
      return;
    }

    if (
      !window.confirm(
        'Cancel this housing application? This action preserves the application history but ends the current application.',
      )
    ) {
      return;
    }

    this.acting.set(true);
    this.error.set(null);
    this.message.set(null);

    this.applicationApi
      .cancelStudentApplication(
        application.id,
      )
      .subscribe({
        next: (response) => {
          this.applications.update(
            (applications) =>
              applications.map(
                (existing) =>
                  existing.id
                    === response
                      .application.id
                    ? response.application
                    : existing,
              ),
          );

          this.acting.set(false);

          this.message.set(
            'Housing application cancelled successfully.',
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.acting.set(false);

          this.error.set(
            this.getErrorMessage(
              error,
              'Unable to cancel the housing application.',
            ),
          );
        },
      });
  }

  protected statusLabel(
    status:
      HousingApplicationStatus,
  ): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';

      case 'SUBMITTED':
        return 'Submitted';

      case 'APPROVED':
        return 'Approved';

      case 'HOUSING_ASSIGNED':
        return 'Housing Assigned';

      case 'COMPLETED':
        return 'Completed';

      case 'CANCELLED':
        return 'Cancelled';
    }
  }

  protected roomStyleLabel(
    roomStyle: RoomStyle,
  ): string {
    switch (roomStyle) {
      case 'SINGLE':
        return 'Single';

      case 'DOUBLE':
        return 'Double';

      case 'TRIPLE':
        return 'Triple';

      case 'QUAD':
        return 'Quad';
    }
  }

  protected formatDate(
    value: string | null,
  ): string {
    if (value === null) {
      return '—';
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    );
  }

  private loadApplications(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.applicationApi
      .getStudentApplications()
      .subscribe({
        next: (response) => {
          this.applications.set(
            response.applications,
          );

          this.loading.set(false);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.loading.set(false);

          this.loadError.set(
            this.getErrorMessage(
              error,
              'Unable to load your housing application.',
            ),
          );
        },
      });
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string,
  ): string {
    const apiMessage =
      error.error?.message;

    if (
      typeof apiMessage === 'string'
      && apiMessage.trim() !== ''
    ) {
      return apiMessage;
    }

    return fallback;
  }
}