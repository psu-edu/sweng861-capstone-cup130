import {
  pool,
} from '../../db/pool.js';

import type {
  RoomStyle,
} from '../housing-inventory/housing-inventory.types.js';

import type {
  HousingApplicationStatus,
  HousingOfficerApplication,
  StudentHousingApplication,
  StudentHousingApplicationInput,
  UpdateOfficerNotesInput,
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

interface HousingOfficerApplicationRow {
  id: string;
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  academic_status: string;
  major: string;
  anticipated_graduation_semester:
    string | null;
  anticipated_graduation_year:
    number | null;
  academic_year: string;
  preferred_building_id: string;
  preferred_building_name: string;
  preferred_room_style: RoomStyle;
  status: HousingApplicationStatus;
  officer_notes: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  approved_by: string | null;
  housing_assigned_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  cancelled_by: string | null;
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

function mapHousingOfficerApplication(
  row: HousingOfficerApplicationRow,
): HousingOfficerApplication {
  return {
    id: row.id,
    studentId: row.student_id,
    studentNumber: row.student_number,
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender,
    academicStatus: row.academic_status,
    major: row.major,
    anticipatedGraduationSemester:
      row.anticipated_graduation_semester,
    anticipatedGraduationYear:
      row.anticipated_graduation_year,
    academicYear: row.academic_year,
    preferredBuildingId:
      row.preferred_building_id,
    preferredBuildingName:
      row.preferred_building_name,
    preferredRoomStyle:
      row.preferred_room_style,
    status: row.status,
    officerNotes: row.officer_notes,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    housingAssignedAt:
      row.housing_assigned_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    cancelledBy: row.cancelled_by,
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

const HOUSING_OFFICER_APPLICATION_SELECT = `
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
    building.name
      AS preferred_building_name,
    application.preferred_room_style,
    application.status,
    application.officer_notes,
    application.submitted_at,
    application.approved_at,
    application.approved_by,
    application.housing_assigned_at,
    application.completed_at,
    application.cancelled_at,
    application.cancelled_by,
    application.created_at,
    application.updated_at
  FROM housing_applications application
  JOIN student_profiles profile
    ON profile.user_id =
      application.student_id
  JOIN buildings building
    ON building.id =
      application.preferred_building_id
`;

export async function findHousingOfficerApplications():
Promise<HousingOfficerApplication[]> {
  const result =
    await pool.query<HousingOfficerApplicationRow>(
      `
        ${HOUSING_OFFICER_APPLICATION_SELECT}
        ORDER BY
          CASE application.status
            WHEN 'SUBMITTED' THEN 1
            WHEN 'APPROVED' THEN 2
            WHEN 'DRAFT' THEN 3
            WHEN 'HOUSING_ASSIGNED' THEN 4
            WHEN 'COMPLETED' THEN 5
            WHEN 'CANCELLED' THEN 6
          END,
          application.submitted_at
            DESC NULLS LAST,
          application.created_at DESC
      `,
    );

  return result.rows.map(
    mapHousingOfficerApplication,
  );
}

export async function findHousingOfficerApplicationById(
  applicationId: string,
): Promise<HousingOfficerApplication | null> {
  const result =
    await pool.query<HousingOfficerApplicationRow>(
      `
        ${HOUSING_OFFICER_APPLICATION_SELECT}
        WHERE application.id = $1
      `,
      [
        applicationId,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return mapHousingOfficerApplication(
    row,
  );
}

export async function updateHousingOfficerNotes(
  applicationId: string,
  input: UpdateOfficerNotesInput,
): Promise<HousingOfficerApplication | null> {
  const result =
    await pool.query<{ id: string }>(
      `
        UPDATE housing_applications
        SET
          officer_notes = $2,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [
        applicationId,
        input.officerNotes,
      ],
    );

  if (result.rows[0] === undefined) {
    return null;
  }

  return findHousingOfficerApplicationById(
    applicationId,
  );
}

export async function approveSubmittedApplication(
  applicationId: string,
  officerId: string,
): Promise<HousingOfficerApplication | null> {
  const result =
    await pool.query<{ id: string }>(
      `
        UPDATE housing_applications
        SET
          status = 'APPROVED',
          approved_at = NOW(),
          approved_by = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'SUBMITTED'
        RETURNING id
      `,
      [
        applicationId,
        officerId,
      ],
    );

  if (result.rows[0] === undefined) {
    return null;
  }

  return findHousingOfficerApplicationById(
    applicationId,
  );
}

export async function cancelPreAssignmentApplication(
  applicationId: string,
  cancelledBy: string,
): Promise<boolean> {
  const result =
    await pool.query(
      `
        UPDATE housing_applications
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          cancelled_by = $2,
          updated_at = NOW()
        WHERE id = $1
          AND status IN (
            'DRAFT',
            'SUBMITTED',
            'APPROVED'
          )
      `,
      [
        applicationId,
        cancelledBy,
      ],
    );

  return (
    result.rowCount !== null
    && result.rowCount > 0
  );
}