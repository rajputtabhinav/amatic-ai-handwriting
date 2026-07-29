import { GET } from '../route';

describe('Health Check API', () => {
  it('should return 200 status', async () => {
    const response = await GET();
    
    expect(response.status).toBe(200);
  });

  it('should return JSON response', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data).toHaveProperty('status');
  });

  it('should include timestamp', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });
});

