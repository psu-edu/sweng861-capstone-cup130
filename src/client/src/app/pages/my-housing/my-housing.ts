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
  HousingAssignmentApi,
  type HousingAssignmentStatus,
  type StudentHousingAssignment,
} from '../../core/services/housing-assignment-api';

import type {
  RoomStyle,
} from '../../core/services/housing-options-api';

@Component({
  selector:
    'app-my-housing',

  imports: [],

  templateUrl:
    './my-housing.html',

  styleUrl:
    './my-housing.css',
})
export class MyHousingPage
implements OnInit {
  private readonly assignmentApi =
    inject(HousingAssignmentApi);

  protected readonly assignments =
    signal<StudentHousingAssignment[]>([]);

  protected readonly loading =
    signal(true);

  protected readonly loadError =
    signal<string | null>(
      null,
    );

  ngOnInit(): void {
    this.assignmentApi
      .getStudentHousing()
      .subscribe({
        next: (response) => {
          this.assignments.set(
            response.assignments,
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
                'Unable to load your housing assignment.',
              ),
            );
          },
      });
  }

  protected activeAssignments():
  StudentHousingAssignment[] {
    return this.assignments()
      .filter(
        (assignment) =>
          assignment.status
            === 'RESERVED'
          || assignment.status
            === 'CONFIRMED',
      );
  }

  protected historicalAssignments():
  StudentHousingAssignment[] {
    return this.assignments()
      .filter(
        (assignment) =>
          assignment.status
            === 'CANCELLED'
          || assignment.status
            === 'SUPERSEDED',
      );
  }

  protected statusLabel(
    status:
      HousingAssignmentStatus,
  ): string {
    return status
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

  protected roomStyleLabel(
    roomStyle: RoomStyle,
  ): string {
    return roomStyle
      .toLowerCase()
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      );
  }

  protected formatDate(
    value: string | null,
  ): string {
    if (value === null) {
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
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        },
      );
  }

  protected assignmentMessage(
    assignment:
      StudentHousingAssignment,
  ): string {
    if (
      assignment.status
      === 'RESERVED'
    ) {
      return (
        'Your bed is reserved. Lease completion is the next step before this housing assignment becomes confirmed.'
      );
    }

    if (
      assignment.status
      === 'CONFIRMED'
    ) {
      return (
        'Your housing assignment is confirmed.'
      );
    }

    if (
      assignment.status
      === 'CANCELLED'
    ) {
      return (
        'This reservation was cancelled and the bed was released.'
      );
    }

    return (
      'This assignment was replaced by a later completed housing assignment.'
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