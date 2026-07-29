import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/database/users';
import { checkUsageLimits } from '@/lib/database/usage-logging';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/database/users');
jest.mock('@/lib/database/usage-logging');
jest.mock('@/lib/ai/agentic-service');
jest.mock('@/lib/rate-limit', () => ({
  chatRateLimit: {
    limit: jest.fn(() => Promise.resolve({
      success: true,
      limit: 30,
      remaining: 29,
      reset: new Date(),
    })),
  },
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      (auth as unknown as jest.Mock).mockResolvedValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when message is missing', async () => {
      (auth as unknown as jest.Mock).mockResolvedValueOnce({ userId: 'user-123' });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Message is required');
    });

    it('should return 404 when user is not found in database', async () => {
      (auth as unknown as jest.Mock).mockResolvedValueOnce({ userId: 'user-123' });
      (getUserByClerkId as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 429 when usage limit is exceeded', async () => {
      (auth as unknown as jest.Mock).mockResolvedValueOnce({ userId: 'user-123' });
      (getUserByClerkId as jest.Mock).mockResolvedValueOnce({
        id: 'db-user-123',
        clerk_user_id: 'user-123',
        email: 'test@example.com',
      });
      (checkUsageLimits as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        current: 100,
        limit: 50,
        plan: 'starter',
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Usage limit exceeded');
    });

    it('should return success response with valid request', async () => {
      (auth as unknown as jest.Mock).mockResolvedValueOnce({ userId: 'user-123' });
      (getUserByClerkId as jest.Mock).mockResolvedValueOnce({
        id: 'db-user-123',
        clerk_user_id: 'user-123',
        email: 'test@example.com',
      });
      (checkUsageLimits as jest.Mock).mockResolvedValueOnce({
        allowed: true,
        current: 10,
        limit: 50,
        plan: 'starter',
      });

      // Mock AI response
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mockAIResponse = require('@/lib/ai/agentic-service');
      mockAIResponse.generateAgenticResponse = jest.fn().mockResolvedValueOnce({
        content: 'AI response here',
        model: 'deepseek/deepseek-r1',
        provider: 'openrouter',
        tokensUsed: 100,
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello, how are you?' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toBe('AI response here');
      expect(data.model).toBe('deepseek/deepseek-r1');
    });
  });

  describe('GET', () => {
    it('should return API status', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('Chat API is running');
      expect(data.supportedProviders).toContain('openrouter');
    });
  });
});
