import { CertificateGeneratorService } from './CertificateGeneratorService';
import { FileStorageService } from './FileStorageService';
import { CertificateTemplateConfig } from '../config/certificateTemplate';

jest.mock('./FileStorageService');

describe('CertificateGeneratorService', () => {
  let service: CertificateGeneratorService;
  let mockFileStorageService: jest.Mocked<FileStorageService>;
  let mockTemplateConfig: CertificateTemplateConfig;

  beforeEach(() => {
    mockFileStorageService = {
      saveCertificate: jest.fn(),
      getCertificate: jest.fn(),
      deleteCertificate: jest.fn(),
      generateFilePath: jest.fn(),
      ensureDirectoryExists: jest.fn(),
    } as any;

    mockTemplateConfig = {
      pageSize: [1050, 742],
      orientation: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      fonts: {
        brand: { family: 'Montserrat', size: 9 },
        title: { family: 'Playfair Display', size: 34 },
        body: { family: 'Montserrat', size: 11.5 },
        footer: { family: 'Montserrat', size: 11 },
      },
      colors: {
        primary: '#111111',
        secondary: '#2F2F2F',
        gold: '#C8A24A',
        mutedGold: '#E3D2A2',
        text: '#151515',
        mutedText: '#5D5D5D',
      },
      layout: {
        page: { width: 1050, height: 742 },
        brand: { text: 'Proudly Presents', tagline: '', y: 116 },
        title: { text: 'Certificate of Achievement', y: 205 },
        participantName: { prefix: 'This is to certify that', y: 308 },
        role: { prefix: 'has successfully completed the role of', y: 416 },
        event: { prefix: 'in', y: 462 },
        date: { prefix: 'on', y: 514 },
        signature: {
          label: 'Head HR',
          y: 618,
          lineWidth: 240,
          defaultNames: ['Priya Sharma', 'Ananya Mehta', 'Rohit Verma'],
        },
        qr: { label: 'Scan to verify', x: 806, y: 579, size: 68 },
        seal: { text: 'Verified Authentic', x: 244, y: 613, radius: 34 },
        uniqueId: { prefix: 'Certificate ID:', y: 687 },
      },
    };

    service = new CertificateGeneratorService(mockTemplateConfig, mockFileStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUniqueId', () => {
    it('should generate a valid MB HMAC certificate ID', () => {
      const id = service.generateUniqueId();

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^MB-[A-F0-9]{16}$/);
    });

    it('should generate unique IDs on multiple calls', () => {
      const id1 = service.generateUniqueId();
      const id2 = service.generateUniqueId();
      const id3 = service.generateUniqueId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs that use the MB prefix and HMAC digest length', () => {
      const id = service.generateUniqueId();
      expect(id.length).toBe(19);
    });
  });

  describe('generatePDF', () => {
    const validInput = {
      participantName: 'John Doe',
      role: 'Software Developer',
      eventOrInternship: 'Summer Internship 2024',
      date: new Date('2024-01-15'),
      format: 'pdf' as const,
    };

    beforeEach(() => {
      mockFileStorageService.saveCertificate.mockResolvedValue('/path/to/certificate.pdf');
    });

    it('should generate PDF with valid input data', async () => {
      const uniqueId = 'test-uuid-123';
      const result = await service.generatePDF(validInput, uniqueId);

      expect(result).toBe('/path/to/certificate.pdf');
      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledTimes(1);
      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          uniqueId: uniqueId,
          format: 'pdf',
          generatedAt: expect.any(Date),
        })
      );
    });

    it('should generate PDF buffer with participant data', async () => {
      const uniqueId = 'test-uuid-456';
      await service.generatePDF(validInput, uniqueId);

      const callArgs = mockFileStorageService.saveCertificate.mock.calls[0];
      const pdfBuffer = callArgs[0] as Buffer;

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should throw error if file storage fails', async () => {
      mockFileStorageService.saveCertificate.mockRejectedValue(new Error('Storage failed'));

      await expect(service.generatePDF(validInput, 'test-uuid')).rejects.toThrow(
        'PDF generation failed: Storage failed'
      );
    });

    it('should handle different participant names', async () => {
      const inputs = [
        { ...validInput, participantName: 'Alice Smith' },
        { ...validInput, participantName: 'Bob Johnson' },
        { ...validInput, participantName: 'Charlie Brown' },
      ];

      for (const input of inputs) {
        mockFileStorageService.saveCertificate.mockResolvedValue('/path/to/cert.pdf');
        const result = await service.generatePDF(input, 'test-uuid');
        expect(result).toBe('/path/to/cert.pdf');
      }

      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledTimes(3);
    });

    it('should format date correctly in PDF', async () => {
      const testDates = [new Date('2024-01-15'), new Date('2023-12-25'), new Date('2024-06-30')];

      for (const date of testDates) {
        mockFileStorageService.saveCertificate.mockResolvedValue('/path/to/cert.pdf');
        await service.generatePDF({ ...validInput, date }, 'test-uuid');
      }

      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateCertificate', () => {
    const validInput = {
      participantName: 'John Doe',
      role: 'Software Developer',
      eventOrInternship: 'Summer Internship 2024',
      date: new Date('2024-01-15'),
      format: 'pdf' as const,
    };

    beforeEach(() => {
      mockFileStorageService.saveCertificate.mockResolvedValue('/path/to/certificate.pdf');
    });

    it('should generate certificate with PDF format', async () => {
      const result = await service.generateCertificate(validInput);

      expect(result).toHaveProperty('uniqueCertificateId');
      expect(result).toHaveProperty('issuedAt');
      expect(result).toHaveProperty('issuedBy');
      expect(result).toHaveProperty('filePaths');
      expect(result.filePaths).toHaveProperty('pdf');
      expect(result.filePaths.pdf).toBe('/path/to/certificate.pdf');
      expect(result.uniqueCertificateId).toMatch(/^MB-[A-F0-9]{16}$/);
      expect(mockTemplateConfig.layout.signature.defaultNames).toContain(result.issuedBy);
    });

    it('should generate unique certificate ID', async () => {
      const result1 = await service.generateCertificate(validInput);
      const result2 = await service.generateCertificate(validInput);

      expect(result1.uniqueCertificateId).not.toBe(result2.uniqueCertificateId);
    });

    it('should preserve all input data fields', async () => {
      const testInput = {
        participantName: 'Alice Johnson',
        role: 'Data Scientist',
        eventOrInternship: 'AI Research Program',
        date: new Date('2024-03-20'),
        format: 'pdf' as const,
      };

      const result = await service.generateCertificate(testInput);

      expect(result.uniqueCertificateId).toBeTruthy();
      expect(result.filePaths.pdf).toBeTruthy();
      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          format: 'pdf',
        })
      );
    });

    it('should throw error if PDF generation fails', async () => {
      mockFileStorageService.saveCertificate.mockRejectedValue(new Error('Generation failed'));

      await expect(service.generateCertificate(validInput)).rejects.toThrow(
        'Certificate generation failed: PDF generation failed: Generation failed'
      );
    });

    it('should handle image format request', async () => {
      const imageInput = { ...validInput, format: 'image' as const };
      mockFileStorageService.saveCertificate.mockResolvedValue('/path/to/certificate.png');

      const result = await service.generateCertificate(imageInput);

      expect(result.filePaths).toEqual({ image: '/path/to/certificate.png' });
      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          format: 'png',
        })
      );
    });

    it('should handle both format request', async () => {
      const bothInput = { ...validInput, format: 'both' as const };
      mockFileStorageService.saveCertificate
        .mockResolvedValueOnce('/path/to/certificate.pdf')
        .mockResolvedValueOnce('/path/to/certificate.png');

      const result = await service.generateCertificate(bothInput);

      expect(result.filePaths).toEqual({
        pdf: '/path/to/certificate.pdf',
        image: '/path/to/certificate.png',
      });
      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledTimes(2);
    });

    it('should log generation start and completion', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.generateCertificate(validInput);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting certificate generation'),
        expect.any(Object)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Certificate generation completed successfully'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should log errors on generation failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFileStorageService.saveCertificate.mockRejectedValue(new Error('Test error'));

      await expect(service.generateCertificate(validInput)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Certificate generation failed'),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('convertToImage', () => {
    it('should convert PDF content to a PNG file', async () => {
      const pdfPath = __filename;
      const uniqueId = 'test-uuid';
      mockFileStorageService.saveCertificate.mockResolvedValue('/path/to/certificate.png');

      const result = await service.convertToImage(pdfPath, uniqueId);

      expect(result).toBe('/path/to/certificate.png');
      expect(mockFileStorageService.saveCertificate).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          uniqueId,
          format: 'png',
          generatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('Error Handling', () => {
    const validInput = {
      participantName: 'John Doe',
      role: 'Software Developer',
      eventOrInternship: 'Summer Internship 2024',
      date: new Date('2024-01-15'),
      format: 'pdf' as const,
    };

    it('should handle file storage service errors gracefully', async () => {
      mockFileStorageService.saveCertificate.mockRejectedValue(new Error('Disk full'));

      await expect(service.generateCertificate(validInput)).rejects.toThrow(
        'Certificate generation failed'
      );
    });

    it('should include error details in thrown error', async () => {
      mockFileStorageService.saveCertificate.mockRejectedValue(new Error('Permission denied'));

      await expect(service.generateCertificate(validInput)).rejects.toThrow('Permission denied');
    });
  });

  describe('Integration with Template Config', () => {
    it('should use provided template configuration', () => {
      const customConfig: CertificateTemplateConfig = {
        ...mockTemplateConfig,
        layout: {
          ...mockTemplateConfig.layout,
          title: { text: 'Custom Certificate', y: 150 },
        },
      };

      const customService = new CertificateGeneratorService(customConfig, mockFileStorageService);

      expect(customService).toBeDefined();
    });

    it('should use default template config when not provided', () => {
      const defaultService = new CertificateGeneratorService();
      expect(defaultService).toBeDefined();
    });
  });
});
