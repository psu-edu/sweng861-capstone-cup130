import type {
  HousingApplicationStatus,
} from '../housing-application/housing-application.types.js';

import type {
  RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

export const HOUSING_ASSIGNMENT_STATUSES = [
  'RESERVED',
  'CONFIRMED',
  'CANCELLED',
  'SUPERSEDED',
] as const;

export type HousingAssignmentStatus =
  (typeof HOUSING_ASSIGNMENT_STATUSES)[number];

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
  reservedAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  supersededAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  reservedAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  supersededAt: Date | null;
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

export interface CreateHousingAssignmentInput {
  applicationId: string;
  bedId: string;
}

export interface CreateRoommatePairAssignmentInput {
  applicationId: string;
  roommateApplicationId: string;
  bedId: string;
  roommateBedId: string;
}

export interface ChangeHousingAssignmentInput {
  bedId: string;
}