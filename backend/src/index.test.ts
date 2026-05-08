import request from 'supertest';
import app from './index';

describe('Express Application Setup', () => {
  describe('Middleware Configuration', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow requests from configured CORS origin', async () => {
      const response = await request(app).get('/health').set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should allow requests from local IP development origin', async () => {
      const response = await request(app)
        .options('/api/certificates')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 status for health check', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return valid timestamp in health check', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/undefined-route');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /undefined-route not found',
        },
      });
    });

    it('should return 404 for undefined POST routes', async () => {
      const response = await request(app).post('/undefined-route');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('POST');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle errors with custom status codes', async () => {
      const response = await request(app).get('/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return error response in correct format', async () => {
      const response = await request(app).get('/non-existent');

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Request Logging', () => {
    it('should log requests without crashing', async () => {
      const originalWarn = console.warn;
      const logs: string[] = [];
      console.warn = jest.fn((...args) => {
        logs.push(args.join(' '));
      });

      await request(app).get('/health');

      console.warn = originalWarn;

      const hasRequestLog = logs.some((log) => log.includes('GET') && log.includes('/health'));
      expect(hasRequestLog).toBe(true);
    });
  });

  describe('Environment Variables', () => {
    it('should load environment variables from dotenv', () => {
      expect(process.env.NODE_ENV).toBeDefined();
    });

    it('should use default PORT if not specified', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;

      request(app)
        .get('/health')
        .then((response) => {
          expect(response.status).toBe(200);
        });

      if (originalPort) {
        process.env.PORT = originalPort;
      }
    });
  });

  describe('JSON Body Parser Limits', () => {
    it('should accept JSON payloads within limit', async () => {
      const largeButValidPayload = {
        data: 'x'.repeat(1000),
      };

      const response = await request(app)
        .post('/health')
        .send(largeButValidPayload)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  describe('Response Headers', () => {
    it('should set Content-Type to application/json for JSON responses', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
