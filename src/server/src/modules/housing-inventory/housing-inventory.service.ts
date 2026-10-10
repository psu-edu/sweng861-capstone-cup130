import {
  createBed,
  createBuilding,
  createRoom,
  findInventoryHierarchy,
  findStudentHousingOptions,
  updateBed,
  updateBuilding,
  updateRoom,
} from './housing-inventory.repository.js';

import {
  ROOM_STYLES,
  type CreateBedInput,
  type CreateBuildingInput,
  type CreateRoomInput,
  type HousingOptionBuilding,
  type InventoryBed,
  type InventoryBuilding,
  type InventoryRoom,
  type RoomStyle,
  type UpdateBedInput,
  type UpdateBuildingInput,
  type UpdateRoomInput,
} from './housing-inventory.types.js';

export class InventoryValidationError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'InventoryValidationError';
  }
}

export class InventoryConflictError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'InventoryConflictError';
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
  const value =
    input[field];

  if (
    typeof value !== 'string'
    || value.trim() === ''
  ) {
    throw new InventoryValidationError(
      `${label} is required.`,
    );
  }

  const trimmed =
    value.trim();

  if (
    trimmed.length > maxLength
  ) {
    throw new InventoryValidationError(
      `${label} must be ${maxLength} characters or fewer.`,
    );
  }

  return trimmed;
}

function getOptionalString(
  input: Record<string, unknown>,
  field: string,
): string | null {
  const value =
    input[field];

  if (
    value === undefined
    || value === null
    || value === ''
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new InventoryValidationError(
      `${field} must be text or null.`,
    );
  }

  return value.trim();
}

function getBoolean(
  input: Record<string, unknown>,
  field: string,
  label: string,
): boolean {
  const value =
    input[field];

  if (typeof value !== 'boolean') {
    throw new InventoryValidationError(
      `${label} must be true or false.`,
    );
  }

  return value;
}

function getNullableInteger(
  input: Record<string, unknown>,
  field: string,
  label: string,
): number | null {
  const value =
    input[field];

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
    throw new InventoryValidationError(
      `${label} must be an integer or null.`,
    );
  }

  return value;
}

function getRoomStyle(
  input: Record<string, unknown>,
): RoomStyle {
  const value =
    input.roomStyle;

  if (
    typeof value !== 'string'
    || !ROOM_STYLES.includes(
      value as RoomStyle,
    )
  ) {
    throw new InventoryValidationError(
      'Room style must be SINGLE, DOUBLE, TRIPLE, or QUAD.',
    );
  }

  return value as RoomStyle;
}

function validateBuildingCreate(
  input: unknown,
): CreateBuildingInput {
  if (!isRecord(input)) {
    throw new InventoryValidationError(
      'Building data is required.',
    );
  }

  return {
    name:
      getRequiredString(
        input,
        'name',
        'Building name',
        150,
      ),
    address:
      getRequiredString(
        input,
        'address',
        'Address',
        255,
      ),
    description:
      getOptionalString(
        input,
        'description',
      ),
  };
}

function validateBuildingUpdate(
  input: unknown,
): UpdateBuildingInput {
  if (!isRecord(input)) {
    throw new InventoryValidationError(
      'Building data is required.',
    );
  }

  return {
    ...validateBuildingCreate(input),
    active:
      getBoolean(
        input,
        'active',
        'Active',
      ),
  };
}

function validateRoomCreate(
  input: unknown,
): CreateRoomInput {
  if (!isRecord(input)) {
    throw new InventoryValidationError(
      'Room data is required.',
    );
  }

  return {
    roomNumber:
      getRequiredString(
        input,
        'roomNumber',
        'Room number',
        20,
      ),
    floor:
      getNullableInteger(
        input,
        'floor',
        'Floor',
      ),
    roomStyle:
      getRoomStyle(input),
  };
}

function validateRoomUpdate(
  input: unknown,
): UpdateRoomInput {
  if (!isRecord(input)) {
    throw new InventoryValidationError(
      'Room data is required.',
    );
  }

  return {
    ...validateRoomCreate(input),
    active:
      getBoolean(
        input,
        'active',
        'Active',
      ),
  };
}

function validateBedCreate(
  input: unknown,
): CreateBedInput {
  if (!isRecord(input)) {
    throw new InventoryValidationError(
      'Bed data is required.',
    );
  }

  return {
    bedLabel:
      getRequiredString(
        input,
        'bedLabel',
        'Bed label',
        20,
      ),
  };
}

function validateBedUpdate(
  input: unknown,
): UpdateBedInput {
  if (!isRecord(input)) {
    throw new InventoryValidationError(
      'Bed data is required.',
    );
  }

  return {
    ...validateBedCreate(input),
    active:
      getBoolean(
        input,
        'active',
        'Active',
      ),
  };
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

export async function getInventoryHierarchy():
Promise<InventoryBuilding[]> {
  return findInventoryHierarchy();
}

export async function getStudentHousingOptions():
Promise<HousingOptionBuilding[]> {
  return findStudentHousingOptions();
}

export async function addBuilding(
  input: unknown,
): Promise<InventoryBuilding> {
  const validated =
    validateBuildingCreate(input);

  try {
    return await createBuilding(
      validated,
    );
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new InventoryConflictError(
        'A building with that name already exists.',
      );
    }

    throw error;
  }
}

export async function editBuilding(
  buildingId: string,
  input: unknown,
): Promise<InventoryBuilding | null> {
  const validated =
    validateBuildingUpdate(input);

  try {
    return await updateBuilding(
      buildingId,
      validated,
    );
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new InventoryConflictError(
        'A building with that name already exists.',
      );
    }

    throw error;
  }
}

export async function addRoom(
  buildingId: string,
  input: unknown,
): Promise<InventoryRoom> {
  const validated =
    validateRoomCreate(input);

  try {
    return await createRoom(
      buildingId,
      validated,
    );
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23503',
      )
    ) {
      throw new InventoryValidationError(
        'The selected building does not exist.',
      );
    }

    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new InventoryConflictError(
        'That room number already exists in this building.',
      );
    }

    throw error;
  }
}

export async function editRoom(
  roomId: string,
  input: unknown,
): Promise<InventoryRoom | null> {
  const validated =
    validateRoomUpdate(input);

  try {
    return await updateRoom(
      roomId,
      validated,
    );
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new InventoryConflictError(
        'That room number already exists in this building.',
      );
    }

    throw error;
  }
}

export async function addBed(
  roomId: string,
  input: unknown,
): Promise<InventoryBed> {
  const validated =
    validateBedCreate(input);

  try {
    return await createBed(
      roomId,
      validated,
    );
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23503',
      )
    ) {
      throw new InventoryValidationError(
        'The selected room does not exist.',
      );
    }

    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new InventoryConflictError(
        'That bed label already exists in this room.',
      );
    }

    throw error;
  }
}

export async function editBed(
  bedId: string,
  input: unknown,
): Promise<InventoryBed | null> {
  const validated =
    validateBedUpdate(input);

  try {
    return await updateBed(
      bedId,
      validated,
    );
  } catch (error: unknown) {
    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      throw new InventoryConflictError(
        'That bed label already exists in this room.',
      );
    }

    throw error;
  }
}