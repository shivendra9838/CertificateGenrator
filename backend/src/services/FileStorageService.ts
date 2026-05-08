import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileMetadata {
  uniqueId: string;
  format: string;
  generatedAt: Date;
}

export class FileStorageService {
  private readonly baseStoragePath: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelayMs: number = 100;

  constructor(baseStoragePath: string = './certificates') {
    this.baseStoragePath = baseStoragePath;
  }

  generateFilePath(uniqueId: string, format: string, generatedAt: Date = new Date()): string {
    const year = generatedAt.getFullYear().toString();
    const month = (generatedAt.getMonth() + 1).toString().padStart(2, '0');

    const extension = format === 'pdf' ? 'pdf' : 'png';

    const filePath = path.join(this.baseStoragePath, year, month, `${uniqueId}.${extension}`);

    return filePath;
  }

  async saveCertificate(buffer: Buffer, metadata: FileMetadata): Promise<string> {
    const filePath = this.generateFilePath(
      metadata.uniqueId,
      metadata.format,
      metadata.generatedAt
    );

    const directory = path.dirname(filePath);
    await this.ensureDirectoryExists(directory);

    await this.retryOperation(async () => {
      await fs.writeFile(filePath, buffer);
    }, `save certificate to ${filePath}`);

    console.log(`Certificate saved successfully: ${filePath}`);
    return filePath;
  }

  async getCertificate(filePath: string): Promise<Buffer> {
    try {
      await fs.access(filePath);

      const buffer = await fs.readFile(filePath);
      console.log(`Certificate retrieved successfully: ${filePath}`);

      return buffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`Certificate file not found: ${filePath}`);
        throw new Error(`Certificate file not found: ${filePath}`);
      }

      console.error(`Failed to retrieve certificate: ${errorMessage}`, { filePath });
      throw new Error(`Failed to retrieve certificate: ${errorMessage}`);
    }
  }

  async deleteCertificate(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);

      await fs.unlink(filePath);
      console.log(`Certificate deleted successfully: ${filePath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`Certificate file not found for deletion: ${filePath}`);

        return;
      }

      console.error(`Failed to delete certificate: ${errorMessage}`, { filePath });
      throw new Error(`Failed to delete certificate: ${errorMessage}`);
    }
  }

  async ensureDirectoryExists(directoryPath: string): Promise<void> {
    try {
      await fs.access(directoryPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.mkdir(directoryPath, { recursive: true });
        console.log(`Directory created: ${directoryPath}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to ensure directory exists: ${errorMessage}`, { directoryPath });
        throw new Error(`Failed to ensure directory exists: ${errorMessage}`);
      }
    }
  }

  private async retryOperation(
    operation: () => Promise<void>,
    operationName: string
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await operation();

        if (attempt > 1) {
          console.log(`Operation succeeded on attempt ${attempt}: ${operationName}`);
        }
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          console.warn(
            `Operation failed (attempt ${attempt}/${this.maxRetries}): ${operationName}. ` +
              `Retrying in ${delay}ms...`,
            { error: lastError.message }
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const errorMessage = lastError?.message || 'Unknown error';
    console.error(`Operation failed after ${this.maxRetries} attempts: ${operationName}`, {
      error: errorMessage,
    });
    throw new Error(
      `Failed to ${operationName} after ${this.maxRetries} attempts: ${errorMessage}`
    );
  }
}

export const fileStorageService = new FileStorageService(
  process.env.CERTIFICATE_STORAGE_PATH || './certificates'
);
