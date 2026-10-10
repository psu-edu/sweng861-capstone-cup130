import {
  findStudentApplicationById,
  findStudentApplications,
  hasActiveBuildingRoomStyle,
  insertStudentApplication,
  submitStudentDraftApplication,
  updateStudentDraftApplication,
} from './housing-application.repository.js';

import {
  ROOM_STYLES,
  type RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

import type {
  StudentHousingApplication,
  StudentHousingApplicationInput,
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