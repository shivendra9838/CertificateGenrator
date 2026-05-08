import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private readonly logFilePath = process.env.LOG_FILE_PATH || './logs/app.log';
  private readonly logLevel = process.env.LOG_LEVEL || 'info';
  private readonly levelPriority: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    if (level === 'debug' && process.env.NODE_ENV === 'development') {
      return true;
    }

    const configuredLevel = this.logLevel as LogLevel;
    return this.levelPriority[level] <= (this.levelPriority[configuredLevel] ?? 2);
  }

  private formatLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined && { data }),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.formatLogEntry(level, message, data);
    const formattedMessage = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
    this.writeToFile(entry);

    switch (level) {
      case 'error':
        console.error(formattedMessage, data !== undefined ? data : '');
        break;
      case 'warn':
        console.warn(formattedMessage, data !== undefined ? data : '');
        break;
      case 'info':
      case 'debug':
      default:
        console.warn(formattedMessage, data !== undefined ? data : '');
        break;
    }
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const directory = path.dirname(this.logFilePath);
      fs.mkdirSync(directory, { recursive: true });
      fs.appendFileSync(this.logFilePath, `${JSON.stringify(entry)}\n`);
    } catch {
      return;
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }
}

export const logger = new Logger();
