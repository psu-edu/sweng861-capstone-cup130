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
  RouterLinkActive,
} from '@angular/router';

import {
  CurrentUserService,
} from '../../core/services/current-user.service';

import {
  RoommateMatchingApi,
  type RoommateRequest,
  type RoommateStudentSummary,
} from '../../core/services/roommate-matching-api';

@Component({
  selector:
    'app-roommate-requests',

  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
  ],

  templateUrl:
    './roommate-requests.html',

  styleUrl:
    './roommate-requests.css',
})
export class RoommateRequestsPage
implements OnInit {
  private readonly roommateApi =
    inject(RoommateMatchingApi);

  protected readonly currentUserService =
    inject(CurrentUserService);

  protected readonly requests =
    signal<RoommateRequest[]>([]);

  protected readonly searchResults =
    signal<
      RoommateStudentSummary[]
    >([]);

  protected readonly loading =
    signal(true);

  protected readonly searching =
    signal(false);

  protected readonly hasSearched =
    signal(false);

  protected readonly sendingStudentId =
    signal<string | null>(
      null,
    );

  protected readonly actingRequestId =
    signal<string | null>(
      null,
    );

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

  protected readonly academicYears =
    this.buildAcademicYears();

  protected readonly academicYearControl =
    new FormControl(
      this.academicYears[0],
      {
        nonNullable:
          true,

        validators: [
          Validators.required,
        ],
      },
    );

  protected readonly searchControl =
    new FormControl(
      '',
      {
        nonNullable:
          true,

        validators: [
          Validators.required,
        ],
      },
    );

  protected readonly acceptedRequests =
    computed(
      () =>
        this.requests()
          .filter(
            (request) =>
              request.status
              === 'ACCEPTED',
          ),
    );

  protected readonly incomingPending =
    computed(
      () => {
        const currentUserId =
          this.currentUserService
            .user()?.id;

        if (
          currentUserId
          === undefined
        ) {
          return [];
        }

        return this.requests()
          .filter(
            (request) =>
              request.status
                === 'PENDING'
              && request.requested
                .studentId
                === currentUserId,
          );
      },
    );

  protected readonly outgoingPending =
    computed(
      () => {
        const currentUserId =
          this.currentUserService
            .user()?.id;

        if (
          currentUserId
          === undefined
        ) {
          return [];
        }

        return this.requests()
          .filter(
            (request) =>
              request.status
                === 'PENDING'
              && request.requester
                .studentId
                === currentUserId,
          );
      },
    );

  protected readonly requestHistory =
    computed(
      () =>
        this.requests()
          .filter(
            (request) =>
              request.status
                === 'DECLINED'
              || request.status
                === 'CANCELLED',
          ),
    );

  ngOnInit(): void {
    this.currentUserService
      .load();

    this.loadRequests();
  }

  protected search(): void {
    this.message.set(
      null,
    );

    this.error.set(
      null,
    );

    this.searchControl
      .markAsTouched();

    if (
      this.searchControl.invalid
    ) {
      this.error.set(
        'Enter a student name or student number.',
      );

      return;
    }

    const searchTerm =
      this.searchControl
        .value
        .trim();

    this.searching.set(
      true,
    );

    this.hasSearched.set(
      true,
    );

    this.roommateApi
      .searchStudents(
        searchTerm,
      )
      .subscribe({
        next:
          (response) => {
            this.searchResults.set(
              response.students,
            );

            this.searching.set(
              false,
            );
          },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.searchResults.set(
              [],
            );

            this.searching.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to search for students.',
              ),
            );
          },
      });
  }

  protected sendRequest(
    student:
      RoommateStudentSummary,
  ): void {
    if (
      this.sendingStudentId()
      !== null
    ) {
      return;
    }

    const academicYear =
      this.academicYearControl
        .value;

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.sendingStudentId.set(
      student.studentId,
    );

    this.roommateApi
      .createRequest(
        student.studentId,
        academicYear,
      )
      .subscribe({
        next:
          (response) => {
            this.sendingStudentId.set(
              null,
            );

            this.requests.update(
              (requests) => [
                response.request,
                ...requests,
              ],
            );

            this.searchResults.update(
              (students) =>
                students.filter(
                  (existing) =>
                    existing.studentId
                    !== student.studentId,
                ),
            );

            this.message.set(
              `Roommate request sent to ${student.firstName} ${student.lastName}.`,
            );
          },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.sendingStudentId.set(
              null,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to send the roommate request.',
              ),
            );
          },
      });
  }

  protected acceptRequest(
    roommateRequest:
      RoommateRequest,
  ): void {
    this.performRequestAction(
      roommateRequest,
      'accept',
    );
  }

  protected declineRequest(
    roommateRequest:
      RoommateRequest,
  ): void {
    this.performRequestAction(
      roommateRequest,
      'decline',
    );
  }

  protected cancelRequest(
    roommateRequest:
      RoommateRequest,
  ): void {
    this.performRequestAction(
      roommateRequest,
      'cancel',
    );
  }

  protected hasActiveRequestWith(
    studentId: string,
  ): boolean {
    const currentUserId =
      this.currentUserService
        .user()?.id;

    if (
      currentUserId
      === undefined
    ) {
      return false;
    }

    const academicYear =
      this.academicYearControl
        .value;

    return this.requests()
      .some(
        (request) => {
          if (
            request.academicYear
              !== academicYear
            || (
              request.status
                !== 'PENDING'
              && request.status
                !== 'ACCEPTED'
            )
          ) {
            return false;
          }

          return (
            (
              request.requester
                .studentId
                === currentUserId
              && request.requested
                .studentId
                === studentId
            )
            || (
              request.requested
                .studentId
                === currentUserId
              && request.requester
                .studentId
                === studentId
            )
          );
        },
      );
  }

  protected otherStudent(
    roommateRequest:
      RoommateRequest,
  ): RoommateStudentSummary {
    const currentUserId =
      this.currentUserService
        .user()?.id;

    if (
      roommateRequest.requester
        .studentId
      === currentUserId
    ) {
      return roommateRequest
        .requested;
    }

    return roommateRequest
      .requester;
  }

  protected academicStatusLabel(
    student:
      RoommateStudentSummary,
  ): string {
    switch (
      student.academicStatus
    ) {
      case 'FRESHMAN':
        return 'Freshman';

      case 'SOPHOMORE':
        return 'Sophomore';

      case 'JUNIOR':
        return 'Junior';

      case 'SENIOR':
        return 'Senior';

      case 'GRADUATE':
        return 'Graduate';
    }
  }

  protected graduationLabel(
    student:
      RoommateStudentSummary,
  ): string {
    if (
      student.anticipatedGraduationSemester
        === null
      || student.anticipatedGraduationYear
        === null
    ) {
      return 'Graduation not specified';
    }

    const semester =
      student
        .anticipatedGraduationSemester
        .toLowerCase();

    return (
      `${
        semester.charAt(0)
          .toUpperCase()
      }${
        semester.slice(1)
      } ${
        student
          .anticipatedGraduationYear
      }`
    );
  }

  protected statusLabel(
    roommateRequest:
      RoommateRequest,
  ): string {
    switch (
      roommateRequest.status
    ) {
      case 'PENDING':
        return 'Pending';

      case 'ACCEPTED':
        return 'Accepted';

      case 'DECLINED':
        return 'Declined';

      case 'CANCELLED':
        return 'Cancelled';
    }
  }

  private performRequestAction(
    roommateRequest:
      RoommateRequest,

    action:
      'accept'
      | 'decline'
      | 'cancel',
  ): void {
    if (
      this.actingRequestId()
      !== null
    ) {
      return;
    }

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.actingRequestId.set(
      roommateRequest.id,
    );

    const operation =
      action === 'accept'
        ? this.roommateApi
            .acceptRequest(
              roommateRequest.id,
            )
        : action === 'decline'
          ? this.roommateApi
              .declineRequest(
                roommateRequest.id,
              )
          : this.roommateApi
              .cancelRequest(
                roommateRequest.id,
              );

    operation.subscribe({
      next:
        (response) => {
          this.actingRequestId.set(
            null,
          );

          this.requests.update(
            (requests) => [
              response.request,
              ...requests.filter(
                (existing) =>
                  existing.id
                  !== response
                    .request.id,
              ),
            ],
          );

          const student =
            this.otherStudent(
              response.request,
            );

          switch (action) {
            case 'accept':
              this.message.set(
                `Roommate request with ${student.firstName} ${student.lastName} accepted.`,
              );

              break;

            case 'decline':
              this.message.set(
                `Roommate request from ${student.firstName} ${student.lastName} declined.`,
              );

              break;

            case 'cancel':
              this.message.set(
                `Roommate request to ${student.firstName} ${student.lastName} cancelled.`,
              );

              break;
          }
        },

      error:
        (
          error:
            HttpErrorResponse,
        ) => {
          this.actingRequestId.set(
            null,
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Unable to update the roommate request.',
            ),
          );
        },
    });
  }

  private loadRequests(): void {
    this.loading.set(
      true,
    );

    this.loadError.set(
      null,
    );

    this.roommateApi
      .getRequests()
      .subscribe({
        next:
          (response) => {
            this.requests.set(
              response.requests,
            );

            this.loading.set(
              false,
            );
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
                'Unable to load roommate requests.',
              ),
            );
          },
      });
  }

  private buildAcademicYears():
  string[] {
    const now =
      new Date();

    const currentYear =
      now.getFullYear();

    const academicYearStart =
      now.getMonth() < 6
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

  private getErrorMessage(
    error:
      HttpErrorResponse,

    fallback:
      string,
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