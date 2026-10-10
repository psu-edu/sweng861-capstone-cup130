import {
  HttpClient,
} from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

import type {
  RoomStyle,
} from './housing-options-api';

export type HousingApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'HOUSING_ASSIGNED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface StudentHousingApplication {
  id: string;
  academicYear: string;
  preferredBuildingId: string;
  preferredBuildingName: string;
  preferredRoomStyle: RoomStyle;
  status: HousingApplicationStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  housingAssignedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HousingOfficerApplication {
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
  officerNotes: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  housingAssignedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HousingApplicationInput {
  academicYear: string;
  preferredBuildingId: string;
  preferredRoomStyle: RoomStyle;
}

interface StudentApplicationsResponse {
  applications: StudentHousingApplication[];
}

interface StudentApplicationResponse {
  application: StudentHousingApplication;
}

interface OfficerApplicationsResponse {
  applications: HousingOfficerApplication[];
}

interface OfficerApplicationResponse {
  application: HousingOfficerApplication;
}

@Injectable({
  providedIn: 'root',
})
export class HousingApplicationApi {
  private readonly http =
    inject(HttpClient);

  getStudentApplications() {
    return this.http.get<StudentApplicationsResponse>(
      '/api/student/applications',
    );
  }

  createStudentApplication(
    input: HousingApplicationInput,
  ) {
    return this.http.post<StudentApplicationResponse>(
      '/api/student/applications',
      input,
    );
  }

  updateStudentApplication(
    applicationId: string,
    input: HousingApplicationInput,
  ) {
    return this.http.put<StudentApplicationResponse>(
      `/api/student/applications/${applicationId}`,
      input,
    );
  }

  submitStudentApplication(
    applicationId: string,
  ) {
    return this.http.post<StudentApplicationResponse>(
      `/api/student/applications/${applicationId}/submit`,
      {},
    );
  }

  cancelStudentApplication(
    applicationId: string,
  ) {
    return this.http.post<StudentApplicationResponse>(
      `/api/student/applications/${applicationId}/cancel`,
      {},
    );
  }

  getOfficerApplications() {
    return this.http.get<OfficerApplicationsResponse>(
      '/api/applications',
    );
  }

  getOfficerApplication(
    applicationId: string,
  ) {
    return this.http.get<OfficerApplicationResponse>(
      `/api/applications/${applicationId}`,
    );
  }

  updateOfficerNotes(
    applicationId: string,
    officerNotes: string | null,
  ) {
    return this.http.put<OfficerApplicationResponse>(
      `/api/applications/${applicationId}/notes`,
      {
        officerNotes,
      },
    );
  }

  approveOfficerApplication(
    applicationId: string,
  ) {
    return this.http.post<OfficerApplicationResponse>(
      `/api/applications/${applicationId}/approve`,
      {},
    );
  }

  cancelOfficerApplication(
    applicationId: string,
  ) {
    return this.http.post<OfficerApplicationResponse>(
      `/api/applications/${applicationId}/cancel`,
      {},
    );
  }
}