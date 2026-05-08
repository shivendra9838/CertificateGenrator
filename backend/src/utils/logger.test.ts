import { logger } from './logger';

describe('Logger', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info messages using console.warn', () => {
      logger.info('Test info message');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message'),
        ''
      );
    });

    it('should log info messages with data', () => {
      const data = { key: 'value' };
      logger.info('Test info message', data);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message'),
        data
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages using console.warn', () => {
      logger.warn('Test warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message'),
        ''
      );
    });

    it('should log warning messages with data', () => {
      const data = { key: 'value' };
      logger.warn('Test warning message', data);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message'),
        data
      );
    });
  });

  describe('error', () => {
    it('should log error messages using console.error', () => {
      logger.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message'),
        ''
      );
    });

    it('should log error messages with data', () => {
      const data = { error: 'details' };
      logger.error('Test error message', data);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message'),
        data
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Test debug message');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Test debug message'),
        ''
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logger.debug('Test debug message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
