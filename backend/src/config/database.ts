import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
dotenv.config();

interface ConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  poolSize?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  private constructor(options: ConnectionOptions = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.retryDelay = options.retryDelay || 5000;
  }

  public static getInstance(options?: ConnectionOptions): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(options);
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const connectionOptions: mongoose.ConnectOptions = {
      dbName: dbName || 'certificate_generator',
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    await this.connectWithRetry(mongoUri, connectionOptions);
  }

  private async connectWithRetry(uri: string, options: mongoose.ConnectOptions): Promise<void> {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        this.connectionAttempts++;
        console.log(
          `Attempting to connect to MongoDB (attempt ${this.connectionAttempts}/${this.maxRetries})...`
        );

        await mongoose.connect(uri, options);

        this.isConnected = true;
        this.connectionAttempts = 0;
        console.log('Successfully connected to MongoDB');

        this.setupEventListeners();

        return;
      } catch (error) {
        console.error(
          `MongoDB connection attempt ${this.connectionAttempts} failed:`,
          error instanceof Error ? error.message : 'Unknown error'
        );

        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(
            `Failed to connect to MongoDB after ${this.maxRetries} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }

        console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay);
      }
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('Mongoose connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log('Database is not connected');
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('Successfully disconnected from MongoDB');
    } catch (error) {
      console.error(
        'Error disconnecting from MongoDB:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const getDatabaseConnection = (options?: ConnectionOptions) =>
  DatabaseConnection.getInstance(options);

export const connectToDatabase = async (options?: ConnectionOptions): Promise<void> => {
  const dbConnection = getDatabaseConnection(options);
  await dbConnection.connect();
};

export { DatabaseConnection };
