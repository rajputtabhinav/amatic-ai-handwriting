import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check should return 200', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  test('chat endpoint should require authentication', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        message: 'Hello'
      }
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('subscription endpoint should require authentication', async ({ request }) => {
    const response = await request.post('/api/subscriptions/create', {
      data: {
        planType: 'starter'
      }
    });
    
    expect(response.status()).toBe(401);
  });
});

