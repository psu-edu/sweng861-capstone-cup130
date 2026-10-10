import {
  HttpClient,
} from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

export type RoomStyle =
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'QUAD';

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

interface HousingOptionsResponse {
  buildings: HousingOptionBuilding[];
}

@Injectable({
  providedIn: 'root',
})
export class HousingOptionsApi {
  private readonly http =
    inject(HttpClient);

  getHousingOptions() {
    return this.http.get<HousingOptionsResponse>(
      '/api/student/housing-options',
    );
  }
}