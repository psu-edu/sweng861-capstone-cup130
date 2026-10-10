import type {
  AcademicStatus,
  Gender,
  GraduationSemester,
} from '../student-profile/student-profile.types.js';

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

export const ROOMMATE_REQUEST_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
] as const;

export type RoommateRequestStatus =
  (typeof ROOMMATE_REQUEST_STATUSES)[number];

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

  createdAt: Date;
  updatedAt: Date;
}

export interface RoommateProfileInput {
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
}

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

export interface RoommateStudentEligibility {
  studentId: string;
  gender: Gender;
}

export interface RoommateRequest {
  id: string;
  academicYear: string;
  status: RoommateRequestStatus;
  requester: RoommateStudentSummary;
  requested: RoommateStudentSummary;
  respondedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoommateRequestInput {
  requestedStudentId: string;
  academicYear: string;
}