import type {
  AICompatibilityInput,
  AICompatibilityProvider,
  AICompatibilityResult,
} from './ai-compatibility.provider.js';

interface LifestyleTheme {
  label: string;
  keywords: string[];
}

const LIFESTYLE_THEMES:
LifestyleTheme[] = [
  {
    label: 'quiet shared space',
    keywords: [
      'quiet',
      'calm',
      'noise',
    ],
  },
  {
    label: 'cleanliness',
    keywords: [
      'clean',
      'cleanliness',
      'organized',
      'organised',
      'tidy',
    ],
  },
  {
    label: 'study habits',
    keywords: [
      'study',
      'studying',
      'coursework',
      'schoolwork',
    ],
  },
  {
    label: 'social style',
    keywords: [
      'social',
      'friends',
      'outgoing',
      'activities',
    ],
  },
  {
    label: 'guest expectations',
    keywords: [
      'guest',
      'guests',
      'visitor',
      'visitors',
    ],
  },
  {
    label: 'communication',
    keywords: [
      'communicate',
      'communication',
      'direct',
      'respectful',
    ],
  },
  {
    label: 'shared belongings',
    keywords: [
      'share',
      'sharing',
      'belongings',
    ],
  },
  {
    label: 'sleep schedule',
    keywords: [
      'sleep',
      'bedtime',
      'wake',
      'morning',
      'night',
    ],
  },
  {
    label: 'temperature',
    keywords: [
      'temperature',
      'warm',
      'cool',
      'cold',
    ],
  },
];

function buildProfileText(
  input: {
    aboutMe: string | null;
    lookingFor: string | null;
  },
): string {
  return [
    input.aboutMe,
    input.lookingFor,
  ]
    .filter(
      (
        value,
      ): value is string =>
        value !== null,
    )
    .join(' ')
    .toLowerCase();
}

function detectLifestyleThemes(
  input: {
    aboutMe: string | null;
    lookingFor: string | null;
  },
): Set<string> {
  const text =
    buildProfileText(
      input,
    );

  const themes =
    new Set<string>();

  for (
    const theme
    of LIFESTYLE_THEMES
  ) {
    if (
      theme.keywords.some(
        (keyword) =>
          text.includes(
            keyword,
          ),
      )
    ) {
      themes.add(
        theme.label,
      );
    }
  }

  return themes;
}

function intersection(
  first: Set<string>,
  second: Set<string>,
): string[] {
  return [
    ...first,
  ].filter(
    (value) =>
      second.has(value),
  );
}

function symmetricDifference(
  first: Set<string>,
  second: Set<string>,
): string[] {
  return [
    ...new Set([
      ...first,
      ...second,
    ]),
  ].filter(
    (value) =>
      first.has(value)
      !== second.has(value),
  );
}

function calculateSemanticScore(
  first: Set<string>,
  second: Set<string>,
): number {
  const union =
    new Set([
      ...first,
      ...second,
    ]);

  if (union.size === 0) {
    return 50;
  }

  const sharedCount =
    intersection(
      first,
      second,
    ).length;

  const overlap =
    sharedCount
    / union.size;

  return Math.round(
    40
    + overlap * 60,
  );
}

function buildExplanation(
  score: number,
  hasThemes: boolean,
): string {
  if (!hasThemes) {
    return (
      'There is not enough roommate-lifestyle detail in the free-text profiles for a strong semantic comparison.'
    );
  }

  if (score >= 80) {
    return (
      'The free-text profiles share several roommate-lifestyle themes.'
    );
  }

  if (score >= 60) {
    return (
      'The free-text profiles share some roommate-lifestyle themes while emphasizing different details.'
    );
  }

  return (
    'The free-text profiles emphasize different roommate-lifestyle themes.'
  );
}

export class MockAICompatibilityProvider
implements AICompatibilityProvider {
  async analyze(
    input: AICompatibilityInput,
  ): Promise<AICompatibilityResult> {
    const studentThemes =
      detectLifestyleThemes(
        input.student,
      );

    const candidateThemes =
      detectLifestyleThemes(
        input.candidate,
      );

    const sharedThemes =
      intersection(
        studentThemes,
        candidateThemes,
      )
        .sort()
        .slice(0, 3);

    const differingThemes =
      symmetricDifference(
        studentThemes,
        candidateThemes,
      )
        .sort()
        .slice(0, 2);

    const semanticScore =
      calculateSemanticScore(
        studentThemes,
        candidateThemes,
      );

    const strengths =
      sharedThemes.length === 0
        ? []
        : [
            `Shared free-text themes include ${sharedThemes.join(', ')}.`,
          ];

    const differences =
      differingThemes.length === 0
        ? []
        : [
            `Free-text emphasis differs around ${differingThemes.join(', ')}.`,
          ];

    return {
      semanticScore,

      strengths,

      differences,

      explanation:
        buildExplanation(
          semanticScore,
          studentThemes.size > 0
          || candidateThemes.size > 0,
        ),

      source:
        'MOCK',
    };
  }
}