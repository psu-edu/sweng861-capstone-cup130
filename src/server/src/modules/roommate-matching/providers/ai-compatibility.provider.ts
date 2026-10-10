import type {
  AIAnalysisSource,
} from '../roommate-matching.types.js';

export interface AITextProfile {
  aboutMe: string | null;
  lookingFor: string | null;
}

export interface AICompatibilityInput {
  student: AITextProfile;
  candidate: AITextProfile;
}

export interface AICompatibilityResult {
  semanticScore: number;
  strengths: string[];
  differences: string[];
  explanation: string;
  source: AIAnalysisSource;
}

export interface AICompatibilityProvider {
  analyze(
    input: AICompatibilityInput,
  ): Promise<AICompatibilityResult>;
}

export class AIProviderError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      'AIProviderError';
  }
}