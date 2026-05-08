import mongoose from 'mongoose';
import { DatabaseConnection, getDatabaseConnection } from './database';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    close: jest.fn(),
    on: jest.fn(),
    readyState: 1,
  },
}));

describe('DatabaseConnection', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.MONGODB_DB_NAME = 'test_db';

    jest.clearAllMocks();

    (DatabaseConnection as any).instance = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = getDatabaseConnection();
      const instance2 = getDatabaseConnection();

      expect(instance1).toBe(instance2);
    });

    it('should accept custom options', () => {
      const instance = getDatabaseConnection({
        maxRetries: 3,
        retryDelay: 1000,
      });

      expect(instance).toBeInstanceOf(DatabaseConnection);
    });
  });

  describe('connect', () => {
    it('should connect to MongoDB successfully', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

      const db = getDatabaseConnection();
      await db.connect();

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          dbName: 'test_db',
          maxPoolSize: 10,
          minPoolSize: 2,
        })
      );
    });

    it('should throw error if MONGODB_URI is not defined', async () => {
      delete process.env.MONGODB_URI;

      const db = getDatabaseConnection();

      await expect(db.connect()).rejects.toThrow('MONGODB_URI environment variable is not defined');
    });

    it('should use default database name if MONGODB_DB_NAME is not defined', async () => {
      delete process.env.MONGODB_DB_NAME;
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

      const db = getDatabaseConnection();
      await db.connect();

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          dbName: 'certificate_generator',
        })
      );
    });

    it('should not reconnect if already connected', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

      const db = getDatabaseConnection();
      await db.connect();
      await db.connect();

      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should retry connection on failure', async () => {
      const error = new Error('Connection failed');
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      const db = getDatabaseConnection({ maxRetries: 3, retryDelay: 100 });
      await db.connect();

      expect(mongoose.connect).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries exceeded', async () => {
      const error = new Error('Connection failed');
      (mongoose.connect as jest.Mock).mockRejectedValue(error);

      const db = getDatabaseConnection({ maxRetries: 2, retryDelay: 100 });

      await expect(db.connect()).rejects.toThrow('Failed to connect to MongoDB after 2 attempts');

      expect(mongoose.connect).toHaveBeenCalledTimes(2);
    });

    it('should set up event listeners on successful connection', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

      const db = getDatabaseConnection();
      await db.connect();

      expect(mongoose.connection.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should disconnect from MongoDB successfully', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
      (mongoose.connection.close as jest.Mock).mockResolvedValueOnce(undefined);

      const db = getDatabaseConnection();
      await db.connect();
      await db.disconnect();

      expect(mongoose.connection.close).toHaveBeenCalled();
    });

    it('should not disconnect if not connected', async () => {
      const db = getDatabaseConnection();
      await db.disconnect();

      expect(mongoose.connection.close).not.toHaveBeenCalled();
    });

    it('should throw error if disconnect fails', async () => {
      const error = new Error('Disconnect failed');
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
      (mongoose.connection.close as jest.Mock).mockRejectedValueOnce(error);

      const db = getDatabaseConnection();
      await db.connect();

      await expect(db.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return true when connected', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
      (mongoose.connection as any).readyState = 1;

      const db = getDatabaseConnection();
      await db.connect();

      expect(db.getConnectionStatus()).toBe(true);
    });

    it('should return false when not connected', () => {
      (mongoose.connection as any).readyState = 0;

      const db = getDatabaseConnection();

      expect(db.getConnectionStatus()).toBe(false);
    });
  });

  describe('getConnection', () => {
    it('should return mongoose connection instance', () => {
      const db = getDatabaseConnection();
      const connection = db.getConnection();

      expect(connection).toBe(mongoose.connection);
    });
  });
});
