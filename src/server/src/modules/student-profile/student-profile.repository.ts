import {
  pool,
} from '../../db/pool.js';

import type {
  AcademicStatus,
  Gender,
  GraduationSemester,
  StudentProfile,
  UpdateStudentProfileInput,
} from './student-profile.types.js';

interface StudentProfileRow {
  user_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  academic_status: AcademicStatus;
  major: string;
  anticipated_graduation_semester:
    GraduationSemester | null;
  anticipated_graduation_year:
    number | null;
}

function mapStudentProfile(
  row: StudentProfileRow,
): StudentProfile {
  return {
    userId: row.user_id,
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
  };
}

export async function findStudentProfileByUserId(
  userId: string,
): Promise<StudentProfile | null> {
  const result =
    await pool.query<StudentProfileRow>(
      `
        SELECT
          user_id,
          student_number,
          first_name,
          last_name,
          gender,
          academic_status,
          major,
          anticipated_graduation_semester,
          anticipated_graduation_year
        FROM student_profiles
        WHERE user_id = $1
      `,
      [
        userId,
      ],
    );

  const row = result.rows[0];

  if (row === undefined) {
    return null;
  }

  return mapStudentProfile(row);
}

export async function updateStudentProfileByUserId(
  userId: string,
  input: UpdateStudentProfileInput,
): Promise<StudentProfile | null> {
  const result =
    await pool.query<StudentProfileRow>(
      `
        UPDATE student_profiles
        SET
          student_number = $2,
          first_name = $3,
          last_name = $4,
          gender = $5,
          academic_status = $6,
          major = $7,
          anticipated_graduation_semester = $8,
          anticipated_graduation_year = $9,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING
          user_id,
          student_number,
          first_name,
          last_name,
          gender,
          academic_status,
          major,
          anticipated_graduation_semester,
          anticipated_graduation_year
      `,
      [
        userId,
        input.studentNumber,
        input.firstName,
        input.lastName,
        input.gender,
        input.academicStatus,
        input.major,
        input.anticipatedGraduationSemester,
        input.anticipatedGraduationYear,
      ],
    );

  const row = result.rows[0];

  if (row === undefined) {
    return null;
  }

  return mapStudentProfile(row);
}