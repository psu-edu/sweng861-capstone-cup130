import type {
  RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

export const HOUSING_APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'HOUSING_ASSIGNED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type HousingApplicationStatus =
  (typeof HOUSING_APPLICATION_STATUSES)[number];

export interface StudentHousingApplication {
  id: string;
  academicYear: string;
  preferredBuildingId: string;
  preferredBuildingName: string;
  preferredRoomStyle: RoomStyle;
  status: HousingApplicationStatus;
  submittedAt: Date | null;
  approvedAt: Date | null;
  housingAssignedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentHousingApplicationInput {
  academicYear: string;
  preferredBuildingId: string;
  preferredRoomStyle: RoomStyle;
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
  submittedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  housingAssignedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateOfficerNotesInput {
  officerNotes: string | null;
}