import type {
  Gender,
} from '../student-profile/student-profile.types.js';

import {
  acceptPendingRoommateRequest,
  cancelPendingRoommateRequest,
  declinePendingRoommateRequest,
  findRoommateProfileByStudentId,
  findRoommateRequestByIdForStudent,
  findRoommateRequestsForStudent,
  findRoommateStudentEligibilityById,
  insertRoommateRequest,
  searchRoommateStudents,
  upsertRoommateProfile,
} from './roommate-matching.repository.js';

import {
  ROOMMATE_PRIORITIES,
  type CreateRoommateRequestInput,
  type RoommatePriority,
  type RoommateProfile,
  type RoommateProfileInput,
  type RoommateRequest,
  type RoommateStudentSummary,
} from './roommate-matching.types.js';

type MatchableGender =
  Exclude<Gender, 'UNSPECIFIED'>;

export class RoommateValidationError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'RoommateValidationError';
  }
}

export class RoommateConflictError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'RoommateConflictError';
  }
}

export class RoommateNotFoundError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'RoommateNotFoundError';
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

function getBoolean(
  input: Record<string, unknown>,
  field: string,
  label: string,
): boolean {
  const value =
    input[field];

  if (typeof value !== 'boolean') {
    throw new RoommateValidationError(
      `${label} must be true or false.`,
    );
  }

  return value;
}

function getPreference(
  input: Record<string, unknown>,
  field: string,
  label: string,
): number {
  const value =
    input[field];

  if (
    typeof value !== 'number'
    || !Number.isInteger(value)
    || value < 1
    || value > 5
  ) {
    throw new RoommateValidationError(
      `${label} must be an integer from 1 through 5.`,
    );
  }

  return value;
}

function getPriority(
  input: Record<string, unknown>,
  field: string,
  label: string,
): RoommatePriority | null {
  const value =
    input[field];

  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return null;
  }

  if (
    typeof value !== 'string'
    || !ROOMMATE_PRIORITIES.includes(
      value as RoommatePriority,
    )
  ) {
    throw new RoommateValidationError(
      `${label} is invalid.`,
    );
  }

  return value as RoommatePriority;
}

function getOptionalText(
  input: Record<string, unknown>,
  field: string,
  label: string,
): string | null {
  const value =
    input[field];

  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new RoommateValidationError(
      `${label} must be text or null.`,
    );
  }

  const trimmed =
    value.trim();

  return (
    trimmed === ''
      ? null
      : trimmed
  );
}

function validatePriorities(
  priorities: (RoommatePriority | null)[],
): void {
  const selected =
    priorities.filter(
      (
        priority,
      ): priority is RoommatePriority =>
        priority !== null,
    );

  if (
    new Set(selected).size
    !== selected.length
  ) {
    throw new RoommateValidationError(
      'Roommate profile priorities must be unique.',
    );
  }
}

