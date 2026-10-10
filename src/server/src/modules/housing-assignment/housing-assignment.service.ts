import {
  cancelReservedHousingAssignment,
  findAllHousingAssignments,
  findHousingAssignmentApplications,
  findHousingAssignmentOptions,
  findStudentHousingAssignments,
  reserveHousingAssignment,
  reserveRoommatePairAssignments,
} from './housing-assignment.repository.js';

import type {
  CreateHousingAssignmentInput,
  CreateRoommatePairAssignmentInput,
  HousingAssignmentApplication,
  HousingAssignmentOptions,
  HousingAssignmentRecord,
  StudentHousingAssignment,
} from './housing-assignment.types.js';

export class HousingAssignmentValidationError
extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      'HousingAssignmentValidationError';
  }
}

export class HousingAssignmentConflictError
extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      'HousingAssignmentConflictError';
  }
}

export class HousingAssignmentNotFoundError
extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      'HousingAssignmentNotFoundError';
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

function getId(
  input: Record<string, unknown>,
  field: string,
  label: string,
): string {
  const value =
    input[field];

  if (
    typeof value !== 'string'
    || !/^[1-9]\d*$/.test(
      value,
    )
  ) {
    throw new HousingAssignmentValidationError(
      `${label} is invalid.`,
    );
  }

  return value;
}

function validateId(
  value: string,
  label: string,
): void {
  if (
    !/^[1-9]\d*$/.test(
      value,
    )
  ) {
    throw new HousingAssignmentValidationError(
      `${label} is invalid.`,
    );
  }
}

function validateCreateInput(
  input: unknown,
): CreateHousingAssignmentInput {
  if (!isRecord(input)) {
    throw new HousingAssignmentValidationError(
      'Housing assignment data is required.',
    );
  }

  return {
    applicationId:
      getId(
        input,
        'applicationId',
        'Housing application id',
      ),

    bedId:
      getId(
        input,
        'bedId',
        'Bed id',
      ),
  };
}

function validatePairInput(
  input: unknown,
): CreateRoommatePairAssignmentInput {
  if (!isRecord(input)) {
    throw new HousingAssignmentValidationError(
      'Roommate pair assignment data is required.',
    );
  }

  const validated:
    CreateRoommatePairAssignmentInput = {
      applicationId:
        getId(
          input,
          'applicationId',
          'Housing application id',
        ),

      roommateApplicationId:
        getId(
          input,
          'roommateApplicationId',
          'Roommate housing application id',
        ),

      bedId:
        getId(
          input,
          'bedId',
          'Bed id',
        ),

      roommateBedId:
        getId(
          input,
          'roommateBedId',
          'Roommate bed id',
        ),
    };

  if (
    validated.applicationId
    === validated
      .roommateApplicationId
  ) {
    throw new HousingAssignmentValidationError(
      'Roommate pair assignment requires two different housing applications.',
    );
  }

  if (
    validated.bedId
    === validated.roommateBedId
  ) {
    throw new HousingAssignmentValidationError(
      'Roommate pair assignment requires two different beds.',
    );
  }

  return validated;
}

export async function getHousingAssignmentOverview():
Promise<{
  applications:
    HousingAssignmentApplication[];
  assignments:
    HousingAssignmentRecord[];
}> {
  const [
    applications,
    assignments,
  ] = await Promise.all([
    findHousingAssignmentApplications(),
    findAllHousingAssignments(),
  ]);

  return {
    applications,
    assignments,
  };
}

export async function getHousingAssignmentOptions(
  applicationId: string,
): Promise<HousingAssignmentOptions> {
  validateId(
    applicationId,
    'Housing application id',
  );

  const options =
    await findHousingAssignmentOptions(
      applicationId,
    );

  if (options === null) {
    throw new HousingAssignmentNotFoundError(
      'Housing application was not found.',
    );
  }

  if (
    options.status
    !== 'APPROVED'
  ) {
    throw new HousingAssignmentConflictError(
      'Only approved housing applications can receive a housing assignment.',
    );
  }

  return options;
}

