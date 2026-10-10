import {
  approveSubmittedApplication,
  cancelPreAssignmentApplication,
  findHousingOfficerApplicationById,
  findHousingOfficerApplications,
  findStudentApplicationById,
  findStudentApplications,
  hasActiveBuildingRoomStyle,
  insertStudentApplication,
  submitStudentDraftApplication,
  updateHousingOfficerNotes,
  updateStudentDraftApplication,
} from './housing-application.repository.js';

import {
  ROOM_STYLES,
  type RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

import type {
  HousingApplicationStatus,
  HousingOfficerApplication,
  StudentHousingApplication,
  StudentHousingApplicationInput,
  UpdateOfficerNotesInput,
} from './housing-application.types.js';

export class HousingApplicationValidationError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'HousingApplicationValidationError';
  }
}

export class HousingApplicationConflictError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'HousingApplicationConflictError';
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  );
}

function getAllowedAcademicYears(): string[] {
  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  const currentMonth =
    now.getMonth();

  const academicYearStart =
    currentMonth < 6
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

function getAcademicYear(
  input: Record<string, unknown>,
): string {
  const value =
    input.academicYear;

  if (
    typeof value !== 'string'
    || value.trim() === ''
  ) {
    throw new HousingApplicationValidationError(
      'Academic year is required.',
    );
  }

  const academicYear =
    value.trim();

  const match =
    /^(\d{4})-(\d{4})$/.exec(
      academicYear,
    );

  if (match === null) {
    throw new HousingApplicationValidationError(
      'Academic year must use the format YYYY-YYYY.',
    );
  }

  const firstYear =
    Number(match[1]);

  const secondYear =
    Number(match[2]);

  if (
    secondYear
    !== firstYear + 1
  ) {
    throw new HousingApplicationValidationError(
      'The second academic year must immediately follow the first.',
    );
  }

  const allowedAcademicYears = getAllowedAcademicYears();
  
  if (
    !allowedAcademicYears.includes(academicYear)
  ) {
    throw new HousingApplicationValidationError(
      'Academic year must be the current academic year or one of the next two academic years.',
    );
  }

  return academicYear;
}

function getPreferredBuildingId(
  input: Record<string, unknown>,
): string {
  const value =
    input.preferredBuildingId;

  if (
    typeof value !== 'string'
    || !/^[1-9]\d*$/.test(value)
  ) {
    throw new HousingApplicationValidationError(
      'Preferred residence hall is required.',
    );
  }

  return value;
}

function getPreferredRoomStyle(
  input: Record<string, unknown>,
): RoomStyle {
  const value =
    input.preferredRoomStyle;

  if (
    typeof value !== 'string'
    || !ROOM_STYLES.includes(
      value as RoomStyle,
    )
  ) {
    throw new HousingApplicationValidationError(
      'Preferred room style must be SINGLE, DOUBLE, TRIPLE, or QUAD.',
    );
  }

  return value as RoomStyle;
}

function validateInput(
  input: unknown,
): StudentHousingApplicationInput {
  if (!isRecord(input)) {
    throw new HousingApplicationValidationError(
      'Housing application data is required.',
    );
  }

  return {
    academicYear:
      getAcademicYear(input),

    preferredBuildingId:
      getPreferredBuildingId(input),

    preferredRoomStyle:
      getPreferredRoomStyle(input),
  };
}

function validateOfficerNotes(
  input: unknown,
): UpdateOfficerNotesInput {
  if (!isRecord(input)) {
    throw new HousingApplicationValidationError(
      'Housing Officer notes data is required.',
    );
  }

  const value =
    input.officerNotes;

  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return {
      officerNotes: null,
    };
  }

  if (typeof value !== 'string') {
    throw new HousingApplicationValidationError(
      'Housing Officer notes must be text or null.',
    );
  }

  const trimmed =
    value.trim();

  if (trimmed.length > 5000) {
    throw new HousingApplicationValidationError(
      'Housing Officer notes must be 5000 characters or fewer.',
    );
  }

  return {
    officerNotes:
      trimmed === ''
        ? null
        : trimmed,
  };
}

function validateApplicationId(
  applicationId: string,
): void {
  if (
    !/^[1-9]\d*$/.test(
      applicationId,
    )
  ) {
    throw new HousingApplicationValidationError(
      'Housing application id is invalid.',
    );
  }
}

function isDatabaseError(
  error: unknown,
  code: string,
): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === code
  );
}

async function validatePreference(
  input: StudentHousingApplicationInput,
): Promise<void> {
  const valid =
    await hasActiveBuildingRoomStyle(
      input.preferredBuildingId,
      input.preferredRoomStyle,
    );

  if (!valid) {
    throw new HousingApplicationValidationError(
      'The selected residence hall and room style are not currently available as a housing option.',
    );
  }
}

function assertPreAssignmentCancellationAllowed(
  status: HousingApplicationStatus,
): void {
  if (
    status === 'DRAFT'
    || status === 'SUBMITTED'
    || status === 'APPROVED'
  ) {
    return;
  }

  if (status === 'HOUSING_ASSIGNED') {
    throw new HousingApplicationConflictError(
      'Housing-assigned applications must be cancelled through the housing assignment workflow.',
    );
  }

  if (status === 'COMPLETED') {
    throw new HousingApplicationConflictError(
      'Completed housing applications cannot be cancelled.',
    );
  }

  throw new HousingApplicationConflictError(
    'The housing application is already cancelled.',
  );
}

