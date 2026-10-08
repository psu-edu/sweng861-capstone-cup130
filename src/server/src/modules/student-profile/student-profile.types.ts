export const GENDERS = [
  'MALE',
  'FEMALE',
  'UNSPECIFIED',
] as const;

export type Gender =
  (typeof GENDERS)[number];

export const ACADEMIC_STATUSES = [
  'FRESHMAN',
  'SOPHOMORE',
  'JUNIOR',
  'SENIOR',
  'GRADUATE',
] as const;

export type AcademicStatus =
  (typeof ACADEMIC_STATUSES)[number];

export const GRADUATION_SEMESTERS = [
  'SPRING',
  'SUMMER',
  'FALL',
] as const;

export type GraduationSemester =
  (typeof GRADUATION_SEMESTERS)[number];

export interface StudentProfile {
  userId: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  academicStatus: AcademicStatus;
  major: string;
  anticipatedGraduationSemester:
    GraduationSemester | null;
  anticipatedGraduationYear:
    number | null;
}

export interface UpdateStudentProfileInput {
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  academicStatus: AcademicStatus;
  major: string;
  anticipatedGraduationSemester:
    GraduationSemester | null;
  anticipatedGraduationYear:
    number | null;
}