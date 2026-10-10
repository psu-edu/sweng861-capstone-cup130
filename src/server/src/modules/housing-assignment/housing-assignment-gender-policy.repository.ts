import {
  pool,
} from '../../db/pool.js';

import type {
  HousingAssignmentOptions,
} from './housing-assignment.types.js';

type StudentGender =
  | 'MALE'
  | 'FEMALE'
  | 'UNSPECIFIED';

interface StudentGenderRow {
  gender: StudentGender;
}

interface RoomOccupantGenderRow {
  room_id: string;
  gender: StudentGender;
}

function isRoomGenderCompatible(
  studentGender: StudentGender,
  occupantGenders: StudentGender[],
): boolean {
  if (
    occupantGenders.length === 0
  ) {
    return true;
  }

  if (
    studentGender === 'UNSPECIFIED'
  ) {
    return false;
  }

  return occupantGenders.every(
    (occupantGender) =>
      occupantGender
      === studentGender,
  );
}

export async function applyHousingAssignmentGenderPolicy(
  applicationId: string,
  options: HousingAssignmentOptions,
): Promise<HousingAssignmentOptions> {
  const genderResult =
    await pool.query<StudentGenderRow>(
      `
        SELECT
          profile.gender
        FROM housing_applications application
        JOIN student_profiles profile
          ON profile.user_id =
            application.student_id
        WHERE application.id = $1
      `,
      [
        applicationId,
      ],
    );

  const studentGender =
    genderResult.rows[0]?.gender;

  if (
    studentGender === undefined
  ) {
    throw new Error(
      'Housing assignment gender policy could not resolve the student profile.',
    );
  }

  const occupantResult =
    await pool.query<RoomOccupantGenderRow>(
      `
        SELECT
          bed.room_id,
          profile.gender
        FROM housing_assignments assignment
        JOIN housing_applications application
          ON application.id =
            assignment.application_id
        JOIN student_profiles profile
          ON profile.user_id =
            application.student_id
        JOIN beds bed
          ON bed.id =
            assignment.bed_id
        WHERE assignment.status IN (
          'RESERVED',
          'CONFIRMED'
        )
          AND assignment.application_id
            <> $1
      `,
      [
        applicationId,
      ],
    );

  const roomOccupantGenders =
    new Map<
      string,
      StudentGender[]
    >();

  for (
    const occupant
    of occupantResult.rows
  ) {
    const existing =
      roomOccupantGenders.get(
        occupant.room_id,
      )
      ?? [];

    existing.push(
      occupant.gender,
    );

    roomOccupantGenders.set(
      occupant.room_id,
      existing,
    );
  }

  return {
    ...options,

    buildings:
      options.buildings.map(
        (building) => ({
          ...building,

          rooms:
            building.rooms.map(
              (room) => {
                const compatible =
                  isRoomGenderCompatible(
                    studentGender,
                    roomOccupantGenders.get(
                      room.id,
                    )
                    ?? [],
                  );

                if (
                  compatible
                ) {
                  return room;
                }

                return {
                  ...room,

                  availableBedCount:
                    0,

                  beds:
                    room.beds.map(
                      (bed) => ({
                        ...bed,
                        available:
                          false,
                      }),
                    ),
                };
              },
            ),
        }),
      ),
  };
}