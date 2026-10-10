import {
  HttpErrorResponse,
} from '@angular/common/http';

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
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import {
  RoommateMatchingApi,
  type RoommatePriority,
  type RoommateProfile,
  type RoommateProfileInput,
} from '../../core/services/roommate-matching-api';

type PreferenceControlName =
  | 'sleepSchedule'
  | 'wakeSchedule'
  | 'cleanliness'
  | 'studyEnvironment'
  | 'noiseTolerance'
  | 'socialPreference'
  | 'guestFrequency'
  | 'roomUse'
  | 'sharingPreference'
  | 'temperaturePreference'
  | 'communicationStyle'
  | 'conflictResolution';

interface PreferenceDefinition {
  control:
    PreferenceControlName;

  label:
    string;

  lowLabel:
    string;

  highLabel:
    string;
}

interface PriorityOption {
  value:
    RoommatePriority;

  label:
    string;
}

const PREFERENCE_FIELDS:
readonly PreferenceDefinition[] = [
  {
    control:
      'sleepSchedule',
    label:
      'Sleep Schedule',
    lowLabel:
      'Earlier bedtime',
    highLabel:
      'Later bedtime',
  },
  {
    control:
      'wakeSchedule',
    label:
      'Wake Schedule',
    lowLabel:
      'Earlier wake time',
    highLabel:
      'Later wake time',
  },
  {
    control:
      'cleanliness',
    label:
      'Cleanliness',
    lowLabel:
      'Relaxed',
    highLabel:
      'Very tidy',
  },
  {
    control:
      'studyEnvironment',
    label:
      'Study Environment',
    lowLabel:
      'Casual / flexible',
    highLabel:
      'Quiet / focused',
  },
  {
    control:
      'noiseTolerance',
    label:
      'Noise Tolerance',
    lowLabel:
      'Prefer quiet',
    highLabel:
      'Comfortable with noise',
  },
  {
    control:
      'socialPreference',
    label:
      'Social Preference',
    lowLabel:
      'More private',
    highLabel:
      'Very social',
  },
  {
    control:
      'guestFrequency',
    label:
      'Guest Frequency',
    lowLabel:
      'Rare guests',
    highLabel:
      'Frequent guests',
  },
  {
    control:
      'roomUse',
    label:
      'Typical Room Use',
    lowLabel:
      'Mostly sleep',
    highLabel:
      'Spend a lot of time there',
  },
  {
    control:
      'sharingPreference',
    label:
      'Shared Belongings',
    lowLabel:
      'Keep belongings separate',
    highLabel:
      'Comfortable sharing',
  },
  {
    control:
      'temperaturePreference',
    label:
      'Temperature Preference',
    lowLabel:
      'Cooler room',
    highLabel:
      'Warmer room',
  },
  {
    control:
      'communicationStyle',
    label:
      'Communication Style',
    lowLabel:
      'Reserved',
    highLabel:
      'Very direct',
  },
  {
    control:
      'conflictResolution',
    label:
      'Conflict Resolution',
    lowLabel:
      'Need time first',
    highLabel:
      'Address issues quickly',
  },
];

const PRIORITY_OPTIONS:
readonly PriorityOption[] = [
  {
    value:
      'SLEEP_SCHEDULE',
    label:
      'Sleep Schedule',
  },
  {
    value:
      'WAKE_SCHEDULE',
    label:
      'Wake Schedule',
  },
  {
    value:
      'CLEANLINESS',
    label:
      'Cleanliness',
  },
  {
    value:
      'STUDY_ENVIRONMENT',
    label:
      'Study Environment',
  },
  {
    value:
      'NOISE_TOLERANCE',
    label:
      'Noise Tolerance',
  },
  {
    value:
      'SOCIAL_PREFERENCE',
    label:
      'Social Preference',
  },
  {
    value:
      'GUEST_FREQUENCY',
    label:
      'Guest Frequency',
  },
  {
    value:
      'ROOM_USE',
    label:
      'Room Use',
  },
  {
    value:
      'SHARING_PREFERENCE',
    label:
      'Shared Belongings',
  },
  {
    value:
      'TEMPERATURE',
    label:
      'Temperature',
  },
  {
    value:
      'COMMUNICATION_STYLE',
    label:
      'Communication Style',
  },
  {
    value:
      'CONFLICT_RESOLUTION',
    label:
      'Conflict Resolution',
  },
];

