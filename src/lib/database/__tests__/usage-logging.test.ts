import { checkUsageLimits } from '../usage-logging';

// Mock Supabase
jest.mock('../../supabase', () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: table === 'usage_limits'
                ? {
                    user_id: 'user-id',
                    month_year: new Date().toISOString().slice(0, 7),
                    chat_messages_count: 10,
                    handwriting_count: 50
                  }
                : {
                    subscription_plan: 'starter',
                    subscription_status: 'active'
                  },
              error: null
            }))
          })),
          single: jest.fn(() => Promise.resolve({
            data: {
              subscription_plan: 'starter',
              subscription_status: 'active'
            },
            error: null
          }))
        }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({
      data: {
        currentMonth: { chat: 10, handwriting: 50 }
      },
      error: null
    }))
  }
}));

describe('Usage Logging', () => {
  describe('Check Usage Limits', () => {
    it('should allow usage within limits', async () => {
      const result = await checkUsageLimits('user-id', 'chat');
      expect(result.allowed).toBe(true);
      expect(result.plan).toBe('starter');
    });

    it('should have correct limit for starter plan', async () => {
      const result = await checkUsageLimits('user-id', 'chat');
      expect(result.limit).toBe(50);
    });
  });
});

