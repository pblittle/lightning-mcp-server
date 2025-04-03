/**
 * BaseError - Foundation class for domain-specific errors
 *
 * This module provides a base error class that all domain-specific errors
 * should extend. It handles automatic sanitization of error messages and
 * metadata, and provides a consistent interface for mapping to MCP errors.
 */

import { sanitizeErrorMessage, sanitizeForLogging } from './sanitize';

/**
 * Interface for options when creating error objects
 */
export interface ErrorOptions {
  /**
   * The error code, used for categorizing and handling errors
   */
  code?: string;

  /**
   * Additional context and information about the error
   */
  metadata?: Record<string, any>;

  /**
   * The original error that caused this error
   */
  cause?: Error | unknown;
}

/**
 * Base error class for all domain-specific errors
 */
export class BaseError extends Error {
  /**
   * The error code
   */
  public readonly code?: string;

  /**
   * Additional context data (already sanitized)
   */
  public readonly metadata?: Record<string, any>;

  /**
   * The original error that caused this error
   */
  public readonly cause?: Error | unknown;

  /**
   * Creates a new base error with automatic sanitization
   *
   * @param message - The error message
   * @param options - Optional settings for the error
   */
  constructor(message: string, options: ErrorOptions = {}) {
    // Sanitize the message during construction
    const sanitizedMessage = sanitizeErrorMessage(message) || 'Unknown error';
    super(sanitizedMessage);

    this.name = this.constructor.name;
    this.code = options.code;

    // Sanitize metadata if provided
    if (options.metadata) {
      this.metadata = sanitizeForLogging(options.metadata);
    }

    this.cause = options.cause;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Maps this error to a standard MCP error response
   * Override in specific error classes for custom mapping
   *
   * @returns An MCP-compatible error object
   */
  public toMcpError(): { code: string; message: string; details?: any } {
    return {
      code: this.code || 'INTERNAL_ERROR',
      message: this.message,
      details: this.metadata,
    };
  }

  /**
   * Ensures proper serialization of the error to JSON
   *
   * @returns A JSON-serializable representation of the error
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      // We intentionally don't include the stack trace or cause in JSON output for security
    };
  }
}
