import { InputValidatorService } from './InputValidatorService';

describe('InputValidatorService', () => {
  let validator: InputValidatorService;

  beforeEach(() => {
    validator = new InputValidatorService();
  });

  describe('validateCertificateInput', () => {
    describe('with valid inputs', () => {
      it('should return valid result for all valid inputs', () => {
        const validInput = {
          participantName: 'John Doe',
          role: 'Software Developer',
          eventOrInternship: 'Summer Internship 2024',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(validInput);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept ISO 8601 date with time', () => {
        const input = {
          participantName: 'Jane Smith',
          role: 'Intern',
          eventOrInternship: 'Tech Conference',
          date: '2024-01-15T10:30:00.000Z',
          format: 'image' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept format "both"', () => {
        const input = {
          participantName: 'Alice Johnson',
          role: 'Participant',
          eventOrInternship: 'Workshop',
          date: '2024-03-20',
          format: 'both' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept maximum length strings', () => {
        const input = {
          participantName: 'A'.repeat(200),
          role: 'B'.repeat(100),
          eventOrInternship: 'C'.repeat(200),
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept minimum length strings', () => {
        const input = {
          participantName: 'A',
          role: 'B',
          eventOrInternship: 'C',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('participantName validation', () => {
      it('should reject missing participantName', () => {
        const input = {
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name is required',
        });
      });

      it('should reject null participantName', () => {
        const input = {
          participantName: null,
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name is required',
        });
      });

      it('should reject empty string participantName', () => {
        const input = {
          participantName: '',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name cannot be empty or whitespace',
        });
      });

      it('should reject whitespace-only participantName', () => {
        const input = {
          participantName: '   ',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name cannot be empty or whitespace',
        });
      });

      it('should reject participantName with tabs and newlines only', () => {
        const input = {
          participantName: '\t\n\r',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name cannot be empty or whitespace',
        });
      });

      it('should reject participantName exceeding 200 characters', () => {
        const input = {
          participantName: 'A'.repeat(201),
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name must not exceed 200 characters',
        });
      });

      it('should reject non-string participantName', () => {
        const input = {
          participantName: 123,
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name must be a string',
        });
      });
    });

    describe('role validation', () => {
      it('should reject missing role', () => {
        const input = {
          participantName: 'John Doe',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'role',
          message: 'Role is required',
        });
      });

      it('should reject empty string role', () => {
        const input = {
          participantName: 'John Doe',
          role: '',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'role',
          message: 'Role cannot be empty or whitespace',
        });
      });

      it('should reject whitespace-only role', () => {
        const input = {
          participantName: 'John Doe',
          role: '   ',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'role',
          message: 'Role cannot be empty or whitespace',
        });
      });

      it('should reject role exceeding 100 characters', () => {
        const input = {
          participantName: 'John Doe',
          role: 'A'.repeat(101),
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'role',
          message: 'Role must not exceed 100 characters',
        });
      });

      it('should reject non-string role', () => {
        const input = {
          participantName: 'John Doe',
          role: 456,
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'role',
          message: 'Role must be a string',
        });
      });
    });

    describe('eventOrInternship validation', () => {
      it('should reject missing eventOrInternship', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'eventOrInternship',
          message: 'Event Or Internship is required',
        });
      });

      it('should reject empty string eventOrInternship', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: '',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'eventOrInternship',
          message: 'Event Or Internship cannot be empty or whitespace',
        });
      });

      it('should reject whitespace-only eventOrInternship', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: '   ',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'eventOrInternship',
          message: 'Event Or Internship cannot be empty or whitespace',
        });
      });

      it('should reject eventOrInternship exceeding 200 characters', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'A'.repeat(201),
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'eventOrInternship',
          message: 'Event Or Internship must not exceed 200 characters',
        });
      });

      it('should reject non-string eventOrInternship', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 789,
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'eventOrInternship',
          message: 'Event Or Internship must be a string',
        });
      });
    });

    describe('date validation', () => {
      it('should reject missing date', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message: 'Date is required',
        });
      });

      it('should reject null date', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: null,
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message: 'Date is required',
        });
      });

      it('should reject empty string date', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message: 'Date cannot be empty',
        });
      });

      it('should reject non-string date', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: 20240115,
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message: 'Date must be a string',
        });
      });

      it('should reject invalid date format (MM/DD/YYYY)', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '01/15/2024',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message:
            'Date must be in valid ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        });
      });

      it('should reject invalid date format (DD-MM-YYYY)', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '15-01-2024',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message:
            'Date must be in valid ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        });
      });

      it('should reject invalid date value (February 30)', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-02-30',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message: 'Date must be a valid date',
        });
      });

      it('should reject invalid date value (month 13)', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-13-01',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'date',
          message: 'Date must be a valid date',
        });
      });

      it('should accept valid ISO 8601 date (YYYY-MM-DD)', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept valid ISO 8601 date with time (YYYY-MM-DDTHH:mm:ss)', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15T10:30:00',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept valid ISO 8601 date with milliseconds and timezone', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15T10:30:00.000Z',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept valid ISO 8601 date with timezone offset', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15T10:30:00+05:30',
          format: 'pdf' as const,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('format validation', () => {
      it('should reject missing format', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'format',
          message: 'Format is required',
        });
      });

      it('should reject null format', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: null,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'format',
          message: 'Format is required',
        });
      });

      it('should reject non-string format', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 123,
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'format',
          message: 'Format must be a string',
        });
      });

      it('should reject invalid format value', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'jpeg',
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'format',
          message: 'Format must be one of: pdf, image, both',
        });
      });

      it('should accept "pdf" format', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'pdf',
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept "image" format', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'image',
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept "both" format', () => {
        const input = {
          participantName: 'John Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
          format: 'both',
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('multiple validation errors', () => {
      it('should return all validation errors when multiple fields are invalid', () => {
        const input = {
          participantName: '',
          role: '   ',
          eventOrInternship: 'A'.repeat(201),
          date: 'invalid-date',
          format: 'jpeg',
        };

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(5);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name cannot be empty or whitespace',
        });
        expect(result.errors).toContainEqual({
          field: 'role',
          message: 'Role cannot be empty or whitespace',
        });
        expect(result.errors).toContainEqual({
          field: 'eventOrInternship',
          message: 'Event Or Internship must not exceed 200 characters',
        });
        expect(result.errors).toContainEqual({
          field: 'date',
          message:
            'Date must be in valid ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
        });
        expect(result.errors).toContainEqual({
          field: 'format',
          message: 'Format must be one of: pdf, image, both',
        });
      });

      it('should return all missing field errors', () => {
        const input = {};

        const result = validator.validateCertificateInput(input);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(5);
        expect(result.errors).toContainEqual({
          field: 'participantName',
          message: 'Participant Name is required',
        });
        expect(result.errors).toContainEqual({
          field: 'role',
          message: 'Role is required',
        });
        expect(result.errors).toContainEqual({
          field: 'eventOrInternship',
          message: 'Event Or Internship is required',
        });
        expect(result.errors).toContainEqual({
          field: 'date',
          message: 'Date is required',
        });
        expect(result.errors).toContainEqual({
          field: 'format',
          message: 'Format is required',
        });
      });
    });
  });
});
