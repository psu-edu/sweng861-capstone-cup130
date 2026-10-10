import {
  pool,
} from '../../db/pool.js';

import type {
  CreateBedInput,
  CreateBuildingInput,
  CreateRoomInput,
  HousingOptionBuilding,
  InventoryBed,
  InventoryBuilding,
  InventoryRoom,
  RoomStyle,
  UpdateBedInput,
  UpdateBuildingInput,
  UpdateRoomInput,
} from './housing-inventory.types.js';

interface BuildingRow {
  id: string;
  name: string;
  address: string;
  description: string | null;
  active: boolean;
}

interface RoomRow {
  id: string;
  building_id: string;
  room_number: string;
  floor: number | null;
  room_style: RoomStyle;
  active: boolean;
}

interface BedRow {
  id: string;
  room_id: string;
  bed_label: string;
  active: boolean;
  available: boolean;
}

interface HousingOptionRow {
  building_id: string;
  building_name: string;
  address: string;
  description: string | null;
  room_style: RoomStyle | null;
  total_beds: number;
  available_beds: number;
}

export async function findInventoryHierarchy():
Promise<InventoryBuilding[]> {
  const [
    buildingsResult,
    roomsResult,
    bedsResult,
  ] = await Promise.all([
    pool.query<BuildingRow>(
      `
        SELECT
          id,
          name,
          address,
          description,
          active
        FROM buildings
        ORDER BY name
      `,
    ),

    pool.query<RoomRow>(
      `
        SELECT
          id,
          building_id,
          room_number,
          floor,
          room_style,
          active
        FROM rooms
        ORDER BY
          building_id,
          room_number
      `,
    ),

    pool.query<BedRow>(
      `
        SELECT
          bed.id,
          bed.room_id,
          bed.bed_label,
          bed.active,
          (
            building.active
            AND room.active
            AND bed.active
            AND NOT EXISTS (
              SELECT 1
              FROM housing_assignments assignment
              WHERE assignment.bed_id = bed.id
                AND assignment.status IN (
                  'RESERVED',
                  'CONFIRMED'
                )
            )
          ) AS available
        FROM beds bed
        JOIN rooms room
          ON room.id = bed.room_id
        JOIN buildings building
          ON building.id = room.building_id
        ORDER BY
          bed.room_id,
          bed.bed_label
      `,
    ),
  ]);

  const buildings =
    buildingsResult.rows.map(
      (row): InventoryBuilding => ({
        id: row.id,
        name: row.name,
        address: row.address,
        description: row.description,
        active: row.active,
        rooms: [],
      }),
    );

  const buildingMap =
    new Map(
      buildings.map(
        (building) => [
          building.id,
          building,
        ],
      ),
    );

  const roomMap =
    new Map<string, InventoryRoom>();

  for (const row of roomsResult.rows) {
    const room: InventoryRoom = {
      id: row.id,
      buildingId: row.building_id,
      roomNumber: row.room_number,
      floor: row.floor,
      roomStyle: row.room_style,
      active: row.active,
      beds: [],
    };

    roomMap.set(
      room.id,
      room,
    );

    buildingMap
      .get(row.building_id)
      ?.rooms.push(room);
  }

  for (const row of bedsResult.rows) {
    roomMap
      .get(row.room_id)
      ?.beds.push({
        id: row.id,
        bedLabel: row.bed_label,
        active: row.active,
        available: row.available,
      });
  }

  return buildings;
}

export async function findStudentHousingOptions():
Promise<HousingOptionBuilding[]> {
  const result =
    await pool.query<HousingOptionRow>(
      `
        SELECT
          building.id AS building_id,
          building.name AS building_name,
          building.address,
          building.description,
          room.room_style,
          COUNT(bed.id)::INTEGER
            AS total_beds,
          COUNT(bed.id) FILTER (
            WHERE NOT EXISTS (
              SELECT 1
              FROM housing_assignments assignment
              WHERE assignment.bed_id = bed.id
                AND assignment.status IN (
                  'RESERVED',
                  'CONFIRMED'
                )
            )
          )::INTEGER AS available_beds
        FROM buildings building
        LEFT JOIN rooms room
          ON room.building_id = building.id
          AND room.active = TRUE
        LEFT JOIN beds bed
          ON bed.room_id = room.id
          AND bed.active = TRUE
        WHERE building.active = TRUE
        GROUP BY
          building.id,
          building.name,
          building.address,
          building.description,
          room.room_style
        ORDER BY
          building.name,
          room.room_style
      `,
    );

  const buildings =
    new Map<string, HousingOptionBuilding>();

  for (const row of result.rows) {
    let building =
      buildings.get(
        row.building_id,
      );

    if (building === undefined) {
      building = {
        id: row.building_id,
        name: row.building_name,
        address: row.address,
        description: row.description,
        totalBeds: 0,
        availableBeds: 0,
        roomStyles: [],
      };

      buildings.set(
        row.building_id,
        building,
      );
    }

    if (row.room_style === null) {
      continue;
    }

    building.roomStyles.push({
      roomStyle: row.room_style,
      totalBeds: row.total_beds,
      availableBeds:
        row.available_beds,
    });

    building.totalBeds +=
      row.total_beds;

    building.availableBeds +=
      row.available_beds;
  }

  return [
    ...buildings.values(),
  ];
}