@Component({
  selector:
    'app-roommate-profile',

  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
  ],

  templateUrl:
    './roommate-profile.html',

  styleUrl:
    './roommate-profile.css',
})
export class RoommateProfilePage
implements OnInit {
  private readonly roommateApi =
    inject(RoommateMatchingApi);

  protected readonly loading =
    signal(true);

  protected readonly saving =
    signal(false);

  protected readonly loadError =
    signal<string | null>(
      null,
    );

  protected readonly error =
    signal<string | null>(
      null,
    );

  protected readonly message =
    signal<string | null>(
      null,
    );

  protected readonly preferenceFields =
    PREFERENCE_FIELDS;

  protected readonly priorityOptions =
    PRIORITY_OPTIONS;

  protected readonly scaleValues = [
    1,
    2,
    3,
    4,
    5,
  ];

  protected readonly form =
    new FormGroup({
      optedIn:
        new FormControl(
          false,
          {
            nonNullable:
              true,
          },
        ),

      sleepSchedule:
        this.preferenceControlValue(),

      wakeSchedule:
        this.preferenceControlValue(),

      cleanliness:
        this.preferenceControlValue(),

      studyEnvironment:
        this.preferenceControlValue(),

      noiseTolerance:
        this.preferenceControlValue(),

      socialPreference:
        this.preferenceControlValue(),

      guestFrequency:
        this.preferenceControlValue(),

      roomUse:
        this.preferenceControlValue(),

      sharingPreference:
        this.preferenceControlValue(),

      temperaturePreference:
        this.preferenceControlValue(),

      communicationStyle:
        this.preferenceControlValue(),

      conflictResolution:
        this.preferenceControlValue(),

      priority1:
        new FormControl<
          RoommatePriority | null
        >(null),

      priority2:
        new FormControl<
          RoommatePriority | null
        >(null),

      priority3:
        new FormControl<
          RoommatePriority | null
        >(null),

      aboutMe:
        new FormControl(
          '',
          {
            nonNullable:
              true,
          },
        ),

      lookingFor:
        new FormControl(
          '',
          {
            nonNullable:
              true,
          },
        ),
    });

  ngOnInit(): void {
    this.loadProfile();
  }

  protected preferenceControl(
    name:
      PreferenceControlName,
  ): FormControl<number> {
    return this.form.controls[
      name
    ];
  }

  protected save(): void {
    this.message.set(
      null,
    );

    this.error.set(
      null,
    );

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.error.set(
        'Please review the roommate profile fields before saving.',
      );

      return;
    }

    const value =
      this.form.getRawValue();

    const priorities =
      [
        value.priority1,
        value.priority2,
        value.priority3,
      ]
        .filter(
          (
            priority,
          ): priority is RoommatePriority =>
            priority !== null,
        );

    if (
      new Set(
        priorities,
      ).size
      !== priorities.length
    ) {
      this.error.set(
        'Choose a different preference for each priority.',
      );

      return;
    }

    const input:
      RoommateProfileInput = {
        optedIn:
          value.optedIn,

        sleepSchedule:
          value.sleepSchedule,

        wakeSchedule:
          value.wakeSchedule,

        cleanliness:
          value.cleanliness,

        studyEnvironment:
          value.studyEnvironment,

        noiseTolerance:
          value.noiseTolerance,

        socialPreference:
          value.socialPreference,

        guestFrequency:
          value.guestFrequency,

        roomUse:
          value.roomUse,

        sharingPreference:
          value.sharingPreference,

        temperaturePreference:
          value.temperaturePreference,

        communicationStyle:
          value.communicationStyle,

        conflictResolution:
          value.conflictResolution,

        priority1:
          value.priority1,

        priority2:
          value.priority2,

        priority3:
          value.priority3,

        aboutMe:
          this.optionalText(
            value.aboutMe,
          ),

        lookingFor:
          this.optionalText(
            value.lookingFor,
          ),
      };

    this.saving.set(
      true,
    );

    this.roommateApi
      .saveProfile(
        input,
      )
      .subscribe({
        next:
          (response) => {
            const profile =
              response.profile;

            if (
              profile !== null
            ) {
              this.patchProfile(
                profile,
              );
            }

            this.saving.set(
              false,
            );

            this.message.set(
              profile?.optedIn
                ? 'Roommate profile saved. AI-assisted discovery is enabled.'
                : 'Roommate profile saved. AI-assisted discovery is currently turned off.',
            );
          },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.saving.set(
              false,
            );

            this.error.set(
              this.getErrorMessage(
                error,
                'Unable to save your roommate profile.',
              ),
            );
          },
      });
  }

  private preferenceControlValue():
  FormControl<number> {
    return new FormControl(
      3,
      {
        nonNullable:
          true,

        validators: [
          Validators.min(
            1,
          ),
          Validators.max(
            5,
          ),
        ],
      },
    );
  }

  private loadProfile(): void {
    this.loading.set(
      true,
    );

    this.loadError.set(
      null,
    );

    this.roommateApi
      .getProfile()
      .subscribe({
        next:
          (response) => {
            if (
              response.profile
              !== null
            ) {
              this.patchProfile(
                response.profile,
              );
            }

            this.loading.set(
              false,
            );
          },

        error:
          (
            error:
              HttpErrorResponse,
          ) => {
            this.loading.set(
              false,
            );

            this.loadError.set(
              this.getErrorMessage(
                error,
                'Unable to load your roommate profile.',
              ),
            );
          },
      });
  }

private patchProfile(
  profile:
    RoommateProfile,
): void {
    this.form.patchValue({
      optedIn:
        profile.optedIn,

      sleepSchedule:
        profile.sleepSchedule,

      wakeSchedule:
        profile.wakeSchedule,

      cleanliness:
        profile.cleanliness,

      studyEnvironment:
        profile.studyEnvironment,

      noiseTolerance:
        profile.noiseTolerance,

      socialPreference:
        profile.socialPreference,

      guestFrequency:
        profile.guestFrequency,

      roomUse:
        profile.roomUse,

      sharingPreference:
        profile.sharingPreference,

      temperaturePreference:
        profile.temperaturePreference,

      communicationStyle:
        profile.communicationStyle,

      conflictResolution:
        profile.conflictResolution,

      priority1:
        profile.priority1,

      priority2:
        profile.priority2,

      priority3:
        profile.priority3,

      aboutMe:
        profile.aboutMe
        ?? '',

      lookingFor:
        profile.lookingFor
        ?? '',
    });
  }

  private optionalText(
    value: string,
  ): string | null {
    const trimmed =
      value.trim();

    return (
      trimmed === ''
        ? null
        : trimmed
    );
  }

  private getErrorMessage(
    error:
      HttpErrorResponse,

    fallback:
      string,
  ): string {
    const apiMessage =
      error.error?.message;

    if (
      typeof apiMessage
        === 'string'
      && apiMessage.trim()
        !== ''
    ) {
      return apiMessage;
    }

    return fallback;
  }
}