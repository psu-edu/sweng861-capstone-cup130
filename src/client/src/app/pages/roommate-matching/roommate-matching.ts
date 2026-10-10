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
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import {
  forkJoin,
} from 'rxjs';

import {
  HousingApplicationApi,
} from '../../core/services/housing-application-api';

import {
  RoommateMatchingApi,
  type CompatibilityCategory,
  type RoommateProfile,
  type RoommateRecommendation,
  type RoommateRequest,
  type RoommateStudentSummary,
} from '../../core/services/roommate-matching-api';

@Component({
  selector:
    'app-roommate-matching',

  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
  ],

  templateUrl:
    './roommate-matching.html',

  styleUrl:
    './roommate-matching.css',
})
export class RoommateMatchingPage
implements OnInit {
  private readonly roommateApi =
    inject(RoommateMatchingApi);

  private readonly applicationApi =
    inject(HousingApplicationApi);

  protected readonly profile =
    signal<RoommateProfile | null>(
      null,
    );

  protected readonly requests =
    signal<RoommateRequest[]>([]);

  protected readonly recommendations =
    signal<
      RoommateRecommendation[]
    >([]);

  protected readonly loading =
    signal(true);

  protected readonly loadingRecommendations =
    signal(false);

  protected readonly hasLoadedRecommendations =
    signal(false);

  protected readonly sendingCandidateId =
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

  ngOnInit(): void {
    this.loadPage();
  }

  protected acceptedRequest():
  RoommateRequest | null {
    const academicYear =
      this.academicYearControl
        .value;

    return (
      this.requests()
        .find(
          (request) =>
            request.status
              === 'ACCEPTED'
            && request.academicYear
              === academicYear,
        )
      ?? null
    );
  }

  protected academicYearChanged():
  void {
    this.recommendations.set(
      [],
    );

    this.hasLoadedRecommendations.set(
      false,
    );

    this.error.set(
      null,
    );

    this.message.set(
      null,
    );
  }

  protected loadRecommendations():
  void {
    this.error.set(
      null,
    );

    this.message.set(
      null,
    );

    this.recommendations.set(
      [],
    );

    this.hasLoadedRecommendations.set(
      false,
    );

    if (
      this.academicYearControl
        .invalid
    ) {
      this.error.set(
        'Select an academic year before finding roommate matches.',
      );

      return;
    }

    const academicYear =
      this.academicYearControl
        .value;

    this.loadingRecommendations.set(
      true,
    );

    this.roommateApi
      .getRecommendations(
        academicYear,
      )
      .subscribe({
        next:
          (response) => {
            this.loadingRecommendations.set(
              false,
            );

            if (
              this.academicYearControl
                .value
              !== academicYear
            ) {
              return;
            }

            this.recommendations.set(
              response.recommendations,
            );

            this.hasLoadedRecommendations.set(
              true,
            );
          },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.loadingRecommendations.set(
              false,
            );

            if (
              this.academicYearControl
                .value
              !== academicYear
            ) {
              return;
            }

            this.hasLoadedRecommendations.set(
              true,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to load roommate recommendations.',
              ),
            );
          },
      });
  }

  protected sendRequest(
    recommendation:
      RoommateRecommendation,
  ): void {
    if (
      this.sendingCandidateId()
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

    const candidate =
      recommendation.candidate;

    this.sendingCandidateId.set(
      candidate.studentId,
    );

    this.roommateApi
      .createRequest(
        candidate.studentId,
        this.academicYearControl
          .value,
      )
      .subscribe({
        next:
          (response) => {
            this.sendingCandidateId.set(
              null,
            );

            this.requests.update(
              (requests) => [
                response.request,
                ...requests,
              ],
            );

            this.recommendations.update(
              (recommendations) =>
                recommendations.filter(
                  (existing) =>
                    existing.candidate
                      .studentId
                    !== candidate.studentId,
                ),
            );

            this.message.set(
              `Roommate request sent to ${candidate.firstName} ${candidate.lastName}. They must accept before you are paired.`,
            );
          },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.sendingCandidateId.set(
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

  protected categoryLabel(
    category:
      CompatibilityCategory,
  ): string {
    switch (category) {
      case 'EXCELLENT':
        return 'Excellent Match';

      case 'STRONG':
        return 'Strong Match';

      case 'MODERATE':
        return 'Moderate Match';

      case 'MIXED':
        return 'Mixed Match';
    }
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

  private loadPage(): void {
    this.loading.set(
      true,
    );

    this.loadError.set(
      null,
    );

    forkJoin({
      profile:
        this.roommateApi
          .getProfile(),

      requests:
        this.roommateApi
          .getRequests(),

      applications:
        this.applicationApi
          .getStudentApplications(),
    }).subscribe({
      next:
        ({
          profile,
          requests,
          applications,
        }) => {
          this.profile.set(
            profile.profile,
          );

          this.requests.set(
            requests.requests,
          );

          const application =
            applications
              .applications
              .find(
                (candidate) =>
                  candidate.status
                    !== 'CANCELLED'
                  && this.academicYears
                    .includes(
                      candidate
                        .academicYear,
                    ),
              );

          if (
            application
            !== undefined
          ) {
            this.academicYearControl
              .setValue(
                application
                  .academicYear,
              );
          }

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
              'Unable to load roommate matching.',
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