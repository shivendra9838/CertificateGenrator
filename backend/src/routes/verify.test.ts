import express from 'express';
import request from 'supertest';
import verifyRouter from './verify';
import { connectToDatabase } from '../config/database';
import { databaseService } from '../services/DatabaseService';

jest.mock('../config/database', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('../services/DatabaseService', () => ({
  databaseService: {
    getCertificateByUniqueId: jest.fn(),
  },
}));

const app = express();
app.use('/api/verify', verifyRouter);

describe('verify route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns validation error when id is missing', async () => {
    const response = await request(app).get('/api/verify');

    expect(response.status).toBe(400);
    expect(response.body.valid).toBe(false);
  });

  it('returns invalid result when certificate is not found', async () => {
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
    (databaseService.getCertificateByUniqueId as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get('/api/verify?id=MB-UNKNOWN000000');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      valid: false,
      data: null,
    });
  });

  it('returns verification data for a valid certificate id', async () => {
    const generatedAt = new Date('2026-05-07T10:00:00.000Z');
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
    (databaseService.getCertificateByUniqueId as jest.Mock).mockResolvedValue({
      uniqueCertificateId: 'MB-ABCDEF1234567890',
      participantName: 'Asha Rao',
      role: 'Graduate Trainee',
      eventOrInternship: 'Mercedes-Benz Leadership Program',
      date: new Date('2026-05-01T00:00:00.000Z'),
      generatedAt,
      issuedBy: 'Priya Sharma',
    });

    const response = await request(app).get('/api/verify?id=MB-ABCDEF1234567890');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: true,
      data: {
        certId: 'MB-ABCDEF1234567890',
        recipientName: 'Asha Rao',
        role: 'Graduate Trainee',
        program: 'Mercedes-Benz Leadership Program',
        date: '2026-05-01T00:00:00.000Z',
        issuedAt: generatedAt.toISOString(),
        issuedBy: 'Priya Sharma',
      },
    });
  });
});
