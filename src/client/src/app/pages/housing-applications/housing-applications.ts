import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  HousingApplicationApi,
  type HousingApplicationStatus,
  type HousingOfficerApplication,
} from '../../core/services/housing-application-api';

import type {
  RoomStyle,
} from '../../core/services/housing-options-api';

@Component({
  selector: 'app-housing-applications',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './housing-applications.html',
  styleUrl: './housing-applications.css',
})
export class HousingApplicationsPage
implements OnInit {
  private readonly applicationApi =
    inject(HousingApplicationApi);

  protected readonly applications =
    signal<HousingOfficerApplication[]>([]);

  protected readonly selectedApplication =
    signal<HousingOfficerApplication | null>(
      null,
    );

  protected readonly loading =
    signal(true);

  protected readonly detailLoading =
    signal(false);

  protected readonly saving =
    signal(false);

  protected readonly loadError =
    signal<string | null>(null);

  protected readonly error =
    signal<string | null>(null);

  protected readonly message =
    signal<string | null>(null);

  protected readonly notesControl =
    new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.maxLength(5000),
        ],
      },
    );

  ngOnInit(): void {
    this.loadApplications();
  }

  protected reviewApplication(
    applicationId: string,
  ): void {
    this.detailLoading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.applicationApi
      .getOfficerApplication(
        applicationId,
      )
      .subscribe({
        next: (response) => {
          this.selectedApplication.set(
            response.application,
          );

          this.notesControl.setValue(
            response.application
              .officerNotes
            ?? '',
          );

          this.detailLoading.set(false);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.detailLoading.set(false);

          this.error.set(
            this.getErrorMessage(
              error,
              'Unable to load the housing application.',
            ),
          );
        },
      });
  }

  protected closeReview(): void {
    if (this.saving()) {
      return;
    }

    this.selectedApplication.set(
      null,
    );

    this.notesControl.setValue('');
    this.error.set(null);
    this.message.set(null);
  }

  protected saveNotes(): void {
    const application =
      this.selectedApplication();

    if (application === null) {
      return;
    }

    this.notesControl.markAsTouched();

    if (this.notesControl.invalid) {
      this.error.set(
        'Housing Officer notes must be 5000 characters or fewer.',
      );

      return;
    }

    const notes =
      this.notesControl
        .value
        .trim();

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    this.applicationApi
      .updateOfficerNotes(
        application.id,
        notes === ''
          ? null
          : notes,
      )
      .subscribe({
        next: (response) => {
          this.finishAction(
            response.application,
            'Housing Officer notes saved.',
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.saving.set(false);

          this.error.set(
            this.getErrorMessage(
              error,
              'Unable to save Housing Officer notes.',
            ),
          );
        },
      });
  }

  protected approveApplication(): void {
    const application =
      this.selectedApplication();

    if (
      application === null
      || application.status
        !== 'SUBMITTED'
    ) {
      return;
    }

    if (
      !window.confirm(
        `Approve ${application.firstName} ${application.lastName}'s housing application?`,
      )
    ) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    this.applicationApi
      .approveOfficerApplication(
        application.id,
      )
      .subscribe({
        next: (response) => {
          this.finishAction(
            response.application,
            'Housing application approved.',
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.saving.set(false);

          this.error.set(
            this.getErrorMessage(
              error,
              'Unable to approve the housing application.',
            ),
          );
        },
      });
  }

  protected cancelApplication(): void {
    const application =
      this.selectedApplication();

    if (
      application === null
      || !this.canCancel(application)
    ) {
      return;
    }

    if (
      !window.confirm(
        `Cancel ${application.firstName} ${application.lastName}'s housing application?`,
      )
    ) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    this.applicationApi
      .cancelOfficerApplication(
        application.id,
      )
      .subscribe({
        next: (response) => {
          this.finishAction(
            response.application,
            'Housing application cancelled.',
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.saving.set(false);

          this.error.set(
            this.getErrorMessage(
              error,
              'Unable to cancel the housing application.',
            ),
          );
        },
      });
  }

  protected canCancel(
    application:
      HousingOfficerApplication,
  ): boolean {
    return (
      application.status === 'DRAFT'
      || application.status
        === 'SUBMITTED'
      || application.status
        === 'APPROVED'
    );
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

  protected enumLabel(
    value: string,
  ): string {
    return value
      .toLowerCase()
      .replace(
        /_/g,
        ' ',
      )
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      );
  }

  protected graduationLabel(
    application:
      HousingOfficerApplication,
  ): string {
    const semester =
      application
        .anticipatedGraduationSemester;

    const year =
      application
        .anticipatedGraduationYear;

    if (
      semester === null
      && year === null
    ) {
      return 'Not specified';
    }

    if (semester === null) {
      return String(year);
    }

    if (year === null) {
      return this.enumLabel(
        semester,
      );
    }

    return `${this.enumLabel(semester)} ${year}`;
  }

  private loadApplications(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.applicationApi
      .getOfficerApplications()
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
              'Unable to load housing applications.',
            ),
          );
        },
      });
  }

  private finishAction(
    application:
      HousingOfficerApplication,
    message: string,
  ): void {
    this.selectedApplication.set(
      application,
    );

    this.notesControl.setValue(
      application.officerNotes
      ?? '',
    );

    this.applications.update(
      (applications) =>
        applications.map(
          (existing) =>
            existing.id
              === application.id
              ? application
              : existing,
        ),
    );

    this.saving.set(false);
    this.message.set(message);
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