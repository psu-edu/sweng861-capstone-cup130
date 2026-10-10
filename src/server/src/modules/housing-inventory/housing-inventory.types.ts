export const ROOM_STYLES = [
  'SINGLE',
  'DOUBLE',
  'TRIPLE',
  'QUAD',
] as const;

export type RoomStyle =
  typeof ROOM_STYLES[number];

export interface InventoryBed {
  id: string;
  bedLabel: string;
  active: boolean;
  available: boolean;
}

export interface InventoryRoom {
  id: string;
  buildingId: string;
  roomNumber: string;
  floor: number | null;
  roomStyle: RoomStyle;
  active: boolean;
  beds: InventoryBed[];
}

export interface InventoryBuilding {
  id: string;
  name: string;
  address: string;
  description: string | null;
  active: boolean;
  rooms: InventoryRoom[];
}

export interface HousingOptionRoomStyle {
  roomStyle: RoomStyle;
  totalBeds: number;
  availableBeds: number;
}

export interface HousingOptionBuilding {
  id: string;
  name: string;
  address: string;
  description: string | null;
  totalBeds: number;
  availableBeds: number;
  roomStyles: HousingOptionRoomStyle[];
}

export interface CreateBuildingInput {
  name: string;
  address: string;
  description: string | null;
}

export interface UpdateBuildingInput {
  name: string;
  address: string;
  description: string | null;
  active: boolean;
}

export interface CreateRoomInput {
  roomNumber: string;
  floor: number | null;
  roomStyle: RoomStyle;
}

export interface UpdateRoomInput {
  roomNumber: string;
  floor: number | null;
  roomStyle: RoomStyle;
  active: boolean;
}

export interface CreateBedInput {
  bedLabel: string;
}

export interface UpdateBedInput {
  bedLabel: string;
  active: boolean;
}