import {
  pool,
} from '../../db/pool.js';

import type {
  RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

import type {
  HousingApplicationStatus,
  StudentHousingApplication,
  StudentHousingApplicationInput,
} from './housing-application.types.js';

interface StudentHousingApplicationRow {
  id: string;
  academic_year: string;
  preferred_building_id: string;
  preferred_building_name: string;
  preferred_room_style: RoomStyle;
  status: HousingApplicationStatus;
  submitted_at: Date | null;
  approved_at: Date | null;
  housing_assigned_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapStudentHousingApplication(
  row: StudentHousingApplicationRow,
): StudentHousingApplication {
  return {
    id: row.id,
    academicYear: row.academic_year,
    preferredBuildingId:
      row.preferred_building_id,
    preferredBuildingName:
      row.preferred_building_name,
    preferredRoomStyle:
      row.preferred_room_style,
    status: row.status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    housingAssignedAt:
      row.housing_assigned_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findStudentApplications(
  studentId: string,
): Promise<StudentHousingApplication[]> {
  const result =
    await pool.query<StudentHousingApplicationRow>(
      `
        SELECT
          application.id,
          application.academic_year,
          application.preferred_building_id,
          building.name
            AS preferred_building_name,
          application.preferred_room_style,
          application.status,
          application.submitted_at,
          application.approved_at,
          application.housing_assigned_at,
          application.completed_at,
          application.cancelled_at,
          application.created_at,
          application.updated_at
        FROM housing_applications application
        JOIN buildings building
          ON building.id =
            application.preferred_building_id
        WHERE application.student_id = $1
        ORDER BY
          application.created_at DESC,
          application.id DESC
      `,
      [
        studentId,
      ],
    );

  return result.rows.map(
    mapStudentHousingApplication,
  );
}

export async function findStudentApplicationById(
  studentId: string,
  applicationId: string,
): Promise<StudentHousingApplication | null> {
  const result =
    await pool.query<StudentHousingApplicationRow>(
      `
        SELECT
          application.id,
          application.academic_year,
          application.preferred_building_id,
          building.name
            AS preferred_building_name,
          application.preferred_room_style,
          application.status,
          application.submitted_at,
          application.approved_at,
          application.housing_assigned_at,
          application.completed_at,
          application.cancelled_at,
          application.created_at,
          application.updated_at
        FROM housing_applications application
        JOIN buildings building
          ON building.id =
            application.preferred_building_id
        WHERE application.student_id = $1
          AND application.id = $2
      `,
      [
        studentId,
        applicationId,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return mapStudentHousingApplication(
    row,
  );
}

export async function hasActiveBuildingRoomStyle(
  buildingId: string,
  roomStyle: RoomStyle,
): Promise<boolean> {
  const result =
    await pool.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM buildings building
          JOIN rooms room
            ON room.building_id =
              building.id
          WHERE building.id = $1
            AND building.active = TRUE
            AND room.active = TRUE
            AND room.room_style = $2
        ) AS exists
      `,
      [
        buildingId,
        roomStyle,
      ],
    );

  return (
    result.rows[0]?.exists
    ?? false
  );
}

export async function insertStudentApplication(
  studentId: string,
  input: StudentHousingApplicationInput,
): Promise<StudentHousingApplication> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO housing_applications (
          student_id,
          academic_year,
          preferred_building_id,
          preferred_room_style,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'DRAFT'
        )
        RETURNING id
      `,
      [
        studentId,
        input.academicYear,
        input.preferredBuildingId,
        input.preferredRoomStyle,
      ],
    );

  const applicationId =
    result.rows[0]?.id;

  if (applicationId === undefined) {
    throw new Error(
      'Housing application insert did not return an id.',
    );
  }

  const application =
    await findStudentApplicationById(
      studentId,
      applicationId,
    );

  if (application === null) {
    throw new Error(
      'Created housing application could not be retrieved.',
    );
  }

  return application;
}

export async function updateStudentDraftApplication(
  studentId: string,
  applicationId: string,
  input: StudentHousingApplicationInput,
): Promise<StudentHousingApplication | null> {
  const result =
    await pool.query<{ id: string }>(
      `
        UPDATE housing_applications
        SET
          academic_year = $3,
          preferred_building_id = $4,
          preferred_room_style = $5,
          updated_at = NOW()
        WHERE id = $1
          AND student_id = $2
          AND status = 'DRAFT'
        RETURNING id
      `,
      [
        applicationId,
        studentId,
        input.academicYear,
        input.preferredBuildingId,
        input.preferredRoomStyle,
      ],
    );

  if (result.rows[0] === undefined) {
    return null;
  }

  return findStudentApplicationById(
    studentId,
    applicationId,
  );
}

export async function submitStudentDraftApplication(
  studentId: string,
  applicationId: string,
): Promise<StudentHousingApplication | null> {
  const result =
    await pool.query<{ id: string }>(
      `
        UPDATE housing_applications
        SET
          status = 'SUBMITTED',
          submitted_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND student_id = $2
          AND status = 'DRAFT'
        RETURNING id
      `,
      [
        applicationId,
        studentId,
      ],
    );

  if (result.rows[0] === undefined) {
    return null;
  }

  return findStudentApplicationById(
    studentId,
    applicationId,
  );
}