function validateRoommateProfileInput(
  input: unknown,
): RoommateProfileInput {
  if (!isRecord(input)) {
    throw new RoommateValidationError(
      'Roommate profile data is required.',
    );
  }

  const priority1 =
    getPriority(
      input,
      'priority1',
      'Priority 1',
    );

  const priority2 =
    getPriority(
      input,
      'priority2',
      'Priority 2',
    );

  const priority3 =
    getPriority(
      input,
      'priority3',
      'Priority 3',
    );

  validatePriorities([
    priority1,
    priority2,
    priority3,
  ]);

  return {
    optedIn:
      getBoolean(
        input,
        'optedIn',
        'AI-assisted roommate matching opt-in',
      ),

    sleepSchedule:
      getPreference(
        input,
        'sleepSchedule',
        'Sleep schedule',
      ),

    wakeSchedule:
      getPreference(
        input,
        'wakeSchedule',
        'Wake schedule',
      ),

    cleanliness:
      getPreference(
        input,
        'cleanliness',
        'Cleanliness preference',
      ),

    studyEnvironment:
      getPreference(
        input,
        'studyEnvironment',
        'Study environment',
      ),

    noiseTolerance:
      getPreference(
        input,
        'noiseTolerance',
        'Noise tolerance',
      ),

    socialPreference:
      getPreference(
        input,
        'socialPreference',
        'Social preference',
      ),

    guestFrequency:
      getPreference(
        input,
        'guestFrequency',
        'Guest frequency',
      ),

    roomUse:
      getPreference(
        input,
        'roomUse',
        'Typical room use',
      ),

    sharingPreference:
      getPreference(
        input,
        'sharingPreference',
        'Shared-belongings preference',
      ),

    temperaturePreference:
      getPreference(
        input,
        'temperaturePreference',
        'Temperature preference',
      ),

    communicationStyle:
      getPreference(
        input,
        'communicationStyle',
        'Communication style',
      ),

    conflictResolution:
      getPreference(
        input,
        'conflictResolution',
        'Conflict-resolution approach',
      ),

    priority1,
    priority2,
    priority3,

    aboutMe:
      getOptionalText(
        input,
        'aboutMe',
        'About Me',
      ),

    lookingFor:
      getOptionalText(
        input,
        'lookingFor',
        'What I Am Looking For',
      ),
  };
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
    throw new RoommateValidationError(
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
    throw new RoommateValidationError(
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
    throw new RoommateValidationError(
      'The second academic year must immediately follow the first.',
    );
  }

  if (
    !getAllowedAcademicYears().includes(
      academicYear,
    )
  ) {
    throw new RoommateValidationError(
      'Academic year must be the current academic year or one of the next two academic years.',
    );
  }

  return academicYear;
}

function getStudentId(
  input: Record<string, unknown>,
  field: string,
  label: string,
): string {
  const value =
    input[field];

  if (
    typeof value !== 'string'
    || !/^[1-9]\d*$/.test(value)
  ) {
    throw new RoommateValidationError(
      `${label} is invalid.`,
    );
  }

  return value;
}

function validateCreateRequestInput(
  input: unknown,
): CreateRoommateRequestInput {
  if (!isRecord(input)) {
    throw new RoommateValidationError(
      'Roommate request data is required.',
    );
  }

  return {
    requestedStudentId:
      getStudentId(
        input,
        'requestedStudentId',
        'Requested student id',
      ),

    academicYear:
      getAcademicYear(input),
  };
}

function validateRequestId(
  requestId: string,
): void {
  if (!/^[1-9]\d*$/.test(requestId)) {
    throw new RoommateValidationError(
      'Roommate request id is invalid.',
    );
  }
}

function getSearchTerm(
  value: unknown,
): string {
  if (
    typeof value !== 'string'
    || value.trim() === ''
  ) {
    throw new RoommateValidationError(
      'A student name or student number is required for search.',
    );
  }

  return value.trim();
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

function isMatchableGender(
  gender: Gender,
): gender is MatchableGender {
  return (
    gender === 'MALE'
    || gender === 'FEMALE'
  );
}

async function getCurrentStudentMatchableGender(
  studentId: string,
): Promise<MatchableGender> {
  const student =
    await findRoommateStudentEligibilityById(
      studentId,
    );

  if (student === null) {
    throw new RoommateNotFoundError(
      'Student profile was not found.',
    );
  }

  if (
    !isMatchableGender(
      student.gender,
    )
  ) {
    throw new RoommateConflictError(
      'Set your gender to MALE or FEMALE in your Student Profile before using roommate matching.',
    );
  }

  return student.gender;
}

async function getRequestedStudentMatchableGender(
  studentId: string,
): Promise<MatchableGender> {
  const student =
    await findRoommateStudentEligibilityById(
      studentId,
    );

  if (student === null) {
    throw new RoommateNotFoundError(
      'The requested student was not found.',
    );
  }

  if (
    !isMatchableGender(
      student.gender,
    )
  ) {
    throw new RoommateConflictError(
      'The requested student must set their gender to MALE or FEMALE before they can participate in roommate matching.',
    );
  }

  return student.gender;
}

function assertMatchingGender(
  firstGender: MatchableGender,
  secondGender: MatchableGender,
): void {
  if (
    firstGender
    !== secondGender
  ) {
    throw new RoommateConflictError(
      'Roommate requests are limited to students with the same gender.',
    );
  }
}

export async function getRoommateProfile(
  studentId: string,
): Promise<RoommateProfile | null> {
  return findRoommateProfileByStudentId(
    studentId,
  );
}

export async function saveRoommateProfile(
  studentId: string,
  input: unknown,
): Promise<RoommateProfile> {
  const validated =
    validateRoommateProfileInput(
      input,
    );

  return upsertRoommateProfile(
    studentId,
    validated,
  );
}

export async function findRoommateStudents(
  studentId: string,
  searchValue: unknown,
): Promise<RoommateStudentSummary[]> {
  const searchTerm =
    getSearchTerm(
      searchValue,
    );

  const gender =
    await getCurrentStudentMatchableGender(
      studentId,
    );

  return searchRoommateStudents(
    studentId,
    gender,
    searchTerm,
  );
}

export async function getRoommateRequests(
  studentId: string,
): Promise<RoommateRequest[]> {
  return findRoommateRequestsForStudent(
    studentId,
  );
}

export async function createRoommateRequest(
  studentId: string,
  input: unknown,
): Promise<RoommateRequest> {
  const validated =
    validateCreateRequestInput(
      input,
    );

  if (
    validated.requestedStudentId
    === studentId
  ) {
    throw new RoommateValidationError(
      'You cannot send a roommate request to yourself.',
    );
  }

  const requesterGender =
    await getCurrentStudentMatchableGender(
      studentId,
    );

  const requestedGender =
    await getRequestedStudentMatchableGender(
      validated.requestedStudentId,
    );

  assertMatchingGender(
    requesterGender,
    requestedGender,
  );

  try {
    return await insertRoommateRequest(
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
      throw new RoommateConflictError(
        'An active roommate request already exists between these students for this academic year.',
      );
    }

    if (
      isDatabaseError(
        error,
        '23503',
      )
    ) {
      throw new RoommateNotFoundError(
        'The requested student was not found.',
      );
    }

    throw error;
  }
}

export async function acceptRoommateRequest(
  studentId: string,
  requestId: string,
): Promise<RoommateRequest | null> {
  validateRequestId(
    requestId,
  );

  const existing =
    await findRoommateRequestByIdForStudent(
      requestId,
      studentId,
    );

  if (existing === null) {
    return null;
  }

  if (
    existing.requested.studentId
    !== studentId
  ) {
    throw new RoommateConflictError(
      'Only the requested student can accept this roommate request.',
    );
  }

  if (existing.status !== 'PENDING') {
    throw new RoommateConflictError(
      'Only pending roommate requests can be accepted.',
    );
  }

  const requestedGender =
    await getCurrentStudentMatchableGender(
      studentId,
    );

  const requesterGender =
    await getRequestedStudentMatchableGender(
      existing.requester.studentId,
    );

  assertMatchingGender(
    requesterGender,
    requestedGender,
  );

  const accepted =
    await acceptPendingRoommateRequest(
      requestId,
      studentId,
    );

  if (accepted === null) {
    throw new RoommateConflictError(
      'The roommate request is no longer pending.',
    );
  }

  return accepted;
}

export async function declineRoommateRequest(
  studentId: string,
  requestId: string,
): Promise<RoommateRequest | null> {
  validateRequestId(
    requestId,
  );

  const existing =
    await findRoommateRequestByIdForStudent(
      requestId,
      studentId,
    );

  if (existing === null) {
    return null;
  }

  if (
    existing.requested.studentId
    !== studentId
  ) {
    throw new RoommateConflictError(
      'Only the requested student can decline this roommate request.',
    );
  }

  if (existing.status !== 'PENDING') {
    throw new RoommateConflictError(
      'Only pending roommate requests can be declined.',
    );
  }

  const declined =
    await declinePendingRoommateRequest(
      requestId,
      studentId,
    );

  if (declined === null) {
    throw new RoommateConflictError(
      'The roommate request is no longer pending.',
    );
  }

  return declined;
}

export async function cancelRoommateRequest(
  studentId: string,
  requestId: string,
): Promise<RoommateRequest | null> {
  validateRequestId(
    requestId,
  );

  const existing =
    await findRoommateRequestByIdForStudent(
      requestId,
      studentId,
    );

  if (existing === null) {
    return null;
  }

  if (
    existing.requester.studentId
    !== studentId
  ) {
    throw new RoommateConflictError(
      'Only the requesting student can cancel this roommate request.',
    );
  }

  if (existing.status !== 'PENDING') {
    throw new RoommateConflictError(
      'Only pending roommate requests can be cancelled.',
    );
  }

  const cancelled =
    await cancelPendingRoommateRequest(
      requestId,
      studentId,
    );

  if (cancelled === null) {
    throw new RoommateConflictError(
      'The roommate request is no longer pending.',
    );
  }

  return cancelled;
}