export async function createHousingAssignment(
  input: unknown,
): Promise<HousingAssignmentRecord> {
  const validated =
    validateCreateInput(
      input,
    );

  const result =
    await reserveHousingAssignment(
      validated.applicationId,
      validated.bedId,
    );

  switch (result.kind) {
    case 'created':
      return result.assignment;

    case 'application_not_found':
      throw new HousingAssignmentNotFoundError(
        'Housing application was not found.',
      );

    case 'application_not_approved':
      throw new HousingAssignmentConflictError(
        'Only approved housing applications can receive a housing assignment.',
      );

    case 'bed_not_found':
      throw new HousingAssignmentNotFoundError(
        'Bed was not found.',
      );

    case 'bed_unavailable':
      throw new HousingAssignmentConflictError(
        'The selected bed is not active and available for assignment.',
      );

    case 'bed_conflict':
      throw new HousingAssignmentConflictError(
        'The selected bed is no longer available.',
      );
  }
}

export async function createRoommatePairAssignments(
  input: unknown,
): Promise<[
  HousingAssignmentRecord,
  HousingAssignmentRecord,
]> {
  const validated =
    validatePairInput(
      input,
    );

  const result =
    await reserveRoommatePairAssignments(
      validated.applicationId,
      validated.roommateApplicationId,
      validated.bedId,
      validated.roommateBedId,
    );

  switch (result.kind) {
    case 'created':
      return result.assignments;

    case 'application_not_found':
      throw new HousingAssignmentNotFoundError(
        'One or both housing applications were not found.',
      );

    case 'application_not_approved':
      throw new HousingAssignmentConflictError(
        'Both roommate housing applications must be approved before pair assignment.',
      );

    case 'academic_year_mismatch':
      throw new HousingAssignmentConflictError(
        'Roommate pair applications must use the same academic year.',
      );

    case 'roommate_request_not_accepted':
      throw new HousingAssignmentConflictError(
        'The selected students do not have an accepted roommate request for this academic year.',
      );

    case 'bed_not_found':
      throw new HousingAssignmentNotFoundError(
        'One or both selected beds were not found.',
      );

    case 'beds_not_same_room':
      throw new HousingAssignmentValidationError(
        'Roommate pair assignments must use two different beds in the same room.',
      );

    case 'bed_unavailable':
      throw new HousingAssignmentConflictError(
        'One or both selected beds are not active and available for assignment.',
      );

    case 'bed_conflict':
      throw new HousingAssignmentConflictError(
        'One or both selected beds are no longer available.',
      );
  }
}

export async function cancelHousingAssignment(
  assignmentId: string,
  officerId: string,
): Promise<HousingAssignmentRecord> {
  validateId(
    assignmentId,
    'Housing assignment id',
  );

  const result =
    await cancelReservedHousingAssignment(
      assignmentId,
      officerId,
    );

  switch (result.kind) {
    case 'cancelled':
      return result.assignment;

    case 'assignment_not_found':
      throw new HousingAssignmentNotFoundError(
        'Housing assignment was not found.',
      );

    case 'assignment_not_reserved':
      throw new HousingAssignmentConflictError(
        'Only reserved housing assignments can be cancelled through this workflow.',
      );

    case 'application_not_assigned':
      throw new HousingAssignmentConflictError(
        'The related housing application is no longer in the assigned state.',
      );

    case 'lease_sent_for_signature':
      throw new HousingAssignmentConflictError(
        'The lease has already been sent for signature and must be voided through the lease workflow before cancelling this assignment.',
      );

    case 'lease_signed':
      throw new HousingAssignmentConflictError(
        'A housing assignment with a signed lease cannot be cancelled through this workflow.',
      );
  }
}

export async function getStudentHousing(
  studentId: string,
): Promise<StudentHousingAssignment[]> {
  return findStudentHousingAssignments(
    studentId,
  );
}