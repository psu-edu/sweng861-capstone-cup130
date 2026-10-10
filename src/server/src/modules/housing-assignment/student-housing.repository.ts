import {
  pool,
} from '../../db/pool.js';

import type {
  RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

import type {
  HousingAssignmentStatus,
  StudentHousingAssignedRoommate,
  StudentHousingAssignment,
} from './housing-assignment.types.js';

interface StudentHousingAssignmentRow {
  id: string;
  application_id: string;
  academic_year: string;
  status: HousingAssignmentStatus;
  building_name: string;
  room_number: string;
  room_style: RoomStyle;
  bed_label: string;
  reserved_at: Date;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  superseded_at: Date | null;
  total_bed_count: number | null;
  occupied_bed_count: number | null;
  open_bed_count: number | null;
  assigned_roommates:
    StudentHousingAssignedRoommate[];
}

function mapStudentHousingAssignment(
  row: StudentHousingAssignmentRow,
): StudentHousingAssignment {
  return {
    id:
      row.id,
    applicationId:
      row.application_id,
    academicYear:
      row.academic_year,
    status:
      row.status,
    buildingName:
      row.building_name,
    roomNumber:
      row.room_number,
    roomStyle:
      row.room_style,
    bedLabel:
      row.bed_label,
    reservedAt:
      row.reserved_at,
    confirmedAt:
      row.confirmed_at,
    cancelledAt:
      row.cancelled_at,
    supersededAt:
      row.superseded_at,
    totalBedCount:
      row.total_bed_count,
    occupiedBedCount:
      row.occupied_bed_count,
    openBedCount:
      row.open_bed_count,
    assignedRoommates:
      row.assigned_roommates,
  };
}

export async function findDetailedStudentHousingAssignments(
  studentId: string,
): Promise<StudentHousingAssignment[]> {
  const result =
    await pool.query<StudentHousingAssignmentRow>(
      `
        SELECT
          assignment.id,
          assignment.application_id,
          application.academic_year,
          assignment.status,
          building.name
            AS building_name,
          room.room_number,
          room.room_style,
          bed.bed_label,
          assignment.reserved_at,
          assignment.confirmed_at,
          assignment.cancelled_at,
          assignment.superseded_at,

          CASE
            WHEN assignment.status IN (
              'RESERVED',
              'CONFIRMED'
            )
            THEN (
              SELECT
                COUNT(*)::INTEGER
              FROM beds room_bed
              WHERE room_bed.room_id =
                room.id
                AND room_bed.active =
                  TRUE
            )
            ELSE NULL
          END AS total_bed_count,

          CASE
            WHEN assignment.status IN (
              'RESERVED',
              'CONFIRMED'
            )
            THEN (
              SELECT
                COUNT(*)::INTEGER
              FROM beds room_bed
              WHERE room_bed.room_id =
                room.id
                AND room_bed.active =
                  TRUE
                AND EXISTS (
                  SELECT 1
                  FROM housing_assignments
                    occupant_assignment
                  WHERE occupant_assignment
                    .bed_id =
                      room_bed.id
                    AND occupant_assignment
                      .status IN (
                        'RESERVED',
                        'CONFIRMED'
                      )
                )
            )
            ELSE NULL
          END AS occupied_bed_count,

          CASE
            WHEN assignment.status IN (
              'RESERVED',
              'CONFIRMED'
            )
            THEN (
              SELECT
                COUNT(*)::INTEGER
              FROM beds room_bed
              WHERE room_bed.room_id =
                room.id
                AND room_bed.active =
                  TRUE
                AND NOT EXISTS (
                  SELECT 1
                  FROM housing_assignments
                    occupant_assignment
                  WHERE occupant_assignment
                    .bed_id =
                      room_bed.id
                    AND occupant_assignment
                      .status IN (
                        'RESERVED',
                        'CONFIRMED'
                      )
                )
            )
            ELSE NULL
          END AS open_bed_count,

          CASE
            WHEN assignment.status IN (
              'RESERVED',
              'CONFIRMED'
            )
            THEN COALESCE(
              (
                SELECT
                  JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                      'firstName',
                        roommate.first_name,
                      'lastName',
                        roommate.last_name,
                      'bedLabel',
                        roommate.bed_label
                    )
                    ORDER BY
                      roommate.last_name,
                      roommate.first_name
                  )
                FROM (
                  SELECT DISTINCT ON (
                    roommate_profile.user_id
                  )
                    roommate_profile.user_id,
                    roommate_profile.first_name,
                    roommate_profile.last_name,
                    roommate_bed.bed_label
                  FROM roommate_requests request
                  JOIN student_profiles
                    roommate_profile
                    ON roommate_profile.user_id =
                      CASE
                        WHEN request
                          .requester_student_id =
                            application.student_id
                        THEN request
                          .requested_student_id
                        ELSE request
                          .requester_student_id
                      END
                  JOIN housing_applications
                    roommate_application
                    ON roommate_application
                      .student_id =
                        roommate_profile.user_id
                    AND roommate_application
                      .academic_year =
                        application.academic_year
                  JOIN housing_assignments
                    roommate_assignment
                    ON roommate_assignment
                      .application_id =
                        roommate_application.id
                    AND roommate_assignment
                      .status IN (
                        'RESERVED',
                        'CONFIRMED'
                      )
                  JOIN beds roommate_bed
                    ON roommate_bed.id =
                      roommate_assignment.bed_id
                  WHERE request.status =
                    'ACCEPTED'
                    AND request.academic_year =
                      application.academic_year
                    AND (
                      request
                        .requester_student_id =
                          application.student_id
                      OR request
                        .requested_student_id =
                          application.student_id
                    )
                    AND roommate_bed.room_id =
                      room.id
                  ORDER BY
                    roommate_profile.user_id,
                    CASE
                      roommate_assignment.status
                      WHEN 'RESERVED' THEN 1
                      WHEN 'CONFIRMED' THEN 2
                    END,
                    roommate_assignment
                      .reserved_at DESC,
                    roommate_assignment.id DESC
                ) roommate
              ),
              '[]'::JSONB
            )
            ELSE '[]'::JSONB
          END AS assigned_roommates

        FROM housing_assignments assignment
        JOIN housing_applications application
          ON application.id =
            assignment.application_id
        JOIN beds bed
          ON bed.id =
            assignment.bed_id
        JOIN rooms room
          ON room.id =
            bed.room_id
        JOIN buildings building
          ON building.id =
            room.building_id
        WHERE application.student_id =
          $1
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
    mapStudentHousingAssignment,
  );
}