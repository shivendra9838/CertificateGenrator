import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

describe('API performance validation', () => {
  let app: unknown;
  let mongoServer: MongoMemoryServer;
  let storagePath: string;
  let certificateId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'certificates-performance-'));

    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.MONGODB_DB_NAME = 'performance_certificate_generator';
    process.env.CERTIFICATE_STORAGE_PATH = storagePath;
    process.env.CORS_ORIGIN = 'http://localhost:5173';

    const imported = await import('./index');
    app = imported.default;
  }, 60000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    if (storagePath) {
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  }, 60000);

  it('generates a certificate within the performance budget', async () => {
    const startTime = performance.now();

    const response = await request(app as any)
      .post('/api/certificates')
      .send({
        participantName: 'Performance Tester',
        role: 'Quality Engineer',
        eventOrInternship: 'Performance Validation',
        date: '2026-05-08',
        format: 'both',
      })
      .expect(201);

    const duration = performance.now() - startTime;
    certificateId = response.body.data.certificateId;

    expect(certificateId).toBeTruthy();
    expect(response.body.data.downloadUrls.pdf).toBeTruthy();
    expect(response.body.data.downloadUrls.image).toBeTruthy();
    expect(duration).toBeLessThan(5000);
  });

  it('retrieves certificate lists within the performance budget', async () => {
    const startTime = performance.now();

    const response = await request(app as any)
      .get('/api/certificates')
      .query({ page: 1, limit: 10 })
      .expect(200);

    const duration = performance.now() - startTime;

    expect(response.body.data.certificates.length).toBeGreaterThanOrEqual(1);
    expect(duration).toBeLessThan(1000);
  });

  it('retrieves a single certificate within the performance budget', async () => {
    const startTime = performance.now();

    const response = await request(app as any)
      .get(`/api/certificates/${certificateId}`)
      .expect(200);

    const duration = performance.now() - startTime;

    expect(response.body.data.uniqueCertificateId).toBeTruthy();
    expect(duration).toBeLessThan(500);
  });

  it('downloads a generated PDF within the performance budget', async () => {
    const startTime = performance.now();

    const response = await request(app as any)
      .get(`/api/certificates/${certificateId}/download`)
      .query({ format: 'pdf' })
      .expect(200);

    const duration = performance.now() - startTime;

    expect(response.headers['content-type']).toMatch(/application\/pdf/);
    expect(response.body.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(3000);
  });
});
