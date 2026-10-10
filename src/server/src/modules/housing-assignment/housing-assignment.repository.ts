import type {
  PoolClient,
} from 'pg';

import {
  pool,
} from '../../db/pool.js';

import type {
  HousingApplicationStatus,
} from '../housing-application/housing-application.types.js';

import type {
  RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

import type {
  HousingAssignmentApplication,
  HousingAssignmentOptionBuilding,
  HousingAssignmentOptionRoom,
  HousingAssignmentOptions,
  HousingAssignmentRecord,
  HousingAssignmentRoommate,
  HousingAssignmentStatus,
  StudentHousingAssignment,
} from './housing-assignment.types.js';

interface AssignmentRow {
  id: string;
  application_id: string;
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  academic_year: string;
  status: HousingAssignmentStatus;
  building_id: string;
  building_name: string;
  room_id: string;
  room_number: string;
  room_style: RoomStyle;
  bed_id: string;
  bed_label: string;
  reserved_at: Date;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  cancelled_by: string | null;
  superseded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface AssignmentApplicationRow {
  id: string;
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  academic_status: string;
  major: string;
  anticipated_graduation_semester: string | null;
  anticipated_graduation_year: number | null;
  academic_year: string;
  preferred_building_id: string;
  preferred_building_name: string;
  preferred_room_style: RoomStyle;
  status: HousingApplicationStatus;
  assignment_id: string | null;
  assignment_status: HousingAssignmentStatus | null;
}

interface AcceptedRoommateRow {
  application_id: string;
  request_id: string;
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  roommate_application_id: string | null;
  roommate_application_status:
    HousingApplicationStatus | null;
}

interface AssignmentOptionApplicationRow {
  id: string;
  academic_year: string;
  status: HousingApplicationStatus;
  preferred_building_id: string;
  preferred_building_name: string;
  preferred_room_style: RoomStyle;
}

interface AssignmentOptionRow {
  building_id: string;
  building_name: string;
  building_address: string;
  room_id: string;
  room_number: string;
  floor: number | null;
  room_style: RoomStyle;
  bed_id: string;
  bed_label: string;
  available: boolean;
}

interface LockedApplicationRow {
  id: string;
  student_id: string;
  academic_year: string;
  status: HousingApplicationStatus;
}

interface LockedBedRow {
  id: string;
  room_id: string;
  bed_active: boolean;
  room_active: boolean;
  building_active: boolean;
}

interface LockedAssignmentRow {
  id: string;
  application_id: string;
  bed_id: string;
  status: HousingAssignmentStatus;
}

interface LockedLeaseRow {
  id: string;
  status: string;
}

type LeasePreparationResult =
  | 'ready'
  | 'lease_sent_for_signature'
  | 'lease_signed';

export type ReserveAssignmentResult =
  | {
      kind: 'created';
      assignment: HousingAssignmentRecord;
    }
  | {
      kind:
        | 'application_not_found'
        | 'application_not_approved'
        | 'bed_not_found'
        | 'bed_unavailable'
        | 'bed_conflict';
    };

export type ReservePairAssignmentResult =
  | {
      kind: 'created';
      assignments: [
        HousingAssignmentRecord,
        HousingAssignmentRecord,
      ];
    }
  | {
      kind:
        | 'application_not_found'
        | 'application_not_approved'
        | 'academic_year_mismatch'
        | 'roommate_request_not_accepted'
        | 'bed_not_found'
        | 'beds_not_same_room'
        | 'bed_unavailable'
        | 'bed_conflict';
    };

export type ChangeAssignmentResult =
  | {
      kind: 'changed';
      assignment: HousingAssignmentRecord;
    }
  | {
      kind:
        | 'assignment_not_found'
        | 'assignment_not_reserved'
        | 'application_not_assigned'
        | 'bed_not_found'
        | 'same_bed'
        | 'bed_unavailable'
        | 'bed_conflict'
        | 'lease_sent_for_signature'
        | 'lease_signed';
    };

export type CancelAssignmentOnlyResult =
  | {
      kind: 'cancelled';
      assignment: HousingAssignmentRecord;
    }
  | {
      kind:
        | 'assignment_not_found'
        | 'assignment_not_reserved'
        | 'application_not_assigned'
        | 'unsecured_application_conflict'
        | 'lease_sent_for_signature'
        | 'lease_signed';
    };

export type CancelAssignmentResult =
  | {
      kind: 'cancelled';
      assignment: HousingAssignmentRecord;
    }
  | {
      kind:
        | 'assignment_not_found'
        | 'assignment_not_reserved'
        | 'application_not_assigned'
        | 'lease_sent_for_signature'
        | 'lease_signed';
    };

const ASSIGNMENT_SELECT = `
  SELECT
    assignment.id,
    assignment.application_id,
    application.student_id,
    profile.student_number,
    profile.first_name,
    profile.last_name,
    application.academic_year,
    assignment.status,
    building.id AS building_id,
    building.name AS building_name,
    room.id AS room_id,
    room.room_number,
    room.room_style,
    bed.id AS bed_id,
    bed.bed_label,
    assignment.reserved_at,
    assignment.confirmed_at,
    assignment.cancelled_at,
    assignment.cancelled_by,
    assignment.superseded_at,
    assignment.created_at,
    assignment.updated_at
  FROM housing_assignments assignment
  JOIN housing_applications application
    ON application.id = assignment.application_id
  JOIN student_profiles profile
    ON profile.user_id = application.student_id
  JOIN beds bed
    ON bed.id = assignment.bed_id
  JOIN rooms room
    ON room.id = bed.room_id
  JOIN buildings building
    ON building.id = room.building_id
`;

function mapAssignment(
  row: AssignmentRow,
): HousingAssignmentRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    studentId: row.student_id,
    studentNumber: row.student_number,
    firstName: row.first_name,
    lastName: row.last_name,
    academicYear: row.academic_year,
    status: row.status,
    buildingId: row.building_id,
    buildingName: row.building_name,
    roomId: row.room_id,
    roomNumber: row.room_number,
    roomStyle: row.room_style,
    bedId: row.bed_id,
    bedLabel: row.bed_label,
    reservedAt: row.reserved_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
    cancelledBy: row.cancelled_by,
    supersededAt: row.superseded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStudentAssignment(
  row: AssignmentRow,
): StudentHousingAssignment {
  return {
    id: row.id,
    applicationId: row.application_id,
    academicYear: row.academic_year,
    status: row.status,
    buildingName: row.building_name,
    roomNumber: row.room_number,
    roomStyle: row.room_style,
    bedLabel: row.bed_label,
    reservedAt: row.reserved_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
    supersededAt: row.superseded_at,
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

async function findAssignmentByIdWithClient(
  client: PoolClient,
  assignmentId: string,
): Promise<HousingAssignmentRecord | null> {
  const result =
    await client.query<AssignmentRow>(
      `
        ${ASSIGNMENT_SELECT}
        WHERE assignment.id = $1
      `,
      [
        assignmentId,
      ],
    );

  const row =
    result.rows[0];

  return row === undefined
    ? null
    : mapAssignment(row);
}

async function prepareLocalLeaseForAssignmentEnd(
  client: PoolClient,
  assignmentId: string,
  officerId: string,
): Promise<LeasePreparationResult> {
  const leaseResult =
    await client.query<LockedLeaseRow>(
      `
        SELECT
          id,
          status
        FROM leases
        WHERE assignment_id = $1
        FOR UPDATE
      `,
      [
        assignmentId,
      ],
    );

  const lease =
    leaseResult.rows[0];

  if (
    lease?.status
    === 'SENT_FOR_SIGNATURE'
  ) {
    return 'lease_sent_for_signature';
  }

  if (
    lease?.status
    === 'SIGNED'
  ) {
    return 'lease_signed';
  }

  if (
    lease !== undefined
    && (
      lease.status === 'PENDING'
      || lease.status
        === 'GENERATED'
    )
  ) {
    await client.query(
      `
        UPDATE leases
        SET
          status = 'VOIDED',
          voided_at = NOW(),
          voided_by = $2,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        lease.id,
        officerId,
      ],
    );
  }

  return 'ready';
}

async function findAcceptedRoommates(
  applicationIds: string[],
): Promise<
  Map<
    string,
    HousingAssignmentRoommate[]
  >
> {
  const roommates =
    new Map<
      string,
      HousingAssignmentRoommate[]
    >();

  if (
    applicationIds.length
    === 0
  ) {
    return roommates;
  }

  const result =
    await pool.query<AcceptedRoommateRow>(
      `
        SELECT
          application.id AS application_id,
          request.id AS request_id,
          roommate_profile.user_id AS student_id,
          roommate_profile.student_number,
          roommate_profile.first_name,
          roommate_profile.last_name,
          roommate_application.id
            AS roommate_application_id,
          roommate_application.status
            AS roommate_application_status
        FROM housing_applications application
        JOIN roommate_requests request
          ON request.academic_year =
            application.academic_year
          AND request.status = 'ACCEPTED'
          AND (
            request.requester_student_id =
              application.student_id
            OR request.requested_student_id =
              application.student_id
          )
        JOIN student_profiles roommate_profile
          ON roommate_profile.user_id = CASE
            WHEN request.requester_student_id =
              application.student_id
              THEN request.requested_student_id
            ELSE request.requester_student_id
          END
        LEFT JOIN LATERAL (
          SELECT
            candidate.id,
            candidate.status
          FROM housing_applications candidate
          WHERE candidate.student_id =
              roommate_profile.user_id
            AND candidate.academic_year =
              application.academic_year
          ORDER BY
            CASE candidate.status
              WHEN 'APPROVED' THEN 1
              WHEN 'HOUSING_ASSIGNED' THEN 2
              WHEN 'COMPLETED' THEN 3
              WHEN 'SUBMITTED' THEN 4
              WHEN 'DRAFT' THEN 5
              WHEN 'CANCELLED' THEN 6
            END,
            candidate.created_at DESC,
            candidate.id DESC
          LIMIT 1
        ) roommate_application ON TRUE
        WHERE application.id =
          ANY($1::bigint[])
        ORDER BY
          application.id,
          roommate_profile.last_name,
          roommate_profile.first_name
      `,
      [
        applicationIds,
      ],
    );

  for (
    const row
    of result.rows
  ) {
    const existing =
      roommates.get(
        row.application_id,
      )
      ?? [];

    existing.push({
      requestId:
        row.request_id,
      studentId:
        row.student_id,
      studentNumber:
        row.student_number,
      firstName:
        row.first_name,
      lastName:
        row.last_name,
      applicationId:
        row.roommate_application_id,
      applicationStatus:
        row.roommate_application_status,
    });

    roommates.set(
      row.application_id,
      existing,
    );
  }

  return roommates;
}

export async function findHousingAssignmentApplications():
Promise<HousingAssignmentApplication[]> {
  const result =
    await pool.query<AssignmentApplicationRow>(
      `
        SELECT
          application.id,
          application.student_id,
          profile.student_number,
          profile.first_name,
          profile.last_name,
          profile.gender,
          profile.academic_status,
          profile.major,
          profile.anticipated_graduation_semester,
          profile.anticipated_graduation_year,
          application.academic_year,
          application.preferred_building_id,
          preferred_building.name
            AS preferred_building_name,
          application.preferred_room_style,
          application.status,
          assignment.id AS assignment_id,
          assignment.status AS assignment_status
        FROM housing_applications application
        JOIN student_profiles profile
          ON profile.user_id =
            application.student_id
        JOIN buildings preferred_building
          ON preferred_building.id =
            application.preferred_building_id
        LEFT JOIN housing_assignments assignment
          ON assignment.application_id =
            application.id
          AND assignment.status IN (
            'RESERVED',
            'CONFIRMED'
          )
        WHERE application.status IN (
          'APPROVED',
          'HOUSING_ASSIGNED'
        )
        ORDER BY
          CASE application.status
            WHEN 'APPROVED' THEN 1
            WHEN 'HOUSING_ASSIGNED' THEN 2
          END,
          application.approved_at
            DESC NULLS LAST,
          application.created_at DESC,
          application.id DESC
      `,
    );

  const roommateMap =
    await findAcceptedRoommates(
      result.rows.map(
        (row) =>
          row.id,
      ),
    );

  return result.rows.map(
    (
      row,
    ): HousingAssignmentApplication => ({
      id: row.id,
      studentId:
        row.student_id,
      studentNumber:
        row.student_number,
      firstName:
        row.first_name,
      lastName:
        row.last_name,
      gender:
        row.gender,
      academicStatus:
        row.academic_status,
      major:
        row.major,
      anticipatedGraduationSemester:
        row.anticipated_graduation_semester,
      anticipatedGraduationYear:
        row.anticipated_graduation_year,
      academicYear:
        row.academic_year,
      preferredBuildingId:
        row.preferred_building_id,
      preferredBuildingName:
        row.preferred_building_name,
      preferredRoomStyle:
        row.preferred_room_style,
      status:
        row.status,
      assignmentId:
        row.assignment_id,
      assignmentStatus:
        row.assignment_status,
      roommates:
        roommateMap.get(
          row.id,
        )
        ?? [],
    }),
  );
}

export async function findAllHousingAssignments():
Promise<HousingAssignmentRecord[]> {
  const result =
    await pool.query<AssignmentRow>(
      `
        ${ASSIGNMENT_SELECT}
        ORDER BY
          CASE assignment.status
            WHEN 'RESERVED' THEN 1
            WHEN 'CONFIRMED' THEN 2
            WHEN 'CANCELLED' THEN 3
            WHEN 'SUPERSEDED' THEN 4
          END,
          assignment.reserved_at DESC,
          assignment.id DESC
      `,
    );

  return result.rows.map(
    mapAssignment,
  );
}

export async function findStudentHousingAssignments(
  studentId: string,
): Promise<StudentHousingAssignment[]> {
  const result =
    await pool.query<AssignmentRow>(
      `
        ${ASSIGNMENT_SELECT}
        WHERE application.student_id = $1
        ORDER BY
          CASE assignment.status
            WHEN 'RESERVED' THEN 1
            WHEN 'CONFIRMED' THEN 2
            WHEN 'CANCELLED' THEN 3
            WHEN 'SUPERSEDED' THEN 4
          END,
          assignment.reserved_at DESC,
          assignment.id DESC
      `,
      [
        studentId,
      ],
    );

  return result.rows.map(
    mapStudentAssignment,
  );
}

export async function findHousingAssignmentOptions(
  applicationId: string,
): Promise<HousingAssignmentOptions | null> {
  const applicationResult =
    await pool.query<AssignmentOptionApplicationRow>(
      `
        SELECT
          application.id,
          application.academic_year,
          application.status,
          application.preferred_building_id,
          building.name
            AS preferred_building_name,
          application.preferred_room_style
        FROM housing_applications application
        JOIN buildings building
          ON building.id =
            application.preferred_building_id
        WHERE application.id = $1
      `,
      [
        applicationId,
      ],
    );

  const application =
    applicationResult.rows[0];

  if (
    application === undefined
  ) {
    return null;
  }

  const inventoryResult =
    await pool.query<AssignmentOptionRow>(
      `
        SELECT
          building.id AS building_id,
          building.name AS building_name,
          building.address
            AS building_address,
          room.id AS room_id,
          room.room_number,
          room.floor,
          room.room_style,
          bed.id AS bed_id,
          bed.bed_label,
          NOT EXISTS (
            SELECT 1
            FROM housing_assignments assignment
            WHERE assignment.bed_id = bed.id
              AND assignment.status IN (
                'RESERVED',
                'CONFIRMED'
              )
          ) AS available
        FROM buildings building
        JOIN rooms room
          ON room.building_id =
            building.id
        JOIN beds bed
          ON bed.room_id =
            room.id
        WHERE building.active = TRUE
          AND room.active = TRUE
          AND bed.active = TRUE
        ORDER BY
          (
            building.id = $1
            AND room.room_style = $2
          ) DESC,
          (building.id = $1) DESC,
          (room.room_style = $2) DESC,
          building.name,
          room.room_number,
          bed.bed_label
      `,
      [
        application
          .preferred_building_id,
        application
          .preferred_room_style,
      ],
    );

  const buildings:
    HousingAssignmentOptionBuilding[] = [];

  const buildingMap =
    new Map<
      string,
      HousingAssignmentOptionBuilding
    >();

  const roomMap =
    new Map<
      string,
      HousingAssignmentOptionRoom
    >();

  for (
    const row
    of inventoryResult.rows
  ) {
    let building =
      buildingMap.get(
        row.building_id,
      );

    if (
      building === undefined
    ) {
      building = {
        id:
          row.building_id,
        name:
          row.building_name,
        address:
          row.building_address,
        preferredBuilding:
          row.building_id
          === application
            .preferred_building_id,
        rooms: [],
      };

      buildingMap.set(
        row.building_id,
        building,
      );

      buildings.push(
        building,
      );
    }

    let room =
      roomMap.get(
        row.room_id,
      );

    if (
      room === undefined
    ) {
      const preferredRoomStyle =
        row.room_style
        === application
          .preferred_room_style;

      room = {
        id:
          row.room_id,
        roomNumber:
          row.room_number,
        floor:
          row.floor,
        roomStyle:
          row.room_style,
        preferredRoomStyle,
        matchesPreferences:
          building
            .preferredBuilding
          && preferredRoomStyle,
        availableBedCount: 0,
        beds: [],
      };

      roomMap.set(
        row.room_id,
        room,
      );

      building.rooms.push(
        room,
      );
    }

    room.beds.push({
      id:
        row.bed_id,
      bedLabel:
        row.bed_label,
      available:
        row.available,
    });

    if (
      row.available
    ) {
      room.availableBedCount +=
        1;
    }
  }

  return {
    applicationId:
      application.id,
    academicYear:
      application.academic_year,
    status:
      application.status,
    preferredBuildingId:
      application
        .preferred_building_id,
    preferredBuildingName:
      application
        .preferred_building_name,
    preferredRoomStyle:
      application
        .preferred_room_style,
    buildings,
  };
}

export async function reserveHousingAssignment(
  applicationId: string,
  bedId: string,
): Promise<ReserveAssignmentResult> {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const applicationResult =
      await client.query<LockedApplicationRow>(
        `
          SELECT
            id,
            student_id,
            academic_year,
            status
          FROM housing_applications
          WHERE id = $1
          FOR UPDATE
        `,
        [
          applicationId,
        ],
      );

    const application =
      applicationResult.rows[0];

    if (
      application === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_found',
      };
    }

    if (
      application.status
      !== 'APPROVED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_approved',
      };
    }

    const bedResult =
      await client.query<LockedBedRow>(
        `
          SELECT
            bed.id,
            bed.room_id,
            bed.active AS bed_active,
            room.active AS room_active,
            building.active
              AS building_active
          FROM beds bed
          JOIN rooms room
            ON room.id =
              bed.room_id
          JOIN buildings building
            ON building.id =
              room.building_id
          WHERE bed.id = $1
          FOR UPDATE
            OF bed, room, building
        `,
        [
          bedId,
        ],
      );

    const bed =
      bedResult.rows[0];

    if (
      bed === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_not_found',
      };
    }

    if (
      !bed.bed_active
      || !bed.room_active
      || !bed.building_active
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_unavailable',
      };
    }

    const activeAssignmentResult =
      await client.query<{
        exists: boolean;
      }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM housing_assignments assignment
            WHERE assignment.bed_id = $1
              AND assignment.status IN (
                'RESERVED',
                'CONFIRMED'
              )
          ) AS exists
        `,
        [
          bedId,
        ],
      );

    if (
      activeAssignmentResult
        .rows[0]?.exists
      === true
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_conflict',
      };
    }

    const insertResult =
      await client.query<{
        id: string;
      }>(
        `
          INSERT INTO housing_assignments (
            application_id,
            bed_id,
            status,
            reserved_at
          )
          VALUES (
            $1,
            $2,
            'RESERVED',
            NOW()
          )
          RETURNING id
        `,
        [
          applicationId,
          bedId,
        ],
      );

    const assignmentId =
      insertResult.rows[0]?.id;

    if (
      assignmentId === undefined
    ) {
      throw new Error(
        'Housing assignment insert did not return an id.',
      );
    }

    const updateResult =
      await client.query(
        `
          UPDATE housing_applications
          SET
            status =
              'HOUSING_ASSIGNED',
            housing_assigned_at =
              NOW(),
            updated_at =
              NOW()
          WHERE id = $1
            AND status =
              'APPROVED'
        `,
        [
          applicationId,
        ],
      );

    if (
      updateResult.rowCount
      !== 1
    ) {
      throw new Error(
        'Housing application could not be transitioned to HOUSING_ASSIGNED.',
      );
    }

    const assignment =
      await findAssignmentByIdWithClient(
        client,
        assignmentId,
      );

    if (
      assignment === null
    ) {
      throw new Error(
        'Created housing assignment could not be retrieved.',
      );
    }

    await client.query(
      'COMMIT',
    );

    return {
      kind:
        'created',
      assignment,
    };
  } catch (
    error: unknown
  ) {
    await client.query(
      'ROLLBACK',
    );

    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      return {
        kind:
          'bed_conflict',
      };
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function reserveRoommatePairAssignments(
  applicationId: string,
  roommateApplicationId: string,
  bedId: string,
  roommateBedId: string,
): Promise<ReservePairAssignmentResult> {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const applicationIds = [
      applicationId,
      roommateApplicationId,
    ];

    const applicationResult =
      await client.query<LockedApplicationRow>(
        `
          SELECT
            id,
            student_id,
            academic_year,
            status
          FROM housing_applications
          WHERE id =
            ANY($1::bigint[])
          ORDER BY id
          FOR UPDATE
        `,
        [
          applicationIds,
        ],
      );

    if (
      applicationResult.rows.length
      !== 2
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_found',
      };
    }

    const application =
      applicationResult.rows.find(
        (row) =>
          row.id
          === applicationId,
      );

    const roommateApplication =
      applicationResult.rows.find(
        (row) =>
          row.id
          === roommateApplicationId,
      );

    if (
      application === undefined
      || roommateApplication
        === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_found',
      };
    }

    if (
      application.status
        !== 'APPROVED'
      || roommateApplication.status
        !== 'APPROVED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_approved',
      };
    }

    if (
      application.academic_year
      !== roommateApplication
        .academic_year
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'academic_year_mismatch',
      };
    }

    const acceptedRequestResult =
      await client.query<{
        exists: boolean;
      }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM roommate_requests request
            WHERE request.academic_year = $1
              AND request.status =
                'ACCEPTED'
              AND (
                (
                  request.requester_student_id =
                    $2
                  AND request.requested_student_id =
                    $3
                )
                OR
                (
                  request.requester_student_id =
                    $3
                  AND request.requested_student_id =
                    $2
                )
              )
          ) AS exists
        `,
        [
          application
            .academic_year,
          application
            .student_id,
          roommateApplication
            .student_id,
        ],
      );

    if (
      acceptedRequestResult
        .rows[0]?.exists
      !== true
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'roommate_request_not_accepted',
      };
    }

    const bedIds = [
      bedId,
      roommateBedId,
    ];

    const bedResult =
      await client.query<LockedBedRow>(
        `
          SELECT
            bed.id,
            bed.room_id,
            bed.active AS bed_active,
            room.active AS room_active,
            building.active
              AS building_active
          FROM beds bed
          JOIN rooms room
            ON room.id =
              bed.room_id
          JOIN buildings building
            ON building.id =
              room.building_id
          WHERE bed.id =
            ANY($1::bigint[])
          ORDER BY bed.id
          FOR UPDATE
            OF bed, room, building
        `,
        [
          bedIds,
        ],
      );

    if (
      bedResult.rows.length
      !== 2
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_not_found',
      };
    }

    const firstBed =
      bedResult.rows.find(
        (row) =>
          row.id
          === bedId,
      );

    const secondBed =
      bedResult.rows.find(
        (row) =>
          row.id
          === roommateBedId,
      );

    if (
      firstBed === undefined
      || secondBed === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_not_found',
      };
    }

    if (
      firstBed.room_id
      !== secondBed.room_id
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'beds_not_same_room',
      };
    }

    if (
      !firstBed.bed_active
      || !firstBed.room_active
      || !firstBed
        .building_active
      || !secondBed.bed_active
      || !secondBed.room_active
      || !secondBed
        .building_active
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_unavailable',
      };
    }

    const activeAssignmentResult =
      await client.query<{
        count: number;
      }>(
        `
          SELECT
            COUNT(*)::INTEGER
              AS count
          FROM housing_assignments assignment
          WHERE assignment.bed_id =
            ANY($1::bigint[])
            AND assignment.status IN (
              'RESERVED',
              'CONFIRMED'
            )
        `,
        [
          bedIds,
        ],
      );

    if (
      (
        activeAssignmentResult
          .rows[0]?.count
        ?? 0
      ) > 0
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_conflict',
      };
    }

    const firstInsert =
      await client.query<{
        id: string;
      }>(
        `
          INSERT INTO housing_assignments (
            application_id,
            bed_id,
            status,
            reserved_at
          )
          VALUES (
            $1,
            $2,
            'RESERVED',
            NOW()
          )
          RETURNING id
        `,
        [
          applicationId,
          bedId,
        ],
      );

    const secondInsert =
      await client.query<{
        id: string;
      }>(
        `
          INSERT INTO housing_assignments (
            application_id,
            bed_id,
            status,
            reserved_at
          )
          VALUES (
            $1,
            $2,
            'RESERVED',
            NOW()
          )
          RETURNING id
        `,
        [
          roommateApplicationId,
          roommateBedId,
        ],
      );

    const firstAssignmentId =
      firstInsert.rows[0]?.id;

    const secondAssignmentId =
      secondInsert.rows[0]?.id;

    if (
      firstAssignmentId
        === undefined
      || secondAssignmentId
        === undefined
    ) {
      throw new Error(
        'Roommate pair assignment insert did not return both ids.',
      );
    }

    const updateResult =
      await client.query(
        `
          UPDATE housing_applications
          SET
            status =
              'HOUSING_ASSIGNED',
            housing_assigned_at =
              NOW(),
            updated_at =
              NOW()
          WHERE id =
            ANY($1::bigint[])
            AND status =
              'APPROVED'
        `,
        [
          applicationIds,
        ],
      );

    if (
      updateResult.rowCount
      !== 2
    ) {
      throw new Error(
        'Roommate pair applications could not both transition to HOUSING_ASSIGNED.',
      );
    }

    const firstAssignment =
      await findAssignmentByIdWithClient(
        client,
        firstAssignmentId,
      );

    const secondAssignment =
      await findAssignmentByIdWithClient(
        client,
        secondAssignmentId,
      );

    if (
      firstAssignment === null
      || secondAssignment === null
    ) {
      throw new Error(
        'Created roommate pair assignments could not be retrieved.',
      );
    }

    await client.query(
      'COMMIT',
    );

    return {
      kind:
        'created',

      assignments: [
        firstAssignment,
        secondAssignment,
      ],
    };
  } catch (
    error: unknown
  ) {
    await client.query(
      'ROLLBACK',
    );

    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      return {
        kind:
          'bed_conflict',
      };
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function changeReservedHousingAssignment(
  assignmentId: string,
  targetBedId: string,
  officerId: string,
): Promise<ChangeAssignmentResult> {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const assignmentResult =
      await client.query<LockedAssignmentRow>(
        `
          SELECT
            id,
            application_id,
            bed_id,
            status
          FROM housing_assignments
          WHERE id = $1
          FOR UPDATE
        `,
        [
          assignmentId,
        ],
      );

    const assignment =
      assignmentResult.rows[0];

    if (
      assignment === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'assignment_not_found',
      };
    }

    if (
      assignment.status
      !== 'RESERVED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'assignment_not_reserved',
      };
    }

    if (
      assignment.bed_id
      === targetBedId
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'same_bed',
      };
    }

    const applicationResult =
      await client.query<LockedApplicationRow>(
        `
          SELECT
            id,
            student_id,
            academic_year,
            status
          FROM housing_applications
          WHERE id = $1
          FOR UPDATE
        `,
        [
          assignment
            .application_id,
        ],
      );

    const application =
      applicationResult.rows[0];

    if (
      application === undefined
      || application.status
        !== 'HOUSING_ASSIGNED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_assigned',
      };
    }

    const bedIds = [
      assignment.bed_id,
      targetBedId,
    ];

    const bedResult =
      await client.query<LockedBedRow>(
        `
          SELECT
            bed.id,
            bed.room_id,
            bed.active AS bed_active,
            room.active AS room_active,
            building.active
              AS building_active
          FROM beds bed
          JOIN rooms room
            ON room.id =
              bed.room_id
          JOIN buildings building
            ON building.id =
              room.building_id
          WHERE bed.id =
            ANY($1::bigint[])
          ORDER BY bed.id
          FOR UPDATE
            OF bed, room, building
        `,
        [
          bedIds,
        ],
      );

    const targetBed =
      bedResult.rows.find(
        (row) =>
          row.id
          === targetBedId,
      );

    if (
      targetBed === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_not_found',
      };
    }

    if (
      !targetBed.bed_active
      || !targetBed.room_active
      || !targetBed
        .building_active
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_unavailable',
      };
    }

    const conflictResult =
      await client.query<{
        exists: boolean;
      }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM housing_assignments
            WHERE bed_id = $1
              AND status IN (
                'RESERVED',
                'CONFIRMED'
              )
          ) AS exists
        `,
        [
          targetBedId,
        ],
      );

    if (
      conflictResult
        .rows[0]?.exists
      === true
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'bed_conflict',
      };
    }

    const leasePreparation =
      await prepareLocalLeaseForAssignmentEnd(
        client,
        assignmentId,
        officerId,
      );

    if (
      leasePreparation
      !== 'ready'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          leasePreparation,
      };
    }

    await client.query(
      `
        UPDATE housing_assignments
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          cancelled_by = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'RESERVED'
      `,
      [
        assignmentId,
        officerId,
      ],
    );

    const insertResult =
      await client.query<{
        id: string;
      }>(
        `
          INSERT INTO housing_assignments (
            application_id,
            bed_id,
            status,
            reserved_at
          )
          VALUES (
            $1,
            $2,
            'RESERVED',
            NOW()
          )
          RETURNING id
        `,
        [
          assignment
            .application_id,
          targetBedId,
        ],
      );

    const newAssignmentId =
      insertResult.rows[0]?.id;

    if (
      newAssignmentId
      === undefined
    ) {
      throw new Error(
        'Replacement housing assignment insert did not return an id.',
      );
    }

    await client.query(
      `
        UPDATE housing_applications
        SET
          updated_at = NOW()
        WHERE id = $1
          AND status =
            'HOUSING_ASSIGNED'
      `,
      [
        assignment
          .application_id,
      ],
    );

    const replacement =
      await findAssignmentByIdWithClient(
        client,
        newAssignmentId,
      );

    if (
      replacement === null
    ) {
      throw new Error(
        'Replacement housing assignment could not be retrieved.',
      );
    }

    await client.query(
      'COMMIT',
    );

    return {
      kind:
        'changed',
      assignment:
        replacement,
    };
  } catch (
    error: unknown
  ) {
    await client.query(
      'ROLLBACK',
    );

    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      return {
        kind:
          'bed_conflict',
      };
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function cancelReservedHousingAssignmentOnly(
  assignmentId: string,
  officerId: string,
): Promise<CancelAssignmentOnlyResult> {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const assignmentResult =
      await client.query<LockedAssignmentRow>(
        `
          SELECT
            id,
            application_id,
            bed_id,
            status
          FROM housing_assignments
          WHERE id = $1
          FOR UPDATE
        `,
        [
          assignmentId,
        ],
      );

    const assignment =
      assignmentResult.rows[0];

    if (
      assignment === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'assignment_not_found',
      };
    }

    if (
      assignment.status
      !== 'RESERVED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'assignment_not_reserved',
      };
    }

    const applicationResult =
      await client.query<LockedApplicationRow>(
        `
          SELECT
            id,
            student_id,
            academic_year,
            status
          FROM housing_applications
          WHERE id = $1
          FOR UPDATE
        `,
        [
          assignment
            .application_id,
        ],
      );

    const application =
      applicationResult.rows[0];

    if (
      application === undefined
      || application.status
        !== 'HOUSING_ASSIGNED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_assigned',
      };
    }

    const unsecuredApplicationResult =
      await client.query<{
        exists: boolean;
      }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM housing_applications other
            WHERE other.student_id = $1
              AND other.id <> $2
              AND other.status IN (
                'DRAFT',
                'SUBMITTED',
                'APPROVED'
              )
          ) AS exists
        `,
        [
          application
            .student_id,
          application.id,
        ],
      );

    if (
      unsecuredApplicationResult
        .rows[0]?.exists
      === true
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'unsecured_application_conflict',
      };
    }

    await client.query(
      `
        SELECT id
        FROM beds
        WHERE id = $1
        FOR UPDATE
      `,
      [
        assignment
          .bed_id,
      ],
    );

    const leasePreparation =
      await prepareLocalLeaseForAssignmentEnd(
        client,
        assignmentId,
        officerId,
      );

    if (
      leasePreparation
      !== 'ready'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          leasePreparation,
      };
    }

    await client.query(
      `
        UPDATE housing_assignments
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          cancelled_by = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'RESERVED'
      `,
      [
        assignmentId,
        officerId,
      ],
    );

    await client.query(
      `
        UPDATE housing_applications
        SET
          status = 'APPROVED',
          housing_assigned_at = NULL,
          cancelled_at = NULL,
          cancelled_by = NULL,
          updated_at = NOW()
        WHERE id = $1
          AND status =
            'HOUSING_ASSIGNED'
      `,
      [
        assignment
          .application_id,
      ],
    );

    const cancelled =
      await findAssignmentByIdWithClient(
        client,
        assignmentId,
      );

    if (
      cancelled === null
    ) {
      throw new Error(
        'Cancelled housing assignment could not be retrieved.',
      );
    }

    await client.query(
      'COMMIT',
    );

    return {
      kind:
        'cancelled',
      assignment:
        cancelled,
    };
  } catch (
    error: unknown
  ) {
    await client.query(
      'ROLLBACK',
    );

    if (
      isDatabaseError(
        error,
        '23505',
      )
    ) {
      return {
        kind:
          'unsecured_application_conflict',
      };
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function cancelReservedHousingAssignment(
  assignmentId: string,
  officerId: string,
): Promise<CancelAssignmentResult> {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const assignmentResult =
      await client.query<LockedAssignmentRow>(
        `
          SELECT
            id,
            application_id,
            bed_id,
            status
          FROM housing_assignments
          WHERE id = $1
          FOR UPDATE
        `,
        [
          assignmentId,
        ],
      );

    const assignment =
      assignmentResult.rows[0];

    if (
      assignment === undefined
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'assignment_not_found',
      };
    }

    if (
      assignment.status
      !== 'RESERVED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'assignment_not_reserved',
      };
    }

    const applicationResult =
      await client.query<LockedApplicationRow>(
        `
          SELECT
            id,
            student_id,
            academic_year,
            status
          FROM housing_applications
          WHERE id = $1
          FOR UPDATE
        `,
        [
          assignment
            .application_id,
        ],
      );

    const application =
      applicationResult.rows[0];

    if (
      application === undefined
      || application.status
        !== 'HOUSING_ASSIGNED'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          'application_not_assigned',
      };
    }

    await client.query(
      `
        SELECT id
        FROM beds
        WHERE id = $1
        FOR UPDATE
      `,
      [
        assignment
          .bed_id,
      ],
    );

    const leasePreparation =
      await prepareLocalLeaseForAssignmentEnd(
        client,
        assignmentId,
        officerId,
      );

    if (
      leasePreparation
      !== 'ready'
    ) {
      await client.query(
        'ROLLBACK',
      );

      return {
        kind:
          leasePreparation,
      };
    }

    await client.query(
      `
        UPDATE housing_assignments
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          cancelled_by = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'RESERVED'
      `,
      [
        assignmentId,
        officerId,
      ],
    );

    await client.query(
      `
        UPDATE housing_applications
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          cancelled_by = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status =
            'HOUSING_ASSIGNED'
      `,
      [
        assignment
          .application_id,
        officerId,
      ],
    );

    const cancelled =
      await findAssignmentByIdWithClient(
        client,
        assignmentId,
      );

    if (
      cancelled === null
    ) {
      throw new Error(
        'Cancelled housing assignment could not be retrieved.',
      );
    }

    await client.query(
      'COMMIT',
    );

    return {
      kind:
        'cancelled',
      assignment:
        cancelled,
    };
  } catch (
    error: unknown
  ) {
    await client.query(
      'ROLLBACK',
    );

    throw error;
  } finally {
    client.release();
  }
}