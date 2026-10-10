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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  HousingInventoryApi,
  ROOM_STYLES,
  type InventoryBed,
  type InventoryBuilding,
  type InventoryRoom,
  type RoomStyle,
} from '../../core/services/housing-inventory-api';

type BuildingEditor =
  | {
      mode: 'create';
    }
  | {
      mode: 'edit';
      buildingId: string;
      active: boolean;
    };

type RoomEditor =
  | {
      mode: 'create';
      buildingId: string;
    }
  | {
      mode: 'edit';
      roomId: string;
      active: boolean;
    };

type BedEditor =
  | {
      mode: 'create';
      roomId: string;
    }
  | {
      mode: 'edit';
      bedId: string;
      active: boolean;
    };

@Component({
  selector: 'app-housing-inventory',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './housing-inventory.html',
  styleUrl: './housing-inventory.css',
})
export class HousingInventoryPage
implements OnInit {
  private readonly inventoryApi =
    inject(HousingInventoryApi);

  protected readonly roomStyles =
    ROOM_STYLES;

  protected readonly buildings =
    signal<InventoryBuilding[]>([]);

  protected readonly loading =
    signal(true);

  protected readonly saving =
    signal(false);

  protected readonly loadError =
    signal<string | null>(null);

  protected readonly error =
    signal<string | null>(null);

  protected readonly message =
    signal<string | null>(null);

  protected readonly buildingEditor =
    signal<BuildingEditor | null>(null);

  protected readonly roomEditor =
    signal<RoomEditor | null>(null);

  protected readonly bedEditor =
    signal<BedEditor | null>(null);

  protected readonly buildingForm =
    new FormGroup({
      name:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(150),
            ],
          },
        ),

      address:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(255),
            ],
          },
        ),

      description:
        new FormControl(
          '',
          {
            nonNullable: true,
          },
        ),
    });

  protected readonly roomForm =
    new FormGroup({
      roomNumber:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(20),
            ],
          },
        ),

      floor:
        new FormControl<number | null>(
          null,
        ),

      roomStyle:
        new FormControl<RoomStyle>(
          'DOUBLE',
          {
            nonNullable: true,
            validators: [
              Validators.required,
            ],
          },
        ),
    });

  protected readonly bedForm =
    new FormGroup({
      bedLabel:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(20),
            ],
          },
        ),
    });

  ngOnInit(): void {
    this.loadInventory();
  }

  protected startAddBuilding(): void {
    this.clearEditors();

    this.buildingForm.reset({
      name: '',
      address: '',
      description: '',
    });

    this.buildingEditor.set({
      mode: 'create',
    });

    this.clearMessages();
  }

  protected startEditBuilding(
    building: InventoryBuilding,
  ): void {
    this.clearEditors();

    this.buildingForm.reset({
      name: building.name,
      address: building.address,
      description:
        building.description ?? '',
    });

    this.buildingEditor.set({
      mode: 'edit',
      buildingId: building.id,
      active: building.active,
    });

    this.clearMessages();
  }

  protected startAddRoom(
    buildingId: string,
  ): void {
    this.clearEditors();

    this.roomForm.reset({
      roomNumber: '',
      floor: null,
      roomStyle: 'DOUBLE',
    });

    this.roomEditor.set({
      mode: 'create',
      buildingId,
    });

    this.clearMessages();
  }

  protected startEditRoom(
    room: InventoryRoom,
  ): void {
    this.clearEditors();

    this.roomForm.reset({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomStyle: room.roomStyle,
    });

    this.roomEditor.set({
      mode: 'edit',
      roomId: room.id,
      active: room.active,
    });

    this.clearMessages();
  }

  protected startAddBed(
    room: InventoryRoom,
  ): void {
    const expectedBedCount: Record<RoomStyle, number> = {
      SINGLE: 1,
      DOUBLE: 2,
      TRIPLE: 3,
      QUAD: 4,
    };
  
    const expected =
      expectedBedCount[room.roomStyle];
  
    if (
      room.beds.length >= expected
      && !window.confirm(
        `Room ${room.roomNumber} is designated as ${room.roomStyle} and already has ${room.beds.length} bed${room.beds.length === 1 ? '' : 's'}. Do you still want to add another bed?`,
      )
    ) {
      return;
    }
  
    this.clearEditors();
  
    this.bedForm.reset({
      bedLabel: '',
    });
  
    this.bedEditor.set({
      mode: 'create',
      roomId: room.id,
    });
  
    this.clearMessages();
  }

  protected startEditBed(
    bed: InventoryBed,
  ): void {
    this.clearEditors();

    this.bedForm.reset({
      bedLabel: bed.bedLabel,
    });

    this.bedEditor.set({
      mode: 'edit',
      bedId: bed.id,
      active: bed.active,
    });

    this.clearMessages();
  }

  protected cancelEdit(): void {
    this.clearEditors();
    this.error.set(null);
  }

  protected saveBuilding(): void {
    const editor =
      this.buildingEditor();

    if (editor === null) {
      return;
    }

    if (this.buildingForm.invalid) {
      this.buildingForm.markAllAsTouched();

      this.error.set(
        'Please correct the building fields.',
      );

      return;
    }

    const value =
      this.buildingForm.getRawValue();

    const description =
      value.description.trim();

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const request =
      editor.mode === 'create'
        ? this.inventoryApi.createBuilding({
            name: value.name,
            address: value.address,
            description:
              description === ''
                ? null
                : description,
          })
        : this.inventoryApi.updateBuilding(
            editor.buildingId,
            {
              name: value.name,
              address: value.address,
              description:
                description === ''
                  ? null
                  : description,
              active: editor.active,
            },
          );

    request.subscribe({
      next: () => {
        this.finishMutation(
          editor.mode === 'create'
            ? 'Building added successfully.'
            : 'Building updated successfully.',
        );
      },

      error: (error: HttpErrorResponse) => {
        this.handleMutationError(
          error,
          'Unable to save the building.',
        );
      },
    });
  }

  protected saveRoom(): void {
    const editor =
      this.roomEditor();

    if (editor === null) {
      return;
    }

    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();

      this.error.set(
        'Please correct the room fields.',
      );

      return;
    }

    const value =
      this.roomForm.getRawValue();

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const request =
      editor.mode === 'create'
        ? this.inventoryApi.createRoom(
            editor.buildingId,
            {
              roomNumber:
                value.roomNumber,
              floor: value.floor,
              roomStyle:
                value.roomStyle,
            },
          )
        : this.inventoryApi.updateRoom(
            editor.roomId,
            {
              roomNumber:
                value.roomNumber,
              floor: value.floor,
              roomStyle:
                value.roomStyle,
              active: editor.active,
            },
          );

    request.subscribe({
      next: () => {
        this.finishMutation(
          editor.mode === 'create'
            ? 'Room added successfully.'
            : 'Room updated successfully.',
        );
      },

      error: (error: HttpErrorResponse) => {
        this.handleMutationError(
          error,
          'Unable to save the room.',
        );
      },
    });
  }

  protected saveBed(): void {
    const editor =
      this.bedEditor();

    if (editor === null) {
      return;
    }

    if (this.bedForm.invalid) {
      this.bedForm.markAllAsTouched();

      this.error.set(
        'Please correct the bed fields.',
      );

      return;
    }

    const value =
      this.bedForm.getRawValue();

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const request =
      editor.mode === 'create'
        ? this.inventoryApi.createBed(
            editor.roomId,
            {
              bedLabel: value.bedLabel,
            },
          )
        : this.inventoryApi.updateBed(
            editor.bedId,
            {
              bedLabel: value.bedLabel,
              active: editor.active,
            },
          );

    request.subscribe({
      next: () => {
        this.finishMutation(
          editor.mode === 'create'
            ? 'Bed added successfully.'
            : 'Bed updated successfully.',
        );
      },

      error: (error: HttpErrorResponse) => {
        this.handleMutationError(
          error,
          'Unable to save the bed.',
        );
      },
    });
  }

  protected toggleBuildingActive(
    building: InventoryBuilding,
  ): void {
    if (
      building.active
      && !window.confirm(
        `Deactivate ${building.name}? Its rooms and beds will no longer be available for assignment.`,
      )
    ) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    this.inventoryApi
      .updateBuilding(
        building.id,
        {
          name: building.name,
          address: building.address,
          description:
            building.description,
          active: !building.active,
        },
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            building.active
              ? 'Building deactivated successfully.'
              : 'Building activated successfully.',
          );
        },

        error: (error: HttpErrorResponse) => {
          this.handleMutationError(
            error,
            'Unable to update the building.',
          );
        },
      });
  }

  protected toggleRoomActive(
    room: InventoryRoom,
  ): void {
    if (
      room.active
      && !window.confirm(
        `Deactivate room ${room.roomNumber}? Its beds will no longer be available for assignment.`,
      )
    ) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    this.inventoryApi
      .updateRoom(
        room.id,
        {
          roomNumber:
            room.roomNumber,
          floor: room.floor,
          roomStyle:
            room.roomStyle,
          active: !room.active,
        },
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            room.active
              ? 'Room deactivated successfully.'
              : 'Room activated successfully.',
          );
        },

        error: (error: HttpErrorResponse) => {
          this.handleMutationError(
            error,
            'Unable to update the room.',
          );
        },
      });
  }

  protected toggleBedActive(
    bed: InventoryBed,
  ): void {
    if (
      bed.active
      && !window.confirm(
        `Deactivate bed ${bed.bedLabel}? It will no longer be available for assignment.`,
      )
    ) {
      return;
    }

    this.saving.set(true);
    this.clearMessages();

    this.inventoryApi
      .updateBed(
        bed.id,
        {
          bedLabel: bed.bedLabel,
          active: !bed.active,
        },
      )
      .subscribe({
        next: () => {
          this.finishMutation(
            bed.active
              ? 'Bed deactivated successfully.'
              : 'Bed activated successfully.',
          );
        },

        error: (error: HttpErrorResponse) => {
          this.handleMutationError(
            error,
            'Unable to update the bed.',
          );
        },
      });
  }

  private loadInventory(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.inventoryApi
      .getInventory()
      .subscribe({
        next: (response) => {
          this.buildings.set(
            response.buildings,
          );

          this.loading.set(false);
        },

        error: (error: HttpErrorResponse) => {
          this.loading.set(false);

          this.loadError.set(
            this.getErrorMessage(
              error,
              'Unable to load housing inventory.',
            ),
          );
        },
      });
  }

  private finishMutation(
    message: string,
  ): void {
    this.saving.set(false);
    this.clearEditors();
    this.message.set(message);
    this.loadInventory();
  }

  private handleMutationError(
    error: HttpErrorResponse,
    fallback: string,
  ): void {
    this.saving.set(false);

    this.error.set(
      this.getErrorMessage(
        error,
        fallback,
      ),
    );
  }

  private clearEditors(): void {
    this.buildingEditor.set(null);
    this.roomEditor.set(null);
    this.bedEditor.set(null);
  }

  private clearMessages(): void {
    this.error.set(null);
    this.message.set(null);
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string,
  ): string {
    const apiMessage =
      error.error?.message;

    if (
      typeof apiMessage === 'string'
      && apiMessage.trim() !== ''
    ) {
      return apiMessage;
    }

    return fallback;
  }
}