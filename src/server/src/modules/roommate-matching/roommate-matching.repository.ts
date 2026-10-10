import {
  pool,
} from '../../db/pool.js';

import type {
  AcademicStatus,
  Gender,
  GraduationSemester,
} from '../student-profile/student-profile.types.js';

import type {
  CreateRoommateRequestInput,
  RoommatePriority,
  RoommateProfile,
  RoommateProfileInput,
  RoommateRequest,
  RoommateRequestStatus,
  RoommateStudentEligibility,
  RoommateStudentSummary,
} from './roommate-matching.types.js';

interface RoommateProfileRow {
  student_id: string;
  opted_in: boolean;
  sleep_schedule: number;
  wake_schedule: number;
  cleanliness: number;
  study_environment: number;
  noise_tolerance: number;
  social_preference: number;
  guest_frequency: number;
  room_use: number;
  sharing_preference: number;
  temperature_preference: number;
  communication_style: number;
  conflict_resolution: number;
  priority_1: RoommatePriority | null;
  priority_2: RoommatePriority | null;
  priority_3: RoommatePriority | null;
  about_me: string | null;
  looking_for: string | null;
  created_at: Date;
  updated_at: Date;
}

interface RoommateStudentRow {
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  academic_status: AcademicStatus;
  major: string;
  anticipated_graduation_semester:
    GraduationSemester | null;
  anticipated_graduation_year:
    number | null;
}

interface RoommateStudentEligibilityRow {
  student_id: string;
  gender: Gender;
}

interface RoommateRequestRow {
  id: string;
  academic_year: string;
  status: RoommateRequestStatus;

  requester_student_id: string;
  requester_student_number: string;
  requester_first_name: string;
  requester_last_name: string;
  requester_academic_status: AcademicStatus;
  requester_major: string;
  requester_graduation_semester:
    GraduationSemester | null;
  requester_graduation_year:
    number | null;

  requested_student_id: string;
  requested_student_number: string;
  requested_first_name: string;
  requested_last_name: string;
  requested_academic_status: AcademicStatus;
  requested_major: string;
  requested_graduation_semester:
    GraduationSemester | null;
  requested_graduation_year:
    number | null;

