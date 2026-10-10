import type {
  AICompatibilityInput,
  AICompatibilityProvider,
  AICompatibilityResult,
} from './ai-compatibility.provider.js';

export class FallbackAICompatibilityProvider
implements AICompatibilityProvider {
  private primaryUnavailable:
    boolean;

  constructor(
    private readonly primary:
      AICompatibilityProvider | null,

    private readonly fallback:
      AICompatibilityProvider,
  ) {
    this.primaryUnavailable =
      primary === null;
  }

  private async useFallback(
    input: AICompatibilityInput,
  ): Promise<AICompatibilityResult> {
    const result =
      await this.fallback.analyze(
        input,
      );

    return {
      ...result,
      source:
        'FALLBACK',
    };
  }

  async analyze(
    input: AICompatibilityInput,
  ): Promise<AICompatibilityResult> {
    if (
      this.primaryUnavailable
      || this.primary === null
    ) {
      return this.useFallback(
        input,
      );
    }

    try {
      return await this.primary.analyze(
        input,
      );
    } catch {
      this.primaryUnavailable =
        true;

      return this.useFallback(
        input,
      );
    }
  }
}