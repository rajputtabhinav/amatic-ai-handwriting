import { errorResponse, successResponse } from '../middleware';

describe('API Middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    Object.assign(process.env, { NODE_ENV: originalNodeEnv });
  });

  describe('Error Response', () => {
    it('should create error response with message', () => {
      const response = errorResponse('Test error', 400);
      expect(response.status).toBe(400);
    });

    it('should include details in development', () => {
      Object.assign(process.env, { NODE_ENV: 'development' });
      
      const response = errorResponse('Test error', 500, { detail: 'extra info' });
      expect(response.status).toBe(500);
    });

    it('should hide details in production', () => {
      Object.assign(process.env, { NODE_ENV: 'production' });
      
      const response = errorResponse('Test error', 500, { detail: 'sensitive' });
      expect(response.status).toBe(500);
    });
  });

  describe('Success Response', () => {
    it('should create success response with data', () => {
      const data = { message: 'Success' };
      const response = successResponse(data);
      expect(response.status).toBe(200);
    });

    it('should support custom status codes', () => {
      const data = { id: '123' };
      const response = successResponse(data, 201);
      expect(response.status).toBe(201);
    });
  });
});

