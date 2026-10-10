import type {
  CompatibilityCategory,
  RoommatePriority,
  RoommateProfile,
} from './roommate-matching.types.js';

type PreferenceKey =
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

interface CompatibilityDimension {
  key: PreferenceKey;
  priority: RoommatePriority;
  label: string;
}

interface ScoredDimension {
  label: string;
  similarity: number;
  weight: number;
}

export interface StructuredCompatibilityResult {
  score: number;
  strengths: string[];
  differences: string[];
}

const DIMENSIONS:
CompatibilityDimension[] = [
  {
    key: 'sleepSchedule',
    priority: 'SLEEP_SCHEDULE',
    label: 'Sleep schedule',
  },
  {
    key: 'wakeSchedule',
    priority: 'WAKE_SCHEDULE',
    label: 'Wake schedule',
  },
  {
    key: 'cleanliness',
    priority: 'CLEANLINESS',
    label: 'Cleanliness',
  },
  {
    key: 'studyEnvironment',
    priority: 'STUDY_ENVIRONMENT',
    label: 'Study environment',
  },
  {
    key: 'noiseTolerance',
    priority: 'NOISE_TOLERANCE',
    label: 'Noise tolerance',
  },
  {
    key: 'socialPreference',
    priority: 'SOCIAL_PREFERENCE',
    label: 'Social preference',
  },
  {
    key: 'guestFrequency',
    priority: 'GUEST_FREQUENCY',
    label: 'Guest frequency',
  },
  {
    key: 'roomUse',
    priority: 'ROOM_USE',
    label: 'Room use',
  },
  {
    key: 'sharingPreference',
    priority: 'SHARING_PREFERENCE',
    label: 'Shared-belongings preference',
  },
  {
    key: 'temperaturePreference',
    priority: 'TEMPERATURE',
    label: 'Temperature preference',
  },
  {
    key: 'communicationStyle',
    priority: 'COMMUNICATION_STYLE',
    label: 'Communication style',
  },
  {
    key: 'conflictResolution',
    priority: 'CONFLICT_RESOLUTION',
    label: 'Conflict-resolution approach',
  },
];

function calculatePreferenceSimilarity(
  first: number,
  second: number,
): number {
  const difference =
    Math.abs(
      first - second,
    );

  return (
    100
    - difference * 25
  );
}

function getPriorityBonus(
  profile: RoommateProfile,
  priority: RoommatePriority,
): number {
  if (
    profile.priority1 === priority
  ) {
    return 2;
  }

  if (
    profile.priority2 === priority
  ) {
    return 1;
  }

  if (
    profile.priority3 === priority
  ) {
    return 0.5;
  }

  return 0;
}

function calculateDimensionWeight(
  first: RoommateProfile,
  second: RoommateProfile,
  priority: RoommatePriority,
): number {
  return (
    1
    + getPriorityBonus(
      first,
      priority,
    )
    + getPriorityBonus(
      second,
      priority,
    )
  );
}

function getStrengths(
  dimensions: ScoredDimension[],
): string[] {
  const ranked =
    [
      ...dimensions,
    ].sort(
      (first, second) =>
        second.similarity
          - first.similarity
        || second.weight
          - first.weight
        || first.label.localeCompare(
          second.label,
        ),
    );

  const strong =
    ranked.filter(
      (dimension) =>
        dimension.similarity >= 75,
    );

  const selected =
    strong.length > 0
      ? strong.slice(0, 3)
      : ranked.slice(0, 1);

  return selected.map(
    (dimension) =>
      `${dimension.label} preferences are closely aligned.`,
  );
}

function getDifferences(
  dimensions: ScoredDimension[],
): string[] {
  return [
    ...dimensions,
  ]
    .filter(
      (dimension) =>
        dimension.similarity <= 50,
    )
    .sort(
      (first, second) =>
        first.similarity
          - second.similarity
        || second.weight
          - first.weight
        || first.label.localeCompare(
          second.label,
        ),
    )
    .slice(0, 2)
    .map(
      (dimension) =>
        `${dimension.label} preferences differ noticeably.`,
    );
}

export function calculateStructuredCompatibility(
  first: RoommateProfile,
  second: RoommateProfile,
): StructuredCompatibilityResult {
  const dimensions =
    DIMENSIONS.map(
      (dimension):
      ScoredDimension => ({
        label:
          dimension.label,

        similarity:
          calculatePreferenceSimilarity(
            first[
              dimension.key
            ],
            second[
              dimension.key
            ],
          ),

        weight:
          calculateDimensionWeight(
            first,
            second,
            dimension.priority,
          ),
      }),
    );

  const totalWeight =
    dimensions.reduce(
      (
        sum,
        dimension,
      ) =>
        sum
        + dimension.weight,
      0,
    );

  const weightedTotal =
    dimensions.reduce(
      (
        sum,
        dimension,
      ) =>
        sum
        + dimension.similarity
          * dimension.weight,
      0,
    );

  const score =
    Math.round(
      weightedTotal
      / totalWeight,
    );

  return {
    score,

    strengths:
      getStrengths(
        dimensions,
      ),

    differences:
      getDifferences(
        dimensions,
      ),
  };
}

export function combineCompatibilityScores(
  structuredScore: number,
  semanticScore: number,
): number {
  return Math.round(
    structuredScore * 0.8
    + semanticScore * 0.2,
  );
}

export function getCompatibilityCategory(
  score: number,
): CompatibilityCategory {
  if (score >= 85) {
    return 'EXCELLENT';
  }

  if (score >= 70) {
    return 'STRONG';
  }

  if (score >= 55) {
    return 'MODERATE';
  }

  return 'MIXED';
}