  responded_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapRoommateProfile(
  row: RoommateProfileRow,
): RoommateProfile {
  return {
    studentId: row.student_id,
    optedIn: row.opted_in,
    sleepSchedule: row.sleep_schedule,
    wakeSchedule: row.wake_schedule,
    cleanliness: row.cleanliness,
    studyEnvironment:
      row.study_environment,
    noiseTolerance:
      row.noise_tolerance,
    socialPreference:
      row.social_preference,
    guestFrequency:
      row.guest_frequency,
    roomUse: row.room_use,
    sharingPreference:
      row.sharing_preference,
    temperaturePreference:
      row.temperature_preference,
    communicationStyle:
      row.communication_style,
    conflictResolution:
      row.conflict_resolution,
    priority1: row.priority_1,
    priority2: row.priority_2,
    priority3: row.priority_3,
    aboutMe: row.about_me,
    lookingFor: row.looking_for,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoommateStudent(
  row: RoommateStudentRow,
): RoommateStudentSummary {
  return {
    studentId: row.student_id,
    studentNumber:
      row.student_number,
    firstName: row.first_name,
    lastName: row.last_name,
    academicStatus:
      row.academic_status,
    major: row.major,
    anticipatedGraduationSemester:
      row.anticipated_graduation_semester,
    anticipatedGraduationYear:
      row.anticipated_graduation_year,
  };
}

function mapRoommateRequest(
  row: RoommateRequestRow,
): RoommateRequest {
  return {
    id: row.id,
    academicYear:
      row.academic_year,
    status: row.status,
    requester: {
      studentId:
        row.requester_student_id,
      studentNumber:
        row.requester_student_number,
      firstName:
        row.requester_first_name,
      lastName:
        row.requester_last_name,
      academicStatus:
        row.requester_academic_status,
      major:
        row.requester_major,
      anticipatedGraduationSemester:
        row.requester_graduation_semester,
      anticipatedGraduationYear:
        row.requester_graduation_year,
    },
    requested: {
      studentId:
        row.requested_student_id,
      studentNumber:
        row.requested_student_number,
      firstName:
        row.requested_first_name,
      lastName:
        row.requested_last_name,
      academicStatus:
        row.requested_academic_status,
      major:
        row.requested_major,
      anticipatedGraduationSemester:
        row.requested_graduation_semester,
      anticipatedGraduationYear:
        row.requested_graduation_year,
    },
    respondedAt:
      row.responded_at,
    cancelledAt:
      row.cancelled_at,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}

const ROOMMATE_STUDENT_SELECT = `
  SELECT
    profile.user_id AS student_id,
    profile.student_number,
    profile.first_name,
    profile.last_name,
    profile.academic_status,
    profile.major,
    profile.anticipated_graduation_semester,
    profile.anticipated_graduation_year
  FROM student_profiles profile
  JOIN users user_record
    ON user_record.id = profile.user_id
  WHERE user_record.role = 'STUDENT'
`;

const ROOMMATE_REQUEST_SELECT = `
  SELECT
    request.id,
    request.academic_year,
    request.status,

    requester.user_id
      AS requester_student_id,
    requester.student_number
      AS requester_student_number,
    requester.first_name
      AS requester_first_name,
    requester.last_name
      AS requester_last_name,
    requester.academic_status
      AS requester_academic_status,
    requester.major
      AS requester_major,
    requester.anticipated_graduation_semester
      AS requester_graduation_semester,
    requester.anticipated_graduation_year
      AS requester_graduation_year,

    requested.user_id
      AS requested_student_id,
    requested.student_number
      AS requested_student_number,
    requested.first_name
      AS requested_first_name,
    requested.last_name
      AS requested_last_name,
    requested.academic_status
      AS requested_academic_status,
    requested.major
      AS requested_major,
    requested.anticipated_graduation_semester
      AS requested_graduation_semester,
    requested.anticipated_graduation_year
      AS requested_graduation_year,

    request.responded_at,
    request.cancelled_at,
    request.created_at,
    request.updated_at
  FROM roommate_requests request
  JOIN student_profiles requester
    ON requester.user_id =
      request.requester_student_id
  JOIN student_profiles requested
    ON requested.user_id =
      request.requested_student_id
`;

export async function findRoommateProfileByStudentId(
  studentId: string,
): Promise<RoommateProfile | null> {
  const result =
    await pool.query<RoommateProfileRow>(
      `
        SELECT
          student_id,
          opted_in,
          sleep_schedule,
          wake_schedule,
          cleanliness,
          study_environment,
          noise_tolerance,
          social_preference,
          guest_frequency,
          room_use,
          sharing_preference,
          temperature_preference,
          communication_style,
          conflict_resolution,
          priority_1,
          priority_2,
          priority_3,
          about_me,
          looking_for,
          created_at,
          updated_at
        FROM roommate_profiles
        WHERE student_id = $1
      `,
      [
        studentId,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return mapRoommateProfile(
    row,
  );
}

export async function upsertRoommateProfile(
  studentId: string,
  input: RoommateProfileInput,
): Promise<RoommateProfile> {
  const result =
    await pool.query<RoommateProfileRow>(
      `
        INSERT INTO roommate_profiles (
          student_id,
          opted_in,
          sleep_schedule,
          wake_schedule,
          cleanliness,
          study_environment,
          noise_tolerance,
          social_preference,
          guest_frequency,
          room_use,
          sharing_preference,
          temperature_preference,
          communication_style,
          conflict_resolution,
          priority_1,
          priority_2,
          priority_3,
          about_me,
          looking_for
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          $18,
          $19
        )
        ON CONFLICT (student_id)
        DO UPDATE
        SET
          opted_in = EXCLUDED.opted_in,
          sleep_schedule = EXCLUDED.sleep_schedule,
          wake_schedule = EXCLUDED.wake_schedule,
          cleanliness = EXCLUDED.cleanliness,
          study_environment = EXCLUDED.study_environment,
          noise_tolerance = EXCLUDED.noise_tolerance,
          social_preference = EXCLUDED.social_preference,
          guest_frequency = EXCLUDED.guest_frequency,
          room_use = EXCLUDED.room_use,
          sharing_preference = EXCLUDED.sharing_preference,
          temperature_preference = EXCLUDED.temperature_preference,
          communication_style = EXCLUDED.communication_style,
          conflict_resolution = EXCLUDED.conflict_resolution,
          priority_1 = EXCLUDED.priority_1,
          priority_2 = EXCLUDED.priority_2,
          priority_3 = EXCLUDED.priority_3,
          about_me = EXCLUDED.about_me,
          looking_for = EXCLUDED.looking_for,
          updated_at = NOW()
        RETURNING
          student_id,
          opted_in,
          sleep_schedule,
          wake_schedule,
          cleanliness,
          study_environment,
          noise_tolerance,
          social_preference,
          guest_frequency,
          room_use,
          sharing_preference,
          temperature_preference,
          communication_style,
          conflict_resolution,
          priority_1,
          priority_2,
          priority_3,
          about_me,
          looking_for,
          created_at,
          updated_at
      `,
      [
        studentId,
        input.optedIn,
        input.sleepSchedule,
        input.wakeSchedule,
        input.cleanliness,
        input.studyEnvironment,
        input.noiseTolerance,
        input.socialPreference,
        input.guestFrequency,
        input.roomUse,
        input.sharingPreference,
        input.temperaturePreference,
        input.communicationStyle,
        input.conflictResolution,
        input.priority1,
        input.priority2,
        input.priority3,
        input.aboutMe,
        input.lookingFor,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    throw new Error(
      'Roommate profile upsert did not return a row.',
    );
  }

  return mapRoommateProfile(
    row,
  );
}

export async function findRoommateStudentEligibilityById(
  studentId: string,
): Promise<RoommateStudentEligibility | null> {
  const result =
    await pool.query<RoommateStudentEligibilityRow>(
      `
        SELECT
          profile.user_id AS student_id,
          profile.gender
        FROM student_profiles profile
        JOIN users user_record
          ON user_record.id = profile.user_id
        WHERE profile.user_id = $1
          AND user_record.role = 'STUDENT'
      `,
      [
        studentId,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return {
    studentId: row.student_id,
    gender: row.gender,
  };
}

export async function searchRoommateStudents(
  currentStudentId: string,
  gender: Gender,
  searchTerm: string,
): Promise<RoommateStudentSummary[]> {
  const result =
    await pool.query<RoommateStudentRow>(
      `
        ${ROOMMATE_STUDENT_SELECT}
          AND profile.user_id <> $1
          AND profile.gender = $2
          AND (
            POSITION(
              LOWER($3)
              IN LOWER(profile.student_number)
            ) > 0
            OR POSITION(
              LOWER($3)
              IN LOWER(profile.first_name)
            ) > 0
            OR POSITION(
              LOWER($3)
              IN LOWER(profile.last_name)
            ) > 0
            OR POSITION(
              LOWER($3)
              IN LOWER(
                profile.first_name
                || ' '
                || profile.last_name
              )
            ) > 0
          )
        ORDER BY
          CASE
            WHEN LOWER(profile.student_number)
              = LOWER($3)
              THEN 0
            ELSE 1
          END,
          profile.last_name,
          profile.first_name,
          profile.user_id
        LIMIT 20
      `,
      [
        currentStudentId,
        gender,
        searchTerm,
      ],
    );

  return result.rows.map(
    mapRoommateStudent,
  );
}

export async function findRoommateRequestsForStudent(
  studentId: string,
): Promise<RoommateRequest[]> {
  const result =
    await pool.query<RoommateRequestRow>(
      `
        ${ROOMMATE_REQUEST_SELECT}
        WHERE
          request.requester_student_id = $1
          OR request.requested_student_id = $1
        ORDER BY
          request.created_at DESC,
          request.id DESC
      `,
      [
        studentId,
      ],
    );

  return result.rows.map(
    mapRoommateRequest,
  );
}

export async function findRoommateRequestByIdForStudent(
  requestId: string,
  studentId: string,
): Promise<RoommateRequest | null> {
  const result =
    await pool.query<RoommateRequestRow>(
      `
        ${ROOMMATE_REQUEST_SELECT}
        WHERE request.id = $1
          AND (
            request.requester_student_id = $2
            OR request.requested_student_id = $2
          )
      `,
      [
        requestId,
        studentId,
      ],
    );

  const row =
    result.rows[0];

  if (row === undefined) {
    return null;
  }

  return mapRoommateRequest(
    row,
  );
}

export async function insertRoommateRequest(
  requesterStudentId: string,
  input: CreateRoommateRequestInput,
): Promise<RoommateRequest> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO roommate_requests (
          requester_student_id,
          requested_student_id,
          academic_year,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          'PENDING'
        )
        RETURNING id
      `,
      [
        requesterStudentId,
        input.requestedStudentId,
        input.academicYear,
      ],
    );

  const requestId =
    result.rows[0]?.id;

  if (requestId === undefined) {
    throw new Error(
      'Roommate request insert did not return an id.',
    );
  }

  const roommateRequest =
    await findRoommateRequestByIdForStudent(
      requestId,
      requesterStudentId,
    );

  if (roommateRequest === null) {
    throw new Error(
      'Created roommate request could not be retrieved.',
    );
  }

  return roommateRequest;
}

export async function acceptPendingRoommateRequest(
  requestId: string,
  requestedStudentId: string,
): Promise<RoommateRequest | null> {
  const result =
    await pool.query<{ id: string }>(
      `
        UPDATE roommate_requests
        SET
          status = 'ACCEPTED',
          responded_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND requested_student_id = $2
          AND status = 'PENDING'
        RETURNING id
      `,
      [
        requestId,
        requestedStudentId,
      ],
    );

  if (result.rows[0] === undefined) {
    return null;
  }

  return findRoommateRequestByIdForStudent(
    requestId,
    requestedStudentId,
  );
}

export async function declinePendingRoommateRequest(
  requestId: string,
  requestedStudentId: string,
): Promise<RoommateRequest | null> {
  const result =
    await pool.query<{ id: string }>(
      `
        UPDATE roommate_requests
        SET
          status = 'DECLINED',
          responded_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND requested_student_id = $2
          AND status = 'PENDING'
        RETURNING id
      `,
      [
        requestId,
        requestedStudentId,
      ],
    );

  if (result.rows[0] === undefined) {
    return null;
  }

  return findRoommateRequestByIdForStudent(
    requestId,
    requestedStudentId,
  );
}

export async function cancelPendingRoommateRequest(
  requestId: string,
  requesterStudentId: string,
): Promise<RoommateRequest | null> {
  const result =
    await pool.query<{ id: string }>(
      `
        UPDATE roommate_requests
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND requester_student_id = $2
          AND status = 'PENDING'
        RETURNING id
      `,
      [
        requestId,
        requesterStudentId,
      ],
    );

  if (result.rows[0] === undefined) {
    return null;
  }

  return findRoommateRequestByIdForStudent(
    requestId,
    requesterStudentId,
  );
}