export async function getStudentHousingApplications(
  studentId: string,
): Promise<StudentHousingApplication[]> {
  return findStudentApplications(
    studentId,
  );
}

export async function createStudentHousingApplication(
  studentId: string,
  input: unknown,
): Promise<StudentHousingApplication> {
  const validated =
    validateInput(input);

  await validatePreference(
    validated,
  );

  try {
    return await insertStudentApplication(
      studentId,
      validated,
    );
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new HousingApplicationConflictError(
        'You already have an active housing application.',
      );
    }

    throw error;
  }
}

export async function editStudentHousingApplication(
  studentId: string,
  applicationId: string,
  input: unknown,
): Promise<StudentHousingApplication | null> {
  validateApplicationId(
    applicationId,
  );

  const existing =
    await findStudentApplicationById(
      studentId,
      applicationId,
    );

  if (existing === null) {
    return null;
  }

  if (existing.status !== 'DRAFT') {
    throw new HousingApplicationConflictError(
      'Only draft housing applications can be edited.',
    );
  }

  const validated =
    validateInput(input);

  await validatePreference(
    validated,
  );

  try {
    const application =
      await updateStudentDraftApplication(
        studentId,
        applicationId,
        validated,
      );

    if (application === null) {
      throw new HousingApplicationConflictError(
        'The housing application is no longer editable.',
      );
    }

    return application;
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new HousingApplicationConflictError(
        'You already have an active housing application.',
      );
    }

    throw error;
  }
}

export async function submitStudentHousingApplication(
  studentId: string,
  applicationId: string,
): Promise<StudentHousingApplication | null> {
  validateApplicationId(
    applicationId,
  );

  const existing =
    await findStudentApplicationById(
      studentId,
      applicationId,
    );

  if (existing === null) {
    return null;
  }

  if (existing.status !== 'DRAFT') {
    throw new HousingApplicationConflictError(
      'Only draft housing applications can be submitted.',
    );
  }

  await validatePreference({
    academicYear:
      existing.academicYear,
    preferredBuildingId:
      existing.preferredBuildingId,
    preferredRoomStyle:
      existing.preferredRoomStyle,
  });

  const application =
    await submitStudentDraftApplication(
      studentId,
      applicationId,
    );

  if (application === null) {
    throw new HousingApplicationConflictError(
      'The housing application is no longer in draft status.',
    );
  }

  return application;
}

export async function cancelStudentHousingApplication(
  studentId: string,
  applicationId: string,
): Promise<StudentHousingApplication | null> {
  validateApplicationId(
    applicationId,
  );

  const existing =
    await findStudentApplicationById(
      studentId,
      applicationId,
    );

  if (existing === null) {
    return null;
  }

  assertPreAssignmentCancellationAllowed(
    existing.status,
  );

  const cancelled =
    await cancelPreAssignmentApplication(
      applicationId,
      studentId,
    );

  if (!cancelled) {
    throw new HousingApplicationConflictError(
      'The housing application can no longer be cancelled.',
    );
  }

  return findStudentApplicationById(
    studentId,
    applicationId,
  );
}

export async function getHousingOfficerApplications():
Promise<HousingOfficerApplication[]> {
  return findHousingOfficerApplications();
}

export async function getHousingOfficerApplication(
  applicationId: string,
): Promise<HousingOfficerApplication | null> {
  validateApplicationId(
    applicationId,
  );

  return findHousingOfficerApplicationById(
    applicationId,
  );
}

export async function saveHousingOfficerNotes(
  applicationId: string,
  input: unknown,
): Promise<HousingOfficerApplication | null> {
  validateApplicationId(
    applicationId,
  );

  const validated =
    validateOfficerNotes(input);

  return updateHousingOfficerNotes(
    applicationId,
    validated,
  );
}

export async function approveHousingApplication(
  applicationId: string,
  officerId: string,
): Promise<HousingOfficerApplication | null> {
  validateApplicationId(
    applicationId,
  );

  const existing =
    await findHousingOfficerApplicationById(
      applicationId,
    );

  if (existing === null) {
    return null;
  }

  if (existing.status !== 'SUBMITTED') {
    throw new HousingApplicationConflictError(
      'Only submitted housing applications can be approved.',
    );
  }

  const application =
    await approveSubmittedApplication(
      applicationId,
      officerId,
    );

  if (application === null) {
    throw new HousingApplicationConflictError(
      'The housing application is no longer awaiting approval.',
    );
  }

  return application;
}

export async function cancelHousingOfficerApplication(
  applicationId: string,
  officerId: string,
): Promise<HousingOfficerApplication | null> {
  validateApplicationId(
    applicationId,
  );

  const existing =
    await findHousingOfficerApplicationById(
      applicationId,
    );

  if (existing === null) {
    return null;
  }

  assertPreAssignmentCancellationAllowed(
    existing.status,
  );

  const cancelled =
    await cancelPreAssignmentApplication(
      applicationId,
      officerId,
    );

  if (!cancelled) {
    throw new HousingApplicationConflictError(
      'The housing application can no longer be cancelled.',
    );
  }

  return findHousingOfficerApplicationById(
    applicationId,
  );
}