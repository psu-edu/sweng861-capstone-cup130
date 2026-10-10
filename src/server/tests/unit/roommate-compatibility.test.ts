import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  calculateStructuredCompatibility,
  combineCompatibilityScores,
  getCompatibilityCategory,
} from '../../src/modules/roommate-matching/roommate-compatibility.js';

import type {
  RoommateProfile,
} from '../../src/modules/roommate-matching/roommate-matching.types.js';

function createProfile(
  overrides:
    Partial<RoommateProfile> = {},
): RoommateProfile {
  return {
    studentId:
      '1',

    optedIn:
      true,

    sleepSchedule:
      3,

    wakeSchedule:
      3,

    cleanliness:
      3,

    studyEnvironment:
      3,

    noiseTolerance:
      3,

    socialPreference:
      3,

    guestFrequency:
      3,

    roomUse:
      3,

    sharingPreference:
      3,

    temperaturePreference:
      3,

    communicationStyle:
      3,

    conflictResolution:
      3,

    priority1:
      null,

    priority2:
      null,

    priority3:
      null,

    aboutMe:
      null,

    lookingFor:
      null,

    createdAt:
      new Date(0),

    updatedAt:
      new Date(0),

    ...overrides,
  };
}

describe(
  'roommate structured compatibility',
  () => {
    it(
      'scores identical structured preferences as 100 percent',
      () => {
        const first =
          createProfile({
            studentId:
              '1',
          });

        const second =
          createProfile({
            studentId:
              '2',
          });

        const result =
          calculateStructuredCompatibility(
            first,
            second,
          );

        expect(
          result.score,
        ).toBe(100);

        expect(
          result.strengths.length,
        ).toBeGreaterThan(0);

        expect(
          result.differences,
        ).toEqual([]);
      },
    );

    it(
      'scores opposite structured preferences lower',
      () => {
        const first =
          createProfile({
            studentId:
              '1',

            sleepSchedule:
              1,

            wakeSchedule:
              1,

            cleanliness:
              1,

            studyEnvironment:
              1,

            noiseTolerance:
              1,

            socialPreference:
              1,

            guestFrequency:
              1,

            roomUse:
              1,

            sharingPreference:
              1,

            temperaturePreference:
              1,

            communicationStyle:
              1,

            conflictResolution:
              1,
          });

        const second =
          createProfile({
            studentId:
              '2',

            sleepSchedule:
              5,

            wakeSchedule:
              5,

            cleanliness:
              5,

            studyEnvironment:
              5,

            noiseTolerance:
              5,

            socialPreference:
              5,

            guestFrequency:
              5,

            roomUse:
              5,

            sharingPreference:
              5,

            temperaturePreference:
              5,

            communicationStyle:
              5,

            conflictResolution:
              5,
          });

        const result =
          calculateStructuredCompatibility(
            first,
            second,
          );

        expect(
          result.score,
        ).toBe(0);

        expect(
          result.differences.length,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'gives a prioritized preference more influence on the structured score',
      () => {
        const firstWithoutPriority =
          createProfile({
            studentId:
              '1',
          });

        const firstWithPriority =
          createProfile({
            studentId:
              '1',

            priority1:
              'CLEANLINESS',
          });

        const candidate =
          createProfile({
            studentId:
              '2',

            cleanliness:
              5,
          });

        const ordinaryResult =
          calculateStructuredCompatibility(
            firstWithoutPriority,
            candidate,
          );

        const prioritizedResult =
          calculateStructuredCompatibility(
            firstWithPriority,
            candidate,
          );

        expect(
          prioritizedResult.score,
        ).toBeLessThan(
          ordinaryResult.score,
        );
      },
    );

    it(
      'uses structured scoring for 80 percent of the combined score',
      () => {
        expect(
          combineCompatibilityScores(
            80,
            50,
          ),
        ).toBe(74);
      },
    );

    it(
      'maps combined scores to understandable categories',
      () => {
        expect(
          getCompatibilityCategory(
            90,
          ),
        ).toBe(
          'EXCELLENT',
        );

        expect(
          getCompatibilityCategory(
            75,
          ),
        ).toBe(
          'STRONG',
        );

        expect(
          getCompatibilityCategory(
            60,
          ),
        ).toBe(
          'MODERATE',
        );

        expect(
          getCompatibilityCategory(
            40,
          ),
        ).toBe(
          'MIXED',
        );
      },
    );
  },
);