export async function createBuilding(
  input: CreateBuildingInput,
): Promise<InventoryBuilding> {
  const result =
    await pool.query<BuildingRow>(
      `
        INSERT INTO buildings (
          name,
          address,
          description
        )
        VALUES (
          $1,
          $2,
          $3
        )
        RETURNING
          id,
          name,
          address,
          description,
          active
      `,
      [
        input.name,
        input.address,
        input.description,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    throw new Error(
      'Building insert did not return a row.',
    );
  }

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    description: row.description,
    active: row.active,
    rooms: [],
  };
}

export async function updateBuilding(
  buildingId: string,
  input: UpdateBuildingInput,
): Promise<InventoryBuilding | null> {
  const result =
    await pool.query<BuildingRow>(
      `
        UPDATE buildings
        SET
          name = $2,
          address = $3,
          description = $4,
          active = $5,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          name,
          address,
          description,
          active
      `,
      [
        buildingId,
        input.name,
        input.address,
        input.description,
        input.active,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    description: row.description,
    active: row.active,
    rooms: [],
  };
}

export async function createRoom(
  buildingId: string,
  input: CreateRoomInput,
): Promise<InventoryRoom> {
  const result =
    await pool.query<RoomRow>(
      `
        INSERT INTO rooms (
          building_id,
          room_number,
          floor,
          room_style
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING
          id,
          building_id,
          room_number,
          floor,
          room_style,
          active
      `,
      [
        buildingId,
        input.roomNumber,
        input.floor,
        input.roomStyle,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    throw new Error(
      'Room insert did not return a row.',
    );
  }

  return {
    id: row.id,
    buildingId: row.building_id,
    roomNumber: row.room_number,
    floor: row.floor,
    roomStyle: row.room_style,
    active: row.active,
    beds: [],
  };
}

export async function updateRoom(
  roomId: string,
  input: UpdateRoomInput,
): Promise<InventoryRoom | null> {
  const result =
    await pool.query<RoomRow>(
      `
        UPDATE rooms
        SET
          room_number = $2,
          floor = $3,
          room_style = $4,
          active = $5,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          building_id,
          room_number,
          floor,
          room_style,
          active
      `,
      [
        roomId,
        input.roomNumber,
        input.floor,
        input.roomStyle,
        input.active,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return {
    id: row.id,
    buildingId: row.building_id,
    roomNumber: row.room_number,
    floor: row.floor,
    roomStyle: row.room_style,
    active: row.active,
    beds: [],
  };
}

export async function createBed(
  roomId: string,
  input: CreateBedInput,
): Promise<InventoryBed> {
  const result =
    await pool.query<{
      id: string;
      bed_label: string;
      active: boolean;
    }>(
      `
        INSERT INTO beds (
          room_id,
          bed_label
        )
        VALUES (
          $1,
          $2
        )
        RETURNING
          id,
          bed_label,
          active
      `,
      [
        roomId,
        input.bedLabel,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    throw new Error(
      'Bed insert did not return a row.',
    );
  }

  return {
    id: row.id,
    bedLabel: row.bed_label,
    active: row.active,
    available: row.active,
  };
}

export async function updateBed(
  bedId: string,
  input: UpdateBedInput,
): Promise<InventoryBed | null> {
  const result =
    await pool.query<{
      id: string;
      bed_label: string;
      active: boolean;
    }>(
      `
        UPDATE beds
        SET
          bed_label = $2,
          active = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          bed_label,
          active
      `,
      [
        bedId,
        input.bedLabel,
        input.active,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return {
    id: row.id,
    bedLabel: row.bed_label,
    active: row.active,
    available: row.active,
  };
}