import { isFeatureEnabled } from '../env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Feature Flags', () => {
    it('should detect AI feature when API keys are present', () => {
      process.env.OPENAI_API_KEY = 'sk-test123';
      const enabled = isFeatureEnabled('ai');
      expect(enabled).toBe(true);
    });

    it('should detect visual AI when OpenRouter is configured', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-test123';
      const enabled = isFeatureEnabled('visual-ai');
      expect(enabled).toBe(true);
    });

    it('should detect voice feature when ElevenLabs is configured', () => {
      process.env.ELEVENLABS_API_KEY = 'test-key';
      const enabled = isFeatureEnabled('voice');
      expect(enabled).toBe(true);
    });

    it('should detect Redis when Upstash is configured', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      const enabled = isFeatureEnabled('redis');
      expect(enabled).toBe(true);
    });

    it('should return false when feature not configured', () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      const enabled = isFeatureEnabled('ai');
      expect(enabled).toBe(false);
    });
  });
});

