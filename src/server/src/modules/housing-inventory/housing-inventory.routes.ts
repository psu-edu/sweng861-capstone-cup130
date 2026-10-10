import {
  Router,
} from 'express';

import {
  requireRole,
  resolveLocalUser,
  validateAccessToken,
} from '../../auth/auth.middleware.js';

import {
  createBed,
  createBuilding,
  createRoom,
  getHousingInventory,
  getHousingOptions,
  updateBed,
  updateBuilding,
  updateRoom,
} from './housing-inventory.controller.js';

export const housingInventoryRouter =
  Router();

housingInventoryRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('HOUSING_OFFICER'),
);

housingInventoryRouter.get(
  '/',
  getHousingInventory,
);

export const housingOptionsRouter =
  Router();

housingOptionsRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('STUDENT'),
);

housingOptionsRouter.get(
  '/',
  getHousingOptions,
);

housingInventoryRouter.post(
  '/buildings',
  createBuilding,
);

housingInventoryRouter.put(
  '/buildings/:buildingId',
  updateBuilding,
);

housingInventoryRouter.post(
  '/buildings/:buildingId/rooms',
  createRoom,
);

housingInventoryRouter.put(
  '/rooms/:roomId',
  updateRoom,
);

housingInventoryRouter.post(
  '/rooms/:roomId/beds',
  createBed,
);

housingInventoryRouter.put(
  '/beds/:bedId',
  updateBed,
);