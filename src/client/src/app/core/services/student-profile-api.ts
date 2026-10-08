import {
  HttpClient,
} from '@angular/common/http';

import {
  inject,
  Injectable,
} from '@angular/core';

export type Gender =
  | 'MALE'
  | 'FEMALE'
  | 'UNSPECIFIED';

export type AcademicStatus =
  | 'FRESHMAN'
  | 'SOPHOMORE'
  | 'JUNIOR'
  | 'SENIOR'
  | 'GRADUATE';

export type GraduationSemester =
  | 'SPRING'
  | 'SUMMER'
  | 'FALL';

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

export interface UpdateStudentProfile {
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

interface StudentProfileResponse {
  profile: StudentProfile;
}

@Injectable({
  providedIn: 'root',
})
export class StudentProfileApi {
  private readonly http =
    inject(HttpClient);

  getProfile() {
    return this.http.get<StudentProfileResponse>(
      '/api/student/profile',
    );
  }

  updateProfile(
    profile: UpdateStudentProfile,
  ) {
    return this.http.put<StudentProfileResponse>(
      '/api/student/profile',
      profile,
    );
  }
}