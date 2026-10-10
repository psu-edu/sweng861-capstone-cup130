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
} from '@angular/forms';

import type {
  HousingApplicationStatus,
} from '../../core/services/housing-application-api';

import {
  HousingAssignmentApi,
  type HousingAssignmentApplication,
  type HousingAssignmentOptionBed,
  type HousingAssignmentOptionBuilding,
  type HousingAssignmentOptionRoom,
  type HousingAssignmentOptions,
  type HousingAssignmentRecord,
  type HousingAssignmentRoommate,
  type HousingAssignmentStatus,
} from '../../core/services/housing-assignment-api';

import type {
  RoomStyle,
} from '../../core/services/housing-options-api';

type AssignmentMode =
  | 'INDIVIDUAL'
  | 'PAIR';

@Component({
  selector:
    'app-housing-assignments',

  imports: [
    ReactiveFormsModule,
  ],

  templateUrl:
    './housing-assignments.html',

  styleUrl:
    './housing-assignments.css',
})
export class HousingAssignmentsPage
implements OnInit {
  private readonly assignmentApi =
    inject(HousingAssignmentApi);

  protected readonly applications =
    signal<HousingAssignmentApplication[]>([]);

  protected readonly assignments =
    signal<HousingAssignmentRecord[]>([]);

  protected readonly selectedApplication =
    signal<HousingAssignmentApplication | null>(
      null,
    );

  protected readonly options =
    signal<HousingAssignmentOptions | null>(
      null,
    );

  protected readonly loading =
    signal(true);

  protected readonly detailLoading =
    signal(false);

  protected readonly saving =
    signal(false);

  protected readonly loadError =
    signal<string | null>(
      null,
    );

  protected readonly error =
    signal<string | null>(
      null,
    );

  protected readonly message =
    signal<string | null>(
      null,
    );

  protected readonly assignmentMode =
    signal<AssignmentMode>(
      'INDIVIDUAL',
    );

  protected readonly changingAssignment =
    signal(false);

  protected readonly selectedRoomId =
    signal<string | null>(
      null,
    );

  protected readonly selectedBedControl =
    new FormControl(
      '',
      {
        nonNullable: true,
      },
    );

  protected readonly roommateBedControl =
    new FormControl(
      '',
      {
        nonNullable: true,
      },
    );

  protected readonly selectedRoommateApplicationControl =
    new FormControl(
      '',
      {
        nonNullable: true,
      },
    );

  ngOnInit(): void {
    this.loadOverview();
  }

  protected reviewApplication(
    application:
      HousingAssignmentApplication,
  ): void {
    this.selectedApplication.set(
      application,
    );

    this.options.set(
      null,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.resetAssignmentControls();

    if (
      application.status
      === 'APPROVED'
    ) {
      this.loadOptions(
        application.id,
      );
    }
  }

  protected closeReview(): void {
    if (
      this.saving()
    ) {
      return;
    }

    this.selectedApplication.set(
      null,
    );

    this.options.set(
      null,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.resetAssignmentControls();
  }

  protected refreshInventory(): void {
    const application =
      this.selectedApplication();

    if (
      application === null
      || (
        application.status
          !== 'APPROVED'
        && !(
          application.status
            === 'HOUSING_ASSIGNED'
          && this.changingAssignment()
        )
      )
    ) {
      return;
    }

    this.loadOptions(
      application.id,
    );
  }

  protected startChangeAssignment():
  void {
    const application =
      this.selectedApplication();

    if (
      application === null
      || application.status
        !== 'HOUSING_ASSIGNED'
    ) {
      return;
    }

    const assignment =
      this.currentAssignment(
        application,
      );

    if (
      assignment === null
      || assignment.status
        !== 'RESERVED'
    ) {
      return;
    }

    this.changingAssignment.set(
      true,
    );

    this.assignmentMode.set(
      'INDIVIDUAL',
    );

    this.selectedRoomId.set(
      null,
    );

    this.selectedBedControl.setValue(
      '',
    );

    this.roommateBedControl.setValue(
      '',
    );

    this
      .selectedRoommateApplicationControl
      .setValue(
        '',
      );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.loadOptions(
      application.id,
    );
  }

  protected stopChangeAssignment():
  void {
    if (
      this.saving()
    ) {
      return;
    }

    this.changingAssignment.set(
      false,
    );

    this.options.set(
      null,
    );

    this.selectedRoomId.set(
      null,
    );

    this.selectedBedControl.setValue(
      '',
    );

    this.error.set(
      null,
    );
  }

  protected setAssignmentMode(
    mode: AssignmentMode,
  ): void {
    this.assignmentMode.set(
      mode,
    );

    this.selectedRoomId.set(
      null,
    );

    this.selectedBedControl.setValue(
      '',
    );

    this.roommateBedControl.setValue(
      '',
    );

    if (
      mode === 'PAIR'
    ) {
      const firstRoommate =
        this.eligibleRoommates()[0];

      this.selectedRoommateApplicationControl
        .setValue(
          firstRoommate
            ?.applicationId
          ?? '',
        );
    } else {
      this.selectedRoommateApplicationControl
        .setValue(
          '',
        );
    }
  }

  protected eligibleRoommates():
  HousingAssignmentRoommate[] {
    const application =
      this.selectedApplication();

    if (
      application === null
    ) {
      return [];
    }

    return application
      .roommates
      .filter(
        (roommate) =>
          roommate.applicationId
            !== null
          && roommate
            .applicationStatus
            === 'APPROVED',
      );
  }

  protected selectedRoommate():
  HousingAssignmentRoommate | null {
    const applicationId =
      this
        .selectedRoommateApplicationControl
        .value;

    if (
      applicationId === ''
    ) {
      return null;
    }

    return (
      this.eligibleRoommates()
        .find(
          (roommate) =>
            roommate.applicationId
            === applicationId,
        )
      ?? null
    );
  }

  protected roommateApplication(
    roommate:
      HousingAssignmentRoommate,
  ): HousingAssignmentApplication | null {
    if (
      roommate.applicationId
      === null
    ) {
      return null;
    }

    return (
      this.applications()
        .find(
          (application) =>
            application.id
            === roommate
              .applicationId,
        )
      ?? null
    );
  }

  protected roommateSummary(
    application:
      HousingAssignmentApplication,
  ): string {
    if (
      application
        .roommates
        .length === 0
    ) {
      return 'No accepted roommate';
    }

    return application
      .roommates
      .map(
        (roommate) =>
          `${roommate.firstName} ${roommate.lastName}`,
      )
      .join(', ');
  }

  protected currentAssignment(
    application:
      HousingAssignmentApplication,
  ): HousingAssignmentRecord | null {
    if (
      application.assignmentId
      === null
    ) {
      return null;
    }

    return (
      this.assignments()
        .find(
          (assignment) =>
            assignment.id
            === application
              .assignmentId,
        )
      ?? null
    );
  }

  protected roomCanSupportMode(
    room:
      HousingAssignmentOptionRoom,
  ): boolean {
    if (
      this.assignmentMode()
      === 'PAIR'
      && !this.changingAssignment()
    ) {
      return (
        room.availableBedCount
        >= 2
      );
    }

    return (
      room.availableBedCount
      >= 1
    );
  }

  protected buildingHasAssignableRoom(
    building:
      HousingAssignmentOptionBuilding,
  ): boolean {
    return building
      .rooms
      .some(
        (room) =>
          this.roomCanSupportMode(
            room,
          ),
      );
  }

  protected hasAssignableInventory():
  boolean {
    const currentOptions =
      this.options();

    if (
      currentOptions === null
    ) {
      return false;
    }

    return currentOptions
      .buildings
      .some(
        (building) =>
          this
            .buildingHasAssignableRoom(
              building,
            ),
      );
  }

  protected availableBeds(
    room:
      HousingAssignmentOptionRoom,
  ): HousingAssignmentOptionBed[] {
    return room
      .beds
      .filter(
        (bed) =>
          bed.available,
      );
  }

  protected selectRoom(
    room:
      HousingAssignmentOptionRoom,
  ): void {
    const beds =
      this.availableBeds(
        room,
      );

    this.selectedRoomId.set(
      room.id,
    );

    this.selectedBedControl
      .setValue(
        beds[0]?.id
        ?? '',
      );

    this.roommateBedControl
      .setValue(
        this.assignmentMode()
          === 'PAIR'
        && !this.changingAssignment()
          ? beds[1]?.id
            ?? ''
          : '',
      );
  }

  protected selectedRoom():
  HousingAssignmentOptionRoom | null {
    const roomId =
      this.selectedRoomId();

    const currentOptions =
      this.options();

    if (
      roomId === null
      || currentOptions === null
    ) {
      return null;
    }

    for (
      const building
      of currentOptions.buildings
    ) {
      const room =
        building.rooms.find(
          (candidate) =>
            candidate.id
            === roomId,
        );

      if (
        room !== undefined
      ) {
        return room;
      }
    }

    return null;
  }

  protected selectedBuildingName():
  string {
    const roomId =
      this.selectedRoomId();

    const currentOptions =
      this.options();

    if (
      roomId === null
      || currentOptions === null
    ) {
      return '';
    }

    const building =
      currentOptions
        .buildings
        .find(
          (candidate) =>
            candidate.rooms.some(
              (room) =>
                room.id
                === roomId,
            ),
        );

    return (
      building?.name
      ?? ''
    );
  }

  protected createIndividualAssignment():
  void {
    const application =
      this.selectedApplication();

    const bedId =
      this.selectedBedControl
        .value;

    if (
      application === null
      || bedId === ''
    ) {
      this.error.set(
        'Select an available room and bed before creating the assignment.',
      );

      return;
    }

    const room =
      this.selectedRoom();

    if (
      room === null
    ) {
      this.error.set(
        'Select an available room before creating the assignment.',
      );

      return;
    }

    if (
      !window.confirm(
        `Reserve ${this.selectedBuildingName()}, Room ${room.roomNumber}, Bed ${this.bedLabel(room, bedId)} for ${application.firstName} ${application.lastName}?`,
      )
    ) {
      return;
    }

    this.saving.set(
      true,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.assignmentApi
      .createAssignment(
        application.id,
        bedId,
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            'Housing assignment reserved successfully.',
          );
        },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.saving.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to create the housing assignment.',
              ),
            );
          },
      });
  }

  protected createPairAssignment():
  void {
    const application =
      this.selectedApplication();

    const roommate =
      this.selectedRoommate();

    const room =
      this.selectedRoom();

    const bedId =
      this.selectedBedControl
        .value;

    const roommateBedId =
      this.roommateBedControl
        .value;

    if (
      application === null
      || roommate === null
      || roommate.applicationId
        === null
    ) {
      this.error.set(
        'Select an eligible accepted roommate before creating a pair assignment.',
      );

      return;
    }

    if (
      room === null
      || bedId === ''
      || roommateBedId === ''
    ) {
      this.error.set(
        'Select one room and two available beds before creating the roommate pair assignment.',
      );

      return;
    }

    if (
      bedId
      === roommateBedId
    ) {
      this.error.set(
        'Roommate pair assignment requires two different beds.',
      );

      return;
    }

    if (
      !window.confirm(
        `Reserve Room ${room.roomNumber} in ${this.selectedBuildingName()} for ${application.firstName} ${application.lastName} and ${roommate.firstName} ${roommate.lastName}?`,
      )
    ) {
      return;
    }

    this.saving.set(
      true,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.assignmentApi
      .createPairAssignment(
        application.id,
        roommate.applicationId,
        bedId,
        roommateBedId,
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            'Roommate pair assignments reserved successfully.',
          );
        },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.saving.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to create the roommate pair assignment.',
              ),
            );
          },
      });
  }

  protected changeCurrentAssignment():
  void {
    const application =
      this.selectedApplication();

    if (
      application === null
    ) {
      return;
    }

    const assignment =
      this.currentAssignment(
        application,
      );

    const room =
      this.selectedRoom();

    const bedId =
      this.selectedBedControl
        .value;

    if (
      assignment === null
      || assignment.status
        !== 'RESERVED'
    ) {
      this.error.set(
        'The current housing assignment is no longer available to change.',
      );

      return;
    }

    if (
      room === null
      || bedId === ''
    ) {
      this.error.set(
        'Select a new room and bed before changing the assignment.',
      );

      return;
    }

    if (
      !window.confirm(
        `Change ${application.firstName} ${application.lastName}'s assignment from ${assignment.buildingName}, Room ${assignment.roomNumber}, Bed ${assignment.bedLabel} to ${this.selectedBuildingName()}, Room ${room.roomNumber}, Bed ${this.bedLabel(room, bedId)}? The housing application will remain active.`,
      )
    ) {
      return;
    }

    this.saving.set(
      true,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.assignmentApi
      .changeAssignment(
        assignment.id,
        bedId,
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            'Housing assignment changed successfully.',
          );
        },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.saving.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to change the housing assignment.',
              ),
            );
          },
      });
  }

  protected cancelAssignmentOnly(
    assignment:
      HousingAssignmentRecord,
  ): void {
    if (
      assignment.status
      !== 'RESERVED'
    ) {
      return;
    }

    if (
      !window.confirm(
        `Cancel ${assignment.firstName} ${assignment.lastName}'s reserved housing assignment? Bed ${assignment.bedLabel} will be released and the housing application will return to Approved so it can be assigned again. The application itself will not be cancelled.`,
      )
    ) {
      return;
    }

    this.saving.set(
      true,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.assignmentApi
      .cancelAssignmentOnly(
        assignment.id,
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            'Housing assignment cancelled. The application returned to Approved.',
          );
        },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.saving.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to cancel the housing assignment.',
              ),
            );
          },
      });
  }

  protected cancelApplication(
    assignment:
      HousingAssignmentRecord,
  ): void {
    if (
      assignment.status
      !== 'RESERVED'
    ) {
      return;
    }

    if (
      !window.confirm(
        `Cancel ${assignment.firstName} ${assignment.lastName}'s housing application? This will cancel the reserved assignment, release Bed ${assignment.bedLabel}, and cancel the related housing application.`,
      )
    ) {
      return;
    }

    this.saving.set(
      true,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.assignmentApi
      .cancelApplication(
        assignment.id,
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            'Housing application and reserved assignment cancelled.',
          );
        },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.saving.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to cancel the housing application.',
              ),
            );
          },
      });
  }

  protected applicationStatusLabel(
    status:
      HousingApplicationStatus,
  ): string {
    return this.enumLabel(
      status,
    );
  }

  protected assignmentStatusLabel(
    status:
      HousingAssignmentStatus,
  ): string {
    return this.enumLabel(
      status,
    );
  }

  protected roomStyleLabel(
    roomStyle: RoomStyle,
  ): string {
    return this.enumLabel(
      roomStyle,
    );
  }

  protected formatDate(
    value: string | null,
  ): string {
    if (
      value === null
    ) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '—';
    }

    return date
      .toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      );
  }

  protected graduationLabel(
    application:
      HousingAssignmentApplication,
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

    if (
      semester === null
    ) {
      return String(
        year,
      );
    }

    if (
      year === null
    ) {
      return this.enumLabel(
        semester,
      );
    }

    return `${this.enumLabel(semester)} ${year}`;
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

  private loadOverview(
    successMessage:
      string | null = null,
  ): void {
    this.loading.set(
      true,
    );

    this.loadError.set(
      null,
    );

    this.assignmentApi
      .getOfficerOverview()
      .subscribe({
        next: (response) => {
          this.applications.set(
            response.applications,
          );

          this.assignments.set(
            response.assignments,
          );

          this.loading.set(
            false,
          );

          if (
            successMessage
            !== null
          ) {
            this.message.set(
              successMessage,
            );
          }
        },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.loading.set(
              false,
            );

            this.loadError.set(
              this.getErrorMessage(
                error,
                'Unable to load housing assignments.',
              ),
            );
          },
      });
  }

  private loadOptions(
    applicationId: string,
  ): void {
    this.detailLoading.set(
      true,
    );

    this.options.set(
      null,
    );

    this.error.set(
      null,
    );

    this.assignmentApi
      .getApplicationOptions(
        applicationId,
      )
      .subscribe({
        next: (response) => {
          if (
            this.selectedApplication()
              ?.id
            !== applicationId
          ) {
            return;
          }

          this.options.set(
            response.options,
          );

          this.detailLoading.set(
            false,
          );
        },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            if (
              this.selectedApplication()
                ?.id
              !== applicationId
            ) {
              return;
            }

            this.detailLoading.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to load available housing inventory.',
              ),
            );
          },
      });
  }

  private finishMutation(
    successMessage: string,
  ): void {
    this.saving.set(
      false,
    );

    this.selectedApplication.set(
      null,
    );

    this.options.set(
      null,
    );

    this.resetAssignmentControls();

    this.loadOverview(
      successMessage,
    );
  }

  private resetAssignmentControls():
  void {
    this.assignmentMode.set(
      'INDIVIDUAL',
    );

    this.changingAssignment.set(
      false,
    );

    this.selectedRoomId.set(
      null,
    );

    this.selectedBedControl.setValue(
      '',
    );

    this.roommateBedControl.setValue(
      '',
    );

    this
      .selectedRoommateApplicationControl
      .setValue(
        '',
      );
  }

  private bedLabel(
    room:
      HousingAssignmentOptionRoom,
    bedId: string,
  ): string {
    return (
      room.beds
        .find(
          (bed) =>
            bed.id
            === bedId,
        )
        ?.bedLabel
      ?? ''
    );
  }

  private getErrorMessage(
    error:
      HttpErrorResponse,
    fallback: string,
  ): string {
    const apiMessage =
      error.error?.message;

    if (
      typeof apiMessage
        === 'string'
      && apiMessage.trim()
        !== ''
    ) {
      return apiMessage;
    }

    return fallback;
  }
}