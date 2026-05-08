import { DatabaseService } from './DatabaseService';
import { Certificate } from '../models/Certificate';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('DatabaseService', () => {
  let mongoServer: MongoMemoryServer;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      dbName: 'test_certificate_generator',
    });

    databaseService = new DatabaseService();
  }, 60000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  beforeEach(async () => {
    await Certificate.deleteMany({});
  });

  describe('createCertificate', () => {
    it('should create a certificate with valid data', async () => {
      const certificateData = {
        participantName: 'John Doe',
        role: 'Software Developer',
        eventOrInternship: 'Summer Internship 2024',
        date: new Date('2024-06-15'),
        uniqueCertificateId: 'test-uuid-123',
        format: 'pdf' as const,
        filePaths: {
          pdf: '/certificates/2024/06/test-uuid-123.pdf',
        },
      };

      const certificate = await databaseService.createCertificate(certificateData);

      expect(certificate).toBeDefined();
      expect(certificate.participantName).toBe(certificateData.participantName);
      expect(certificate.role).toBe(certificateData.role);
      expect(certificate.eventOrInternship).toBe(certificateData.eventOrInternship);
      expect(certificate.uniqueCertificateId).toBe(certificateData.uniqueCertificateId);
      expect(certificate.format).toBe(certificateData.format);
      expect(certificate.filePaths.pdf).toBe(certificateData.filePaths.pdf);
      expect(certificate.generatedAt).toBeDefined();
      expect(certificate.createdAt).toBeDefined();
      expect(certificate.updatedAt).toBeDefined();
    });

    it('should create a certificate with both PDF and image formats', async () => {
      const certificateData = {
        participantName: 'Jane Smith',
        role: 'Data Analyst',
        eventOrInternship: 'Data Science Workshop',
        date: new Date('2024-07-20'),
        uniqueCertificateId: 'test-uuid-456',
        format: 'both' as const,
        filePaths: {
          pdf: '/certificates/2024/07/test-uuid-456.pdf',
          image: '/certificates/2024/07/test-uuid-456.png',
        },
      };

      const certificate = await databaseService.createCertificate(certificateData);

      expect(certificate.format).toBe('both');
      expect(certificate.filePaths.pdf).toBe(certificateData.filePaths.pdf);
      expect(certificate.filePaths.image).toBe(certificateData.filePaths.image);
    });

    it('should throw an error when required fields are missing', async () => {
      const invalidData = {
        participantName: 'Test User',
      } as any;

      await expect(databaseService.createCertificate(invalidData)).rejects.toThrow(
        'Database operation failed'
      );
    });

    it('should throw an error when uniqueCertificateId is duplicate', async () => {
      const certificateData = {
        participantName: 'John Doe',
        role: 'Developer',
        eventOrInternship: 'Internship',
        date: new Date('2024-06-15'),
        uniqueCertificateId: 'duplicate-uuid',
        format: 'pdf' as const,
        filePaths: {
          pdf: '/certificates/2024/06/duplicate-uuid.pdf',
        },
      };

      await databaseService.createCertificate(certificateData);

      await expect(databaseService.createCertificate(certificateData)).rejects.toThrow(
        'Database operation failed'
      );
    });
  });

  describe('getCertificateById', () => {
    it('should retrieve a certificate by MongoDB ObjectId', async () => {
      const certificateData = {
        participantName: 'Alice Johnson',
        role: 'Designer',
        eventOrInternship: 'Design Sprint',
        date: new Date('2024-08-10'),
        uniqueCertificateId: 'test-uuid-789',
        format: 'image' as const,
        filePaths: {
          image: '/certificates/2024/08/test-uuid-789.png',
        },
      };

      const created = await databaseService.createCertificate(certificateData);
      const retrieved = await databaseService.getCertificateById(created._id.toString());

      expect(retrieved).toBeDefined();
      expect(retrieved!._id.toString()).toBe(created._id.toString());
      expect(retrieved!.participantName).toBe(certificateData.participantName);
      expect(retrieved!.uniqueCertificateId).toBe(certificateData.uniqueCertificateId);
    });

    it('should return null for non-existing ID', async () => {
      const nonExistingId = new mongoose.Types.ObjectId().toString();
      const result = await databaseService.getCertificateById(nonExistingId);

      expect(result).toBeNull();
    });

    it('should throw an error for invalid ObjectId format', async () => {
      const invalidId = 'invalid-object-id';

      await expect(databaseService.getCertificateById(invalidId)).rejects.toThrow(
        'Database operation failed'
      );
    });
  });

  describe('getCertificateByUniqueId', () => {
    it('should retrieve a certificate by unique certificate ID', async () => {
      const certificateData = {
        participantName: 'Bob Wilson',
        role: 'Product Manager',
        eventOrInternship: 'Product Workshop',
        date: new Date('2024-09-05'),
        uniqueCertificateId: 'unique-test-uuid-999',
        format: 'pdf' as const,
        filePaths: {
          pdf: '/certificates/2024/09/unique-test-uuid-999.pdf',
        },
      };

      await databaseService.createCertificate(certificateData);
      const retrieved = await databaseService.getCertificateByUniqueId(
        certificateData.uniqueCertificateId
      );

      expect(retrieved).toBeDefined();
      expect(retrieved!.uniqueCertificateId).toBe(certificateData.uniqueCertificateId);
      expect(retrieved!.participantName).toBe(certificateData.participantName);
    });

    it('should return null for non-existing unique ID', async () => {
      const result = await databaseService.getCertificateByUniqueId('non-existing-uuid');

      expect(result).toBeNull();
    });

    it('should use index optimization for fast lookups', async () => {
      for (let i = 0; i < 10; i++) {
        await databaseService.createCertificate({
          participantName: `User ${i}`,
          role: 'Role',
          eventOrInternship: 'Event',
          date: new Date(),
          uniqueCertificateId: `uuid-${i}`,
          format: 'pdf',
          filePaths: { pdf: `/path/${i}.pdf` },
        });
      }

      const startTime = Date.now();
      const result = await databaseService.getCertificateByUniqueId('uuid-5');
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result!.uniqueCertificateId).toBe('uuid-5');

      expect(duration).toBeLessThan(100);
    });
  });

  describe('deleteCertificateById', () => {
    it('should delete a certificate by MongoDB ObjectId', async () => {
      const certificateData = {
        participantName: 'Delete Test',
        role: 'Developer',
        eventOrInternship: 'Cleanup Program',
        date: new Date('2024-10-01'),
        uniqueCertificateId: 'delete-test-uuid',
        format: 'both' as const,
        filePaths: {
          pdf: '/certificates/2024/10/delete-test-uuid.pdf',
          image: '/certificates/2024/10/delete-test-uuid.png',
        },
      };

      const created = await databaseService.createCertificate(certificateData);
      const deleted = await databaseService.deleteCertificateById(created._id.toString());
      const retrieved = await databaseService.getCertificateById(created._id.toString());

      expect(deleted).toBeDefined();
      expect(deleted!._id.toString()).toBe(created._id.toString());
      expect(retrieved).toBeNull();
    });

    it('should return null when deleting a non-existing certificate', async () => {
      const result = await databaseService.deleteCertificateById(
        new mongoose.Types.ObjectId().toString()
      );

      expect(result).toBeNull();
    });
  });

  describe('searchCertificates', () => {
    beforeEach(async () => {
      const testCertificates = [
        {
          participantName: 'Alice Anderson',
          role: 'Developer',
          eventOrInternship: 'Hackathon 2024',
          date: new Date('2024-01-15'),
          uniqueCertificateId: 'uuid-alice-1',
          format: 'pdf' as const,
          filePaths: { pdf: '/path/alice.pdf' },
        },
        {
          participantName: 'Bob Brown',
          role: 'Designer',
          eventOrInternship: 'Design Sprint',
          date: new Date('2024-02-20'),
          uniqueCertificateId: 'uuid-bob-2',
          format: 'image' as const,
          filePaths: { image: '/path/bob.png' },
        },
        {
          participantName: 'Charlie Chen',
          role: 'Manager',
          eventOrInternship: 'Leadership Program',
          date: new Date('2024-03-10'),
          uniqueCertificateId: 'uuid-charlie-3',
          format: 'both' as const,
          filePaths: { pdf: '/path/charlie.pdf', image: '/path/charlie.png' },
        },
        {
          participantName: 'Alice Cooper',
          role: 'Analyst',
          eventOrInternship: 'Data Workshop',
          date: new Date('2024-04-05'),
          uniqueCertificateId: 'uuid-alice-4',
          format: 'pdf' as const,
          filePaths: { pdf: '/path/alice2.pdf' },
        },
      ];

      for (const cert of testCertificates) {
        await databaseService.createCertificate(cert);
      }
    });

    it('should return all certificates with pagination', async () => {
      const result = await databaseService.searchCertificates({
        page: 1,
        limit: 10,
      });

      expect(result.certificates).toHaveLength(4);
      expect(result.totalCount).toBe(4);
    });

    it('should paginate results correctly', async () => {
      const page1 = await databaseService.searchCertificates({
        page: 1,
        limit: 2,
      });

      expect(page1.certificates).toHaveLength(2);
      expect(page1.totalCount).toBe(4);

      const page2 = await databaseService.searchCertificates({
        page: 2,
        limit: 2,
      });

      expect(page2.certificates).toHaveLength(2);
      expect(page2.totalCount).toBe(4);

      expect(page1.certificates[0]._id).not.toEqual(page2.certificates[0]._id);
    });

    it('should search by participant name using text search', async () => {
      const result = await databaseService.searchCertificates({
        searchTerm: 'Alice',
        searchField: 'name',
        page: 1,
        limit: 10,
      });

      expect(result.certificates.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);

      result.certificates.forEach((cert) => {
        expect(cert.participantName.toLowerCase()).toContain('alice');
      });
    });

    it('should search by unique certificate ID', async () => {
      const result = await databaseService.searchCertificates({
        searchTerm: 'uuid-bob',
        searchField: 'id',
        page: 1,
        limit: 10,
      });

      expect(result.certificates).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.certificates[0].uniqueCertificateId).toContain('uuid-bob');
    });

    it('should return certificates sorted by generatedAt descending', async () => {
      const result = await databaseService.searchCertificates({
        page: 1,
        limit: 10,
      });

      for (let i = 0; i < result.certificates.length - 1; i++) {
        const current = new Date(result.certificates[i].generatedAt).getTime();
        const next = new Date(result.certificates[i + 1].generatedAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should return empty results for non-matching search', async () => {
      const result = await databaseService.searchCertificates({
        searchTerm: 'NonExistentName',
        searchField: 'name',
        page: 1,
        limit: 10,
      });

      expect(result.certificates).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle case-insensitive ID search', async () => {
      const result = await databaseService.searchCertificates({
        searchTerm: 'UUID-ALICE',
        searchField: 'id',
        page: 1,
        limit: 10,
      });

      expect(result.certificates.length).toBeGreaterThan(0);
      result.certificates.forEach((cert) => {
        expect(cert.uniqueCertificateId.toLowerCase()).toContain('uuid-alice');
      });
    });
  });

  describe('error handling', () => {
    it('should log errors for database operation failures', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(databaseService.createCertificate({} as any)).rejects.toThrow(
        'Database operation failed'
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should log success for certificate creation', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const certificateData = {
        participantName: 'Test User',
        role: 'Tester',
        eventOrInternship: 'Test Event',
        date: new Date(),
        uniqueCertificateId: 'test-log-uuid',
        format: 'pdf' as const,
        filePaths: { pdf: '/path/test.pdf' },
      };

      await databaseService.createCertificate(certificateData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Certificate created successfully')
      );
      consoleLogSpy.mockRestore();
    });
  });
});
