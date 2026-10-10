import {
  HttpClient,
} from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

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

export interface CreateBuildingInput {
  name: string;
  address: string;
  description: string | null;
}

export interface UpdateBuildingInput
extends CreateBuildingInput {
  active: boolean;
}

export interface CreateRoomInput {
  roomNumber: string;
  floor: number | null;
  roomStyle: RoomStyle;
}

export interface UpdateRoomInput
extends CreateRoomInput {
  active: boolean;
}

export interface CreateBedInput {
  bedLabel: string;
}

export interface UpdateBedInput
extends CreateBedInput {
  active: boolean;
}

interface InventoryResponse {
  buildings: InventoryBuilding[];
}

interface BuildingResponse {
  building: InventoryBuilding;
}

interface RoomResponse {
  room: InventoryRoom;
}

interface BedResponse {
  bed: InventoryBed;
}

@Injectable({
  providedIn: 'root',
})
export class HousingInventoryApi {
  private readonly http =
    inject(HttpClient);

  getInventory() {
    return this.http.get<InventoryResponse>(
      '/api/inventory',
    );
  }

  createBuilding(
    input: CreateBuildingInput,
  ) {
    return this.http.post<BuildingResponse>(
      '/api/inventory/buildings',
      input,
    );
  }

  updateBuilding(
    buildingId: string,
    input: UpdateBuildingInput,
  ) {
    return this.http.put<BuildingResponse>(
      `/api/inventory/buildings/${buildingId}`,
      input,
    );
  }

  createRoom(
    buildingId: string,
    input: CreateRoomInput,
  ) {
    return this.http.post<RoomResponse>(
      `/api/inventory/buildings/${buildingId}/rooms`,
      input,
    );
  }

  updateRoom(
    roomId: string,
    input: UpdateRoomInput,
  ) {
    return this.http.put<RoomResponse>(
      `/api/inventory/rooms/${roomId}`,
      input,
    );
  }

  createBed(
    roomId: string,
    input: CreateBedInput,
  ) {
    return this.http.post<BedResponse>(
      `/api/inventory/rooms/${roomId}/beds`,
      input,
    );
  }

  updateBed(
    bedId: string,
    input: UpdateBedInput,
  ) {
    return this.http.put<BedResponse>(
      `/api/inventory/beds/${bedId}`,
      input,
    );
  }
}