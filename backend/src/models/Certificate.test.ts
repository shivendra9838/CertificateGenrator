import { Certificate } from './Certificate';

describe('Certificate Schema', () => {
  describe('Schema Definition', () => {
    it('should have all required fields defined', () => {
      const schema = Certificate.schema;
      const paths = schema.paths;

      expect(paths.participantName).toBeDefined();
      expect(paths.role).toBeDefined();
      expect(paths.eventOrInternship).toBeDefined();
      expect(paths.date).toBeDefined();
      expect(paths.uniqueCertificateId).toBeDefined();
      expect(paths.format).toBeDefined();
      expect(paths['filePaths.pdf']).toBeDefined();
      expect(paths['filePaths.image']).toBeDefined();
      expect(paths.generatedAt).toBeDefined();
    });

    it('should have correct field types', () => {
      const schema = Certificate.schema;
      const paths = schema.paths;

      expect(paths.participantName.instance).toBe('String');
      expect(paths.role.instance).toBe('String');
      expect(paths.eventOrInternship.instance).toBe('String');
      expect(paths.date.instance).toBe('Date');
      expect(paths.uniqueCertificateId.instance).toBe('String');
      expect(paths.format.instance).toBe('String');
      expect(paths.generatedAt.instance).toBe('Date');
    });

    it('should have required validation on mandatory fields', () => {
      const schema = Certificate.schema;
      const paths = schema.paths;

      expect(paths.participantName.isRequired).toBe(true);
      expect(paths.role.isRequired).toBe(true);
      expect(paths.eventOrInternship.isRequired).toBe(true);
      expect(paths.date.isRequired).toBe(true);
      expect(paths.uniqueCertificateId.isRequired).toBe(true);
      expect(paths.format.isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      const schema = Certificate.schema;
      expect(schema.options.timestamps).toBe(true);
    });

    it('should have correct indexes defined', () => {
      const schema = Certificate.schema;
      const indexes = schema.indexes();

      const textIndex = indexes.find((idx: any) => idx[0].participantName === 'text');
      expect(textIndex).toBeDefined();

      const generatedAtIndex = indexes.find((idx: any) => idx[0].generatedAt === -1);
      expect(generatedAtIndex).toBeDefined();

      const schema_paths = schema.paths;
      expect((schema_paths.uniqueCertificateId as any).options.unique).toBe(true);
    });

    it('should have default value for generatedAt', () => {
      const schema = Certificate.schema;
      const paths = schema.paths;

      expect((paths.generatedAt as any).defaultValue).toBeDefined();
    });

    it('should have trim enabled on string fields', () => {
      const schema = Certificate.schema;
      const paths = schema.paths;

      expect((paths.participantName as any).options.trim).toBe(true);
      expect((paths.role as any).options.trim).toBe(true);
      expect((paths.eventOrInternship as any).options.trim).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should create a valid certificate document', () => {
      const certificateData = {
        participantName: 'John Doe',
        role: 'Developer',
        eventOrInternship: 'Summer Internship 2024',
        date: new Date('2024-01-15'),
        uniqueCertificateId: 'test-uuid-123',
        format: 'pdf' as const,
        filePaths: {
          pdf: '/certificates/2024/01/test-uuid-123.pdf',
        },
        generatedAt: new Date(),
      };

      const certificate = new Certificate(certificateData);
      const validationError = certificate.validateSync();

      expect(validationError).toBeUndefined();
    });

    it('should fail validation when required fields are missing', () => {
      const certificate = new Certificate({});
      const validationError = certificate.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors.participantName).toBeDefined();
      expect(validationError?.errors.role).toBeDefined();
      expect(validationError?.errors.eventOrInternship).toBeDefined();
      expect(validationError?.errors.date).toBeDefined();
      expect(validationError?.errors.uniqueCertificateId).toBeDefined();
      expect(validationError?.errors.format).toBeDefined();
    });

    it('should fail validation when format is invalid', () => {
      const certificateData = {
        participantName: 'John Doe',
        role: 'Developer',
        eventOrInternship: 'Summer Internship 2024',
        date: new Date('2024-01-15'),
        uniqueCertificateId: 'test-uuid-123',
        format: 'invalid-format',
        filePaths: {
          pdf: '/certificates/2024/01/test-uuid-123.pdf',
        },
      };

      const certificate = new Certificate(certificateData);
      const validationError = certificate.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors.format).toBeDefined();
    });

    it('should fail validation when string exceeds maxlength', () => {
      const certificateData = {
        participantName: 'A'.repeat(201),
        role: 'Developer',
        eventOrInternship: 'Summer Internship 2024',
        date: new Date('2024-01-15'),
        uniqueCertificateId: 'test-uuid-123',
        format: 'pdf' as const,
        filePaths: {
          pdf: '/certificates/2024/01/test-uuid-123.pdf',
        },
      };

      const certificate = new Certificate(certificateData);
      const validationError = certificate.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors.participantName).toBeDefined();
    });

    it('should trim whitespace from string fields', () => {
      const certificateData = {
        participantName: '  John Doe  ',
        role: '  Developer  ',
        eventOrInternship: '  Summer Internship 2024  ',
        date: new Date('2024-01-15'),
        uniqueCertificateId: 'test-uuid-123',
        format: 'pdf' as const,
        filePaths: {
          pdf: '/certificates/2024/01/test-uuid-123.pdf',
        },
      };

      const certificate = new Certificate(certificateData);

      expect(certificate.participantName).toBe('John Doe');
      expect(certificate.role).toBe('Developer');
      expect(certificate.eventOrInternship).toBe('Summer Internship 2024');
    });

    it('should accept all valid format values', () => {
      const formats: Array<'pdf' | 'image' | 'both'> = ['pdf', 'image', 'both'];

      formats.forEach((format) => {
        const certificateData = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Summer Internship 2024',
          date: new Date('2024-01-15'),
          uniqueCertificateId: `test-uuid-${format}`,
          format,
          filePaths: {},
        };

        const certificate = new Certificate(certificateData);
        const validationError = certificate.validateSync();

        expect(validationError).toBeUndefined();
      });
    });

    it('should allow optional filePaths fields', () => {
      const certificateData = {
        participantName: 'John Doe',
        role: 'Developer',
        eventOrInternship: 'Summer Internship 2024',
        date: new Date('2024-01-15'),
        uniqueCertificateId: 'test-uuid-123',
        format: 'both' as const,
        filePaths: {
          pdf: '/certificates/2024/01/test-uuid-123.pdf',
          image: '/certificates/2024/01/test-uuid-123.png',
        },
      };

      const certificate = new Certificate(certificateData);
      const validationError = certificate.validateSync();

      expect(validationError).toBeUndefined();
      expect(certificate.filePaths.pdf).toBe('/certificates/2024/01/test-uuid-123.pdf');
      expect(certificate.filePaths.image).toBe('/certificates/2024/01/test-uuid-123.png');
    });
  });
});
