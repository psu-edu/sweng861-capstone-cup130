import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

import type {
  AcademicStatus,
  GraduationSemester,
} from './student-profile-api';

export const ROOMMATE_PRIORITIES = [
  'SLEEP_SCHEDULE',
  'WAKE_SCHEDULE',
  'CLEANLINESS',
  'STUDY_ENVIRONMENT',
  'NOISE_TOLERANCE',
  'SOCIAL_PREFERENCE',
  'GUEST_FREQUENCY',
  'ROOM_USE',
  'SHARING_PREFERENCE',
  'TEMPERATURE',
  'COMMUNICATION_STYLE',
  'CONFLICT_RESOLUTION',
] as const;

export type RoommatePriority =
  (typeof ROOMMATE_PRIORITIES)[number];

export type RoommateRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELLED';

export type CompatibilityCategory =
  | 'EXCELLENT'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED';

export type AIAnalysisSource =
  | 'MOCK'
  | 'REMOTE'
  | 'FALLBACK';

export interface RoommateProfile {
  studentId: string;
  optedIn: boolean;

  sleepSchedule: number;
  wakeSchedule: number;
  cleanliness: number;
  studyEnvironment: number;
  noiseTolerance: number;
  socialPreference: number;
  guestFrequency: number;
  roomUse: number;
  sharingPreference: number;
  temperaturePreference: number;
  communicationStyle: number;
  conflictResolution: number;

  priority1: RoommatePriority | null;
  priority2: RoommatePriority | null;
  priority3: RoommatePriority | null;

  aboutMe: string | null;
  lookingFor: string | null;

  createdAt: string;
  updatedAt: string;
}

export type RoommateProfileInput =
  Omit<
    RoommateProfile,
    'studentId'
    | 'createdAt'
    | 'updatedAt'
  >;

export interface RoommateStudentSummary {
  studentId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  academicStatus: AcademicStatus;
  major: string;
  anticipatedGraduationSemester:
    GraduationSemester | null;
  anticipatedGraduationYear:
    number | null;
}

export interface RoommateRequest {
  id: string;
  academicYear: string;
  status: RoommateRequestStatus;

  requester:
    RoommateStudentSummary;

  requested:
    RoommateStudentSummary;

  respondedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoommateRecommendation {
  candidate:
    RoommateStudentSummary;

  compatibilityScore: number;

  compatibilityCategory:
    CompatibilityCategory;

  structuredScore: number;
  semanticScore: number;

  strengths: string[];
  differences: string[];

  explanation: string;

  analysisSource:
    AIAnalysisSource;
}

export interface RoommateRecommendationResult {
  academicYear: string;

  recommendations:
    RoommateRecommendation[];
}

interface RoommateProfileResponse {
  profile:
    RoommateProfile | null;
}

interface RoommateStudentsResponse {
  students:
    RoommateStudentSummary[];
}

interface RoommateRequestsResponse {
  requests:
    RoommateRequest[];
}

interface RoommateRequestResponse {
  request:
    RoommateRequest;
}

@Injectable({
  providedIn: 'root',
})
export class RoommateMatchingApi {
  private readonly http =
    inject(HttpClient);

  getProfile() {
    return this.http
      .get<RoommateProfileResponse>(
        '/api/student/roommates/profile',
      );
  }

  saveProfile(
    input: RoommateProfileInput,
  ) {
    return this.http
      .put<RoommateProfileResponse>(
        '/api/student/roommates/profile',
        input,
      );
  }

  searchStudents(
    searchTerm: string,
  ) {
    const params =
      new HttpParams()
        .set(
          'q',
          searchTerm,
        );

    return this.http
      .get<RoommateStudentsResponse>(
        '/api/student/roommates/search',
        {
          params,
        },
      );
  }

  getRequests() {
    return this.http
      .get<RoommateRequestsResponse>(
        '/api/student/roommates/requests',
      );
  }

  createRequest(
    requestedStudentId: string,
    academicYear: string,
  ) {
    return this.http
      .post<RoommateRequestResponse>(
        '/api/student/roommates/requests',
        {
          requestedStudentId,
          academicYear,
        },
      );
  }

  acceptRequest(
    requestId: string,
  ) {
    return this.http
      .post<RoommateRequestResponse>(
        `/api/student/roommates/requests/${requestId}/accept`,
        {},
      );
  }

  declineRequest(
    requestId: string,
  ) {
    return this.http
      .post<RoommateRequestResponse>(
        `/api/student/roommates/requests/${requestId}/decline`,
        {},
      );
  }

  cancelRequest(
    requestId: string,
  ) {
    return this.http
      .post<RoommateRequestResponse>(
        `/api/student/roommates/requests/${requestId}/cancel`,
        {},
      );
  }

  getRecommendations(
    academicYear: string,
  ) {
    const params =
      new HttpParams()
        .set(
          'academicYear',
          academicYear,
        );

    return this.http
      .get<RoommateRecommendationResult>(
        '/api/student/roommates/recommendations',
        {
          params,
        },
      );
  }
}