import {
  HttpClient,
} from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

import type {
  HousingApplicationStatus,
} from './housing-application-api';

import type {
  RoomStyle,
} from './housing-options-api';

export type HousingAssignmentStatus =
  | 'RESERVED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'SUPERSEDED';

export interface HousingAssignmentRecord {
  id: string;
  applicationId: string;
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  academicYear: string;
  status: HousingAssignmentStatus;
  buildingId: string;
  buildingName: string;
  roomId: string;
  roomNumber: string;
  roomStyle: RoomStyle;
  bedId: string;
  bedLabel: string;
  reservedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  supersededAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentHousingAssignment {
  id: string;
  applicationId: string;
  academicYear: string;
  status: HousingAssignmentStatus;
  buildingName: string;
  roomNumber: string;
  roomStyle: RoomStyle;
  bedLabel: string;
  reservedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  supersededAt: string | null;
}

export interface HousingAssignmentRoommate {
  requestId: string;
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  applicationId: string | null;
  applicationStatus:
    HousingApplicationStatus | null;
}

export interface HousingAssignmentApplication {
  id: string;
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  academicStatus: string;
  major: string;
  anticipatedGraduationSemester:
    string | null;
  anticipatedGraduationYear:
    number | null;
  academicYear: string;
  preferredBuildingId: string;
  preferredBuildingName: string;
  preferredRoomStyle: RoomStyle;
  status: HousingApplicationStatus;
  assignmentId: string | null;
  assignmentStatus:
    HousingAssignmentStatus | null;
  roommates:
    HousingAssignmentRoommate[];
}

export interface HousingAssignmentOptionBed {
  id: string;
  bedLabel: string;
  available: boolean;
}

export interface HousingAssignmentOptionRoom {
  id: string;
  roomNumber: string;
  floor: number | null;
  roomStyle: RoomStyle;
  preferredRoomStyle: boolean;
  matchesPreferences: boolean;
  availableBedCount: number;
  beds:
    HousingAssignmentOptionBed[];
}

export interface HousingAssignmentOptionBuilding {
  id: string;
  name: string;
  address: string;
  preferredBuilding: boolean;
  rooms:
    HousingAssignmentOptionRoom[];
}

export interface HousingAssignmentOptions {
  applicationId: string;
  academicYear: string;
  status: HousingApplicationStatus;
  preferredBuildingId: string;
  preferredBuildingName: string;
  preferredRoomStyle: RoomStyle;
  buildings:
    HousingAssignmentOptionBuilding[];
}

interface HousingAssignmentOverviewResponse {
  applications:
    HousingAssignmentApplication[];
  assignments:
    HousingAssignmentRecord[];
}

interface HousingAssignmentOptionsResponse {
  options:
    HousingAssignmentOptions;
}

interface HousingAssignmentResponse {
  assignment:
    HousingAssignmentRecord;
}

interface HousingAssignmentPairResponse {
  assignments:
    HousingAssignmentRecord[];
}

interface StudentHousingAssignmentsResponse {
  assignments:
    StudentHousingAssignment[];
}

@Injectable({
  providedIn: 'root',
})
export class HousingAssignmentApi {
  private readonly http =
    inject(HttpClient);

  getOfficerOverview() {
    return this.http
      .get<HousingAssignmentOverviewResponse>(
        '/api/assignments',
      );
  }

  getApplicationOptions(
    applicationId: string,
  ) {
    return this.http
      .get<HousingAssignmentOptionsResponse>(
        `/api/assignments/applications/${applicationId}/options`,
      );
  }

  createAssignment(
    applicationId: string,
    bedId: string,
  ) {
    return this.http
      .post<HousingAssignmentResponse>(
        '/api/assignments',
        {
          applicationId,
          bedId,
        },
      );
  }

  createPairAssignment(
    applicationId: string,
    roommateApplicationId: string,
    bedId: string,
    roommateBedId: string,
  ) {
    return this.http
      .post<HousingAssignmentPairResponse>(
        '/api/assignments/pair',
        {
          applicationId,
          roommateApplicationId,
          bedId,
          roommateBedId,
        },
      );
  }

  changeAssignment(
    assignmentId: string,
    bedId: string,
  ) {
    return this.http
      .post<HousingAssignmentResponse>(
        `/api/assignments/${assignmentId}/change`,
        {
          bedId,
        },
      );
  }

  cancelAssignmentOnly(
    assignmentId: string,
  ) {
    return this.http
      .post<HousingAssignmentResponse>(
        `/api/assignments/${assignmentId}/cancel-assignment`,
        {},
      );
  }

  cancelApplication(
    assignmentId: string,
  ) {
    return this.http
      .post<HousingAssignmentResponse>(
        `/api/assignments/${assignmentId}/cancel`,
        {},
      );
  }

  getStudentHousing() {
    return this.http
      .get<StudentHousingAssignmentsResponse>(
        '/api/student/housing-assignments',
      );
  }
}