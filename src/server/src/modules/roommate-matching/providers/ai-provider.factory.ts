import {
  environment,
} from '../../../config/environment.js';

import type {
  AICompatibilityProvider,
} from './ai-compatibility.provider.js';

import {
  FallbackAICompatibilityProvider,
} from './fallback-ai.provider.js';

import {
  MockAICompatibilityProvider,
} from './mock-ai.provider.js';

import {
  RemoteAICompatibilityProvider,
} from './remote-ai.provider.js';

export function createAICompatibilityProvider():
AICompatibilityProvider {
  const mockProvider =
    new MockAICompatibilityProvider();

  if (
    environment.ai.provider
    === 'mock'
  ) {
    return mockProvider;
  }

  const remoteConfigured =
    environment.ai.baseUrl !== ''
    && environment.ai.model !== ''
    && environment.ai.apiKey !== '';

  if (!remoteConfigured) {
    return new FallbackAICompatibilityProvider(
      null,
      mockProvider,
    );
  }

  const remoteProvider =
    new RemoteAICompatibilityProvider({
      baseUrl:
        environment.ai.baseUrl,

      model:
        environment.ai.model,

      apiKey:
        environment.ai.apiKey,

      maxTokens:
        environment.ai.maxTokens,

      timeoutMs:
        environment.ai.timeoutMs,
    });

  return new FallbackAICompatibilityProvider(
    remoteProvider,
    mockProvider,
  );
}