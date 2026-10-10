import type {
  Request,
  Response,
} from 'express';

import {
  addBed,
  addBuilding,
  addRoom,
  editBed,
  editBuilding,
  editRoom,
  getInventoryHierarchy,
  getStudentHousingOptions,
  InventoryConflictError,
  InventoryValidationError,
} from './housing-inventory.service.js';

interface BuildingParams {
  buildingId: string;
}

interface RoomParams {
  roomId: string;
}

interface BedParams {
  bedId: string;
}

export async function getHousingInventory(
  _req: Request,
  res: Response,
): Promise<void> {
  const buildings =
    await getInventoryHierarchy();

  res.status(200).json({
    buildings,
  });
}

export async function getHousingOptions(
  _req: Request,
  res: Response,
): Promise<void> {
  const buildings =
    await getStudentHousingOptions();

  res.status(200).json({
    buildings,
  });
}

function handleInventoryError(
  error: unknown,
  res: Response,
): boolean {
  if (
    error
    instanceof InventoryValidationError
  ) {
    res.status(400).json({
      error: 'validation_error',
      message: error.message,
    });

    return true;
  }

  if (
    error
    instanceof InventoryConflictError
  ) {
    res.status(409).json({
      error: 'conflict',
      message: error.message,
    });

    return true;
  }

  return false;
}

export async function createBuilding(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const building =
      await addBuilding(
        req.body as unknown,
      );

    res.status(201).json({
      building,
    });
  } catch (error: unknown) {
    if (
      handleInventoryError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function updateBuilding(
  req: Request<BuildingParams>,
  res: Response,
): Promise<void> {
  try {
    const building =
      await editBuilding(
        req.params.buildingId,
        req.body as unknown,
      );

    if (building === null) {
      res.status(404).json({
        error: 'not_found',
        message:
          'Building was not found.',
      });

      return;
    }

    res.status(200).json({
      building,
    });
  } catch (error: unknown) {
    if (
      handleInventoryError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function createRoom(
  req: Request<BuildingParams>,
  res: Response,
): Promise<void> {
  try {
    const room =
      await addRoom(
        req.params.buildingId,
        req.body as unknown,
      );

    res.status(201).json({
      room,
    });
  } catch (error: unknown) {
    if (
      handleInventoryError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function updateRoom(
  req: Request<RoomParams>,
  res: Response,
): Promise<void> {
  try {
    const room =
      await editRoom(
        req.params.roomId,
        req.body as unknown,
      );

    if (room === null) {
      res.status(404).json({
        error: 'not_found',
        message:
          'Room was not found.',
      });

      return;
    }

    res.status(200).json({
      room,
    });
  } catch (error: unknown) {
    if (
      handleInventoryError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function createBed(
  req: Request<RoomParams>,
  res: Response,
): Promise<void> {
  try {
    const bed =
      await addBed(
        req.params.roomId,
        req.body as unknown,
      );

    res.status(201).json({
      bed,
    });
  } catch (error: unknown) {
    if (
      handleInventoryError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function updateBed(
  req: Request<BedParams>,
  res: Response,
): Promise<void> {
  try {
    const bed =
      await editBed(
        req.params.bedId,
        req.body as unknown,
      );

    if (bed === null) {
      res.status(404).json({
        error: 'not_found',
        message:
          'Bed was not found.',
      });

      return;
    }

    res.status(200).json({
      bed,
    });
  } catch (error: unknown) {
    if (
      handleInventoryError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}