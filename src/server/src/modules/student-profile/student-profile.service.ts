import {
  findStudentProfileByUserId,
  updateStudentProfileByUserId,
} from './student-profile.repository.js';

import {
  ACADEMIC_STATUSES,
  GENDERS,
  GRADUATION_SEMESTERS,
  type AcademicStatus,
  type Gender,
  type GraduationSemester,
  type StudentProfile,
  type UpdateStudentProfileInput,
} from './student-profile.types.js';

export class StudentProfileValidationError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'StudentProfileValidationError';
  }
}

export class StudentProfileConflictError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'StudentProfileConflictError';
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

function getRequiredString(
  input: Record<string, unknown>,
  field: string,
  label: string,
  maxLength: number,
): string {
  const value = input[field];

  if (
    typeof value !== 'string'
    || value.trim() === ''
  ) {
    throw new StudentProfileValidationError(
      `${label} is required.`,
    );
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length > maxLength) {
    throw new StudentProfileValidationError(
      `${label} must be ${maxLength} characters or fewer.`,
    );
  }

  return trimmedValue;
}

function getGender(
  input: Record<string, unknown>,
): Gender {
  const value = input.gender;

  if (
    typeof value !== 'string'
    || !GENDERS.includes(
      value as Gender,
    )
  ) {
    throw new StudentProfileValidationError(
      'Gender must be MALE, FEMALE, or UNSPECIFIED.',
    );
  }

  return value as Gender;
}

function getAcademicStatus(
  input: Record<string, unknown>,
): AcademicStatus {
  const value = input.academicStatus;

  if (
    typeof value !== 'string'
    || !ACADEMIC_STATUSES.includes(
      value as AcademicStatus,
    )
  ) {
    throw new StudentProfileValidationError(
      'Academic status is invalid.',
    );
  }

  return value as AcademicStatus;
}

function getGraduationSemester(
  input: Record<string, unknown>,
): GraduationSemester | null {
  const value =
    input.anticipatedGraduationSemester;

  if (
    value === null
    || value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== 'string'
    || !GRADUATION_SEMESTERS.includes(
      value as GraduationSemester,
    )
  ) {
    throw new StudentProfileValidationError(
      'Anticipated graduation semester must be SPRING, SUMMER, FALL, or null.',
    );
  }

  return value as GraduationSemester;
}

function getGraduationYear(
  input: Record<string, unknown>,
): number | null {
  const value =
    input.anticipatedGraduationYear;

  if (
    value === null
    || value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== 'number'
    || !Number.isInteger(value)
  ) {
    throw new StudentProfileValidationError(
      'Anticipated graduation year must be an integer or null.',
    );
  }

  return value;
}

function validateUpdateInput(
  input: unknown,
): UpdateStudentProfileInput {
  if (!isRecord(input)) {
    throw new StudentProfileValidationError(
      'Student profile data is required.',
    );
  }

  return {
    studentNumber:
      getRequiredString(
        input,
        'studentNumber',
        'Student number',
        30,
      ),

    firstName:
      getRequiredString(
        input,
        'firstName',
        'First name',
        100,
      ),

    lastName:
      getRequiredString(
        input,
        'lastName',
        'Last name',
        100,
      ),

    gender:
      getGender(input),

    academicStatus:
      getAcademicStatus(input),

    major:
      getRequiredString(
        input,
        'major',
        'Major',
        150,
      ),

    anticipatedGraduationSemester:
      getGraduationSemester(input),

    anticipatedGraduationYear:
      getGraduationYear(input),
  };
}

function isUniqueConstraintViolation(
  error: unknown,
): boolean {
  if (
    typeof error !== 'object'
    || error === null
    || !('code' in error)
  ) {
    return false;
  }

  return error.code === '23505';
}

export async function getStudentProfile(
  userId: string,
): Promise<StudentProfile | null> {
  return findStudentProfileByUserId(
    userId,
  );
}

export async function updateStudentProfile(
  userId: string,
  input: unknown,
): Promise<StudentProfile | null> {
  const validatedInput =
    validateUpdateInput(input);

  try {
    return await updateStudentProfileByUserId(
      userId,
      validatedInput,
    );
  } catch (error: unknown) {
    if (isUniqueConstraintViolation(error)) {
      throw new StudentProfileConflictError(
        'Student number is already in use.',
      );
    }

    throw error;
  }
}