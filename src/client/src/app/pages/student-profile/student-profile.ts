import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  StudentProfileApi,
  type AcademicStatus,
  type Gender,
  type GraduationSemester,
  type UpdateStudentProfile,
} from '../../core/services/student-profile-api';

@Component({
  selector: 'app-student-profile',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css',
})
export class StudentProfilePage
implements OnInit {
  private readonly profileApi =
    inject(StudentProfileApi);

  protected readonly loading =
    signal(true);

  protected readonly saving =
    signal(false);

  protected readonly message =
    signal<string | null>(null);

  protected readonly error =
    signal<string | null>(null);

  protected readonly loadError =
    signal<string | null>(null);

  protected readonly form =
    new FormGroup({
      studentNumber:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(30),
            ],
          },
        ),

      firstName:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(100),
            ],
          },
        ),

      lastName:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(100),
            ],
          },
        ),

      gender:
        new FormControl<Gender>(
          'UNSPECIFIED',
          {
            nonNullable: true,
            validators: [
              Validators.required,
            ],
          },
        ),

      academicStatus:
        new FormControl<AcademicStatus>(
          'FRESHMAN',
          {
            nonNullable: true,
            validators: [
              Validators.required,
            ],
          },
        ),

      major:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(150),
            ],
          },
        ),

      anticipatedGraduationSemester:
        new FormControl<
          GraduationSemester | null
        >(null),

      anticipatedGraduationYear:
        new FormControl<number | null>(
          null,
        ),
    });

  ngOnInit(): void {
    this.loadProfile();
  }

  protected save(): void {
    this.message.set(null);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.error.set(
        'Please correct the highlighted profile fields.',
      );

      return;
    }

    const value =
      this.form.getRawValue();

    const update:
      UpdateStudentProfile = {
        studentNumber:
          value.studentNumber,
        firstName:
          value.firstName,
        lastName:
          value.lastName,
        gender:
          value.gender,
        academicStatus:
          value.academicStatus,
        major:
          value.major,
        anticipatedGraduationSemester:
          value.anticipatedGraduationSemester,
        anticipatedGraduationYear:
          value.anticipatedGraduationYear,
      };

    this.saving.set(true);

    this.profileApi
      .updateProfile(update)
      .subscribe({
        next: (response) => {
          this.form.patchValue(
            response.profile,
          );

          this.saving.set(false);

          this.message.set(
            'Profile saved successfully.',
          );
        },

        error: (error: HttpErrorResponse) => {
          this.saving.set(false);

          this.error.set(
            this.getErrorMessage(error),
          );
        },
      });
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.profileApi
      .getProfile()
      .subscribe({
        next: (response) => {
          this.form.patchValue(
            response.profile,
          );

          this.loading.set(false);
        },

        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
        
          this.loadError.set(
            this.getErrorMessage(error),
          );
        },
      });
  }

  private getErrorMessage(
    error: HttpErrorResponse,
  ): string {
    const apiMessage =
      error.error?.message;

    if (
      typeof apiMessage === 'string'
      && apiMessage.trim() !== ''
    ) {
      return apiMessage;
    }

    return 'Unable to save the student profile.';
  }
}