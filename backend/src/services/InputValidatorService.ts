export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CertificateInput {
  participantName?: any;
  role?: any;
  eventOrInternship?: any;
  date?: any;
  format?: any;
}

export class InputValidatorService {
  validateCertificateInput(data: CertificateInput): ValidationResult {
    const errors: ValidationError[] = [];

    const participantNameError = this.validateRequiredField(
      data.participantName,
      'participantName',
      1,
      200
    );
    if (participantNameError) {
      errors.push(participantNameError);
    }

    const roleError = this.validateRequiredField(data.role, 'role', 1, 100);
    if (roleError) {
      errors.push(roleError);
    }

    const eventError = this.validateRequiredField(
      data.eventOrInternship,
      'eventOrInternship',
      1,
      200
    );
    if (eventError) {
      errors.push(eventError);
    }

    const dateError = this.validateDateField(data.date);
    if (dateError) {
      errors.push(dateError);
    }

    const formatError = this.validateFormatField(data.format);
    if (formatError) {
      errors.push(formatError);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateRequiredField(
    value: any,
    fieldName: string,
    minLength: number,
    maxLength: number
  ): ValidationError | null {
    if (value === undefined || value === null) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} is required`,
      };
    }

    if (typeof value !== 'string') {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} must be a string`,
      };
    }

    if (value.trim().length === 0) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} cannot be empty or whitespace`,
      };
    }

    if (value.length < minLength) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} must be at least ${minLength} character(s)`,
      };
    }

    if (value.length > maxLength) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} must not exceed ${maxLength} characters`,
      };
    }

    return null;
  }

  private validateDateField(value: any): ValidationError | null {
    if (value === undefined || value === null) {
      return {
        field: 'date',
        message: 'Date is required',
      };
    }

    if (typeof value !== 'string') {
      return {
        field: 'date',
        message: 'Date must be a string',
      };
    }

    if (value.trim().length === 0) {
      return {
        field: 'date',
        message: 'Date cannot be empty',
      };
    }

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;

    if (!iso8601Regex.test(value)) {
      return {
        field: 'date',
        message:
          'Date must be in valid ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
      };
    }

    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) {
      return {
        field: 'date',
        message: 'Date must be a valid date',
      };
    }

    const datePart = value.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    if (
      dateObj.getUTCFullYear() !== year ||
      dateObj.getUTCMonth() + 1 !== month ||
      dateObj.getUTCDate() !== day
    ) {
      return {
        field: 'date',
        message: 'Date must be a valid date',
      };
    }

    return null;
  }

  private validateFormatField(value: any): ValidationError | null {
    if (value === undefined || value === null) {
      return {
        field: 'format',
        message: 'Format is required',
      };
    }

    if (typeof value !== 'string') {
      return {
        field: 'format',
        message: 'Format must be a string',
      };
    }

    const validFormats = ['pdf', 'image', 'both'];
    if (!validFormats.includes(value)) {
      return {
        field: 'format',
        message: `Format must be one of: ${validFormats.join(', ')}`,
      };
    }

    return null;
  }

  private formatFieldName(fieldName: string): string {
    const formatted = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    return formatted;
  }
}

export const inputValidatorService = new InputValidatorService();
