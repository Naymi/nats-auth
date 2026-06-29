/**
 * Structured logging utility for NATS Auth
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`);
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️  [INFO] ${message}`);
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️  [WARN] ${message}`);
    }
  }

  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`);
      if (error) {
        console.error(error.stack);
      }
    }
  }

  success(message: string): void {
    console.log(`✅ ${message}`);
  }

  operation(message: string): void {
    console.log(`🔧 ${message}`);
  }

  generation(message: string): void {
    console.log(`🔐 ${message}`);
  }

  config(message: string): void {
    console.log(`📝 ${message}`);
  }

  cleanup(message: string): void {
    console.log(`🗑️  ${message}`);
  }

  list(message: string): void {
    console.log(`📋 ${message}`);
  }

  stats(message: string): void {
    console.log(`📊 ${message}`);
  }
}

export const logger = new Logger();
