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
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  RouterLink,
} from '@angular/router';

import {
  forkJoin,
} from 'rxjs';

import {
  HousingApplicationApi,
  type HousingApplicationInput,
  type StudentHousingApplication,
} from '../../core/services/housing-application-api';

import {
  HousingOptionsApi,
  type HousingOptionBuilding,
  type HousingOptionRoomStyle,
  type RoomStyle,
} from '../../core/services/housing-options-api';

const ROOM_STYLE_ORDER:
Record<RoomStyle, number> = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  QUAD: 4,
};

@Component({
  selector: 'app-housing-options',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './housing-options.html',
  styleUrl: './housing-options.css',
})
export class HousingOptionsPage
implements OnInit {
  private readonly housingOptionsApi =
    inject(HousingOptionsApi);

  private readonly applicationApi =
    inject(HousingApplicationApi);

  protected readonly buildings =
    signal<HousingOptionBuilding[]>([]);

  protected readonly activeApplication =
    signal<StudentHousingApplication | null>(
      null,
    );

  protected readonly selectedBuildingId =
    signal<string | null>(null);

  protected readonly selectedRoomStyle =
    signal<RoomStyle | null>(null);

  protected readonly loading =
    signal(true);

  protected readonly saving =
    signal(false);

  protected readonly submitting =
    signal(false);

  protected readonly loadError =
    signal<string | null>(null);

  protected readonly error =
    signal<string | null>(null);

  protected readonly message =
    signal<string | null>(null);

  protected readonly confirmationOpen =
    signal(false);

  protected readonly academicYears =
    this.buildAcademicYears();

  protected readonly academicYearControl =
    new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
        ],
      },
    );

  protected readonly selectedBuilding =
    computed(() => {
      const buildingId =
        this.selectedBuildingId();

      if (buildingId === null) {
        return null;
      }

      return (
        this.buildings().find(
          (building) =>
            building.id === buildingId,
        )
        ?? null
      );
    });

  protected readonly preferencesLocked =
    computed(() => {
      const application =
        this.activeApplication();

      return (
        application !== null
        && application.status !== 'DRAFT'
      );
    });

  ngOnInit(): void {
    this.loadPage();
  }

  protected selectRoomStyle(
    buildingId: string,
    roomStyle: RoomStyle,
  ): void {
    if (this.preferencesLocked()) {
      return;
    }

    this.selectedBuildingId.set(
      buildingId,
    );

    this.selectedRoomStyle.set(
      roomStyle,
    );

    this.error.set(null);
    this.message.set(null);
  }

  protected isSelected(
    buildingId: string,
    roomStyle: RoomStyle,
  ): boolean {
    return (
      this.selectedBuildingId()
        === buildingId
      && this.selectedRoomStyle()
        === roomStyle
    );
  }

  protected savePreferences(): void {
    if (this.preferencesLocked()) {
      return;
    }

    const academicYear =
      this.academicYearControl.value;

    this.academicYearControl
      .markAsTouched();

    const buildingId =
      this.selectedBuildingId();

    const roomStyle =
      this.selectedRoomStyle();

    if (
      this.academicYearControl.invalid
      || buildingId === null
      || roomStyle === null
    ) {
      this.error.set(
        'Select an academic year, residence hall, and room style.',
      );

      return;
    }

    const input:
      HousingApplicationInput = {
        academicYear,
        preferredBuildingId:
          buildingId,
        preferredRoomStyle:
          roomStyle,
      };

    const application =
      this.activeApplication();

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const request =
      application?.status === 'DRAFT'
        ? this.applicationApi
            .updateStudentApplication(
              application.id,
              input,
            )
        : this.applicationApi
            .createStudentApplication(
              input,
            );

    request.subscribe({
      next: (response) => {
        this.activeApplication.set(
          response.application,
        );

        this.saving.set(false);

        this.message.set(
          'Preferences saved as a draft. Review them before submitting.',
        );

        this.confirmationOpen.set(
          true,
        );
      },

      error: (
        error: HttpErrorResponse,
      ) => {
        this.saving.set(false);

        this.error.set(
          this.getErrorMessage(
            error,
            'Unable to save housing preferences.',
          ),
        );
      },
    });
  }

  protected closeConfirmation(): void {
    if (this.submitting()) {
      return;
    }

    this.confirmationOpen.set(
      false,
    );
  }

  protected submitPreferences(): void {
    const application =
      this.activeApplication();

    if (
      application === null
      || application.status !== 'DRAFT'
    ) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.applicationApi
      .submitStudentApplication(
        application.id,
      )
      .subscribe({
        next: (response) => {
          this.activeApplication.set(
            response.application,
          );

          this.submitting.set(false);

          this.confirmationOpen.set(
            false,
          );

          this.message.set(
            'Housing preferences submitted successfully. Your application is now awaiting Housing Office review.',
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.submitting.set(false);

          this.error.set(
            this.getErrorMessage(
              error,
              'Unable to submit housing preferences.',
            ),
          );
        },
      });
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

  protected statusLabel(
    application:
      StudentHousingApplication,
  ): string {
    switch (application.status) {
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

  protected availabilityLabel(
    availableBeds: number,
  ): string {
    if (availableBeds === 0) {
      return 'No spaces available';
    }

    if (availableBeds === 1) {
      return '1 space available';
    }

    return `${availableBeds} spaces available`;
  }

  private loadPage(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      housing:
        this.housingOptionsApi
          .getHousingOptions(),

      applications:
        this.applicationApi
          .getStudentApplications(),
    }).subscribe({
      next: ({
        housing,
        applications,
      }) => {
        const buildings =
          housing.buildings.map(
            (building) => ({
              ...building,
              roomStyles:
                this.sortRoomStyles(
                  building.roomStyles,
                ),
            }),
          );

        this.buildings.set(
          buildings,
        );

        const activeApplication =
          applications.applications
            .find(
              (application) =>
                application.status
                  === 'DRAFT'
                || application.status
                  === 'SUBMITTED'
                || application.status
                  === 'APPROVED',
            )
          ?? null;

        this.activeApplication.set(
          activeApplication,
        );

        if (
          activeApplication !== null
        ) {
          this.academicYearControl
            .setValue(
              activeApplication
                .academicYear,
            );

          this.selectedBuildingId.set(
            activeApplication
              .preferredBuildingId,
          );

          this.selectedRoomStyle.set(
            activeApplication
              .preferredRoomStyle,
          );
        }

        this.loading.set(false);
      },

      error: (
        error: HttpErrorResponse,
      ) => {
        this.loading.set(false);

        this.loadError.set(
          this.getErrorMessage(
            error,
            'Unable to load housing preferences.',
          ),
        );
      },
    });
  }

  private buildAcademicYears(): string[] {
    const now =
      new Date();

    const currentYear =
      now.getFullYear();

    const currentMonth =
      now.getMonth();

    const academicYearStart =
      currentMonth < 6
        ? currentYear - 1
        : currentYear;

    return [
      academicYearStart,
      academicYearStart + 1,
      academicYearStart + 2,
    ].map(
      (year) =>
        `${year}-${year + 1}`,
    );
  }

  private sortRoomStyles(
    roomStyles:
      HousingOptionRoomStyle[],
  ): HousingOptionRoomStyle[] {
    return [
      ...roomStyles,
    ].sort(
      (left, right) =>
        ROOM_STYLE_ORDER[
          left.roomStyle
        ]
        - ROOM_STYLE_ORDER[
          right.roomStyle
        ],
    );
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