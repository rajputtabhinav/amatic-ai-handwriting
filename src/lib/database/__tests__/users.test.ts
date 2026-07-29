import { getUserByClerkId, createUser, updateUserSubscription } from '../users';

// Mock Supabase
jest.mock('../../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-uuid',
              clerk_user_id: 'clerk_123',
              email: 'test@example.com',
              subscription_status: 'free'
            },
            error: null
          }))
        }))
      }))
    }))
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: {
              id: 'test-uuid',
              clerk_user_id: 'clerk_123',
              email: 'test@example.com',
              subscription_status: 'free'
            },
            error: null 
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: {
              id: 'new-uuid',
              clerk_user_id: 'clerk_456',
              email: 'new@example.com'
            },
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: {
                id: 'test-uuid',
                subscription_status: 'active'
              },
              error: null 
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('User Database Operations', () => {
  it('should get user by Clerk ID', async () => {
    const user = await getUserByClerkId('clerk_123');
    expect(user).toBeDefined();
    expect(user?.clerk_user_id).toBe('clerk_123');
  });

  it('should create new user', async () => {
    const userData = {
      clerk_user_id: 'clerk_456',
      email: 'new@example.com',
      full_name: 'Test User'
    };
    
    const user = await createUser(userData);
    expect(user).toBeDefined();
    expect(user?.email).toBe('new@example.com');
  });

  it('should update user subscription', async () => {
    const updates = {
      subscription_status: 'active'
    };
    
    const updated = await updateUserSubscription('test-uuid', updates);
    expect(updated).toBe(true);
  });
});

