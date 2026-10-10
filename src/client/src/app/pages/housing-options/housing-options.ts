import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  HousingOptionsApi,
  type HousingOptionBuilding,
  type HousingOptionRoomStyle,
  type RoomStyle,
} from '../../core/services/housing-options-api';

const ROOM_STYLE_ORDER:
Record<RoomStyle, number> = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  QUAD: 4,
};

@Component({
  selector: 'app-housing-options',
  imports: [],
  templateUrl: './housing-options.html',
  styleUrl: './housing-options.css',
})
export class HousingOptionsPage
implements OnInit {
  private readonly housingOptionsApi =
    inject(HousingOptionsApi);

  protected readonly buildings =
    signal<HousingOptionBuilding[]>([]);

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  ngOnInit(): void {
    this.loadHousingOptions();
  }

  protected roomStyleLabel(
    roomStyle: RoomStyle,
  ): string {
    switch (roomStyle) {
      case 'SINGLE':
        return 'Single';

      case 'DOUBLE':
        return 'Double';

      case 'TRIPLE':
        return 'Triple';

      case 'QUAD':
        return 'Quad';
    }
  }

  protected availabilityLabel(
    availableBeds: number,
  ): string {
    if (availableBeds === 0) {
      return 'No spaces available';
    }

    if (availableBeds === 1) {
      return '1 space available';
    }

    return `${availableBeds} spaces available`;
  }

  private loadHousingOptions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.housingOptionsApi
      .getHousingOptions()
      .subscribe({
        next: (response) => {
          const buildings =
            response.buildings.map(
              (building) => ({
                ...building,
                roomStyles:
                  this.sortRoomStyles(
                    building.roomStyles,
                  ),
              }),
            );

          this.buildings.set(buildings);
          this.loading.set(false);
        },

        error: (error: HttpErrorResponse) => {
          this.loading.set(false);

          this.error.set(
            this.getErrorMessage(error),
          );
        },
      });
  }

  private sortRoomStyles(
    roomStyles: HousingOptionRoomStyle[],
  ): HousingOptionRoomStyle[] {
    return [
      ...roomStyles,
    ].sort(
      (left, right) =>
        ROOM_STYLE_ORDER[
          left.roomStyle
        ]
        - ROOM_STYLE_ORDER[
          right.roomStyle
        ],
    );
  }

  private getErrorMessage(
    error: HttpErrorResponse,
  ): string {
    const apiMessage =
      error.error?.message;

    if (
      typeof apiMessage === 'string'
      && apiMessage.trim() !== ''
    ) {
      return apiMessage;
    }

    return 'Unable to load housing options.';